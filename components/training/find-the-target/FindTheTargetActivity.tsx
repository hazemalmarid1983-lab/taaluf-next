'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import FindTheTargetComplete from '@/components/training/find-the-target/FindTheTargetComplete';
import FindTheTargetPlayArea from '@/components/training/find-the-target/FindTheTargetPlayArea';
import FindTheTargetWelcome from '@/components/training/find-the-target/FindTheTargetWelcome';
import { childFacingStars } from '@/lib/training/followStarEngine';
import {
  buildFindTheTargetTrialSpec,
  deriveFindTheTargetFieldSeed,
  resolveFindTheTargetRuntimeSettings,
  type FindTheTargetTrialOutcome,
} from '@/lib/training/findTheTargetEngine';
import {
  beginFindTheTargetSession,
  commitFindTheTargetTrial,
  finalizeFindTheTargetSession,
  isFindTheTargetSessionComplete,
  startFindTheTargetTrial,
} from '@/lib/training/findTheTargetSessionFlow';
import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '@/lib/training/loadChapter';
import {
  calculateSessionMetrics,
  requireTrainingMedia,
  resolveMediaRuntimeConfig,
} from '@/lib/training/engine';
import PlanActivityGuardMessage from '@/components/training/PlanActivityGuardMessage';
import {
  persistSessionAndAdvancePlan,
  preparePlanActivityBegin,
  resolveTrainingActivityCompletionHref,
} from '@/lib/training/planActivityIntegration';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';

type ActivityPhase = 'welcome' | 'playing' | 'complete' | 'blocked';
type BlockReason = 'missing_child' | 'invalid_launch';

export default function FindTheTargetActivity() {
  const router = useRouter();
  const media = useMemo(() => {
    const chapter = loadAttentionFocusChapter();
    return requireTrainingMedia(chapter, 'find-the-target');
  }, []);

  const [phase, setPhase] = useState<ActivityPhase>('welcome');
  const [sessionBundle, setSessionBundle] = useState<ReturnType<
    typeof beginFindTheTargetSession
  > | null>(null);
  const [session, setSession] = useState<TrainingSessionRuntime | null>(null);
  const [resultStars, setResultStars] = useState(1);
  const [sessionSaved, setSessionSaved] = useState(true);
  const [blockReason, setBlockReason] = useState<BlockReason | null>(null);

  const welcomeSample = useMemo(() => {
    const config = resolveMediaRuntimeConfig(media);
    const settings = resolveFindTheTargetRuntimeSettings(config);
    return buildFindTheTargetTrialSpec(settings, 1, 1).target;
  }, [media]);

  const fieldSeed = useMemo(
    () =>
      session?.id
        ? deriveFindTheTargetFieldSeed(session.id)
        : deriveFindTheTargetFieldSeed('preview'),
    [session?.id]
  );

  const handleStart = useCallback(() => {
    const begin = preparePlanActivityBegin({ pageMediaId: media.mediaId });
    if (!begin.ok) {
      setBlockReason(begin.reason);
      setPhase('blocked');
      return;
    }

    const bundle = beginFindTheTargetSession({
      childId: begin.childId,
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
      planId: begin.planId,
      goalIds: begin.goalIds,
      sessionDifficulty: begin.sessionDifficulty,
    });
    const started = startFindTheTargetTrial(bundle.session);
    setSessionBundle(bundle);
    setSession(started);
    setPhase('playing');
  }, [media]);

  const handleTrialComplete = useCallback(
    (outcome: FindTheTargetTrialOutcome) => {
      if (!session) return;

      let nextSession = commitFindTheTargetTrial(session, outcome);

      if (isFindTheTargetSessionComplete(nextSession)) {
        nextSession = finalizeFindTheTargetSession(nextSession);
        const metrics = calculateSessionMetrics(nextSession.trials);
        setResultStars(childFacingStars(metrics.accuracy));

        try {
          persistSessionAndAdvancePlan(nextSession);
          setSessionSaved(true);
        } catch (error) {
          console.error(
            '[taaluf-training] persistCompletedTrainingSession failed',
            error
          );
          setSessionSaved(false);
        }

        setSession(nextSession);
        setPhase('complete');
        return;
      }

      nextSession = startFindTheTargetTrial(nextSession);
      setSession(nextSession);
    },
    [session]
  );

  const handleDone = useCallback(() => {
    router.push(resolveTrainingActivityCompletionHref(session?.planId));
  }, [router, session?.planId]);

  if (phase === 'blocked' && blockReason) {
    return <PlanActivityGuardMessage reason={blockReason} />;
  }

  if (phase === 'welcome') {
    return (
      <FindTheTargetWelcome
        title={media.titleAr}
        sampleTarget={welcomeSample}
        onStart={handleStart}
      />
    );
  }

  if (phase === 'complete' && session) {
    return (
      <FindTheTargetComplete
        stars={resultStars}
        sessionSaved={sessionSaved}
        onDone={handleDone}
      />
    );
  }

  if (phase === 'playing' && session && sessionBundle) {
    const trialNumber =
      session.activeTrialNumber ?? session.trials.length + 1;

    return (
      <FindTheTargetPlayArea
        settings={sessionBundle.settings}
        trialNumber={trialNumber}
        totalTrials={session.targetTrialCount}
        fieldSeed={fieldSeed}
        onTrialComplete={handleTrialComplete}
      />
    );
  }

  return null;
}

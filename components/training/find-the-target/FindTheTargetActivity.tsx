'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import FindTheTargetComplete from '@/components/training/find-the-target/FindTheTargetComplete';
import FindTheTargetPlayArea from '@/components/training/find-the-target/FindTheTargetPlayArea';
import FindTheTargetWelcome from '@/components/training/find-the-target/FindTheTargetWelcome';
import { withChosenPostSessionMood } from '@/components/training/PostSessionMoodHost';
import { useActivityLevelGate } from '@/components/training/useActivityLevelGate';
import { childFacingStars } from '@/lib/training/followStarEngine';
import {
  buildFindTheTargetTrialSpec,
  deriveFindTheTargetFieldSeed,
  findTheTargetSettingsForLevel,
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
import { prepareLiveActivitySession } from '@/lib/training/liveSessionDraft';
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
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const { level, recordSession } = useActivityLevelGate({
    childId: activeChildId,
    mediaId: media.mediaId,
    chapterId: ATTENTION_FOCUS_CHAPTER_ID,
  });

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

  const handleStart = useCallback(async () => {
    const begin = preparePlanActivityBegin({ pageMediaId: media.mediaId });
    if (!begin.ok) {
      setBlockReason(begin.reason);
      setPhase('blocked');
      return;
    }

    setActiveChildId(begin.childId);
    const bundle = beginFindTheTargetSession({
      childId: begin.childId,
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
      planId: begin.planId,
      goalIds: begin.goalIds,
      sessionDifficulty: begin.sessionDifficulty,
    });
    const opened = prepareLiveActivitySession(
      bundle.session,
      startFindTheTargetTrial
    );
    if (opened.action === 'finalize') {
      const nextSession = finalizeFindTheTargetSession(opened.session);
      const metrics = calculateSessionMetrics(nextSession.trials);
      setResultStars(childFacingStars(metrics.accuracy));
      const withMood = await withChosenPostSessionMood(nextSession);
      try {
        persistSessionAndAdvancePlan(withMood);
        setSessionSaved(true);
      } catch (error) {
        console.error(
          '[taaluf-training] persistCompletedTrainingSession failed',
          error
        );
        setSessionSaved(false);
      }
      setSession(withMood);
      setPhase('complete');
      return;
    }
    const started = opened.session;
    setSessionBundle({ ...bundle, session: started });
    setSession(started);
    setPhase('playing');
  }, [media]);

  const handleTrialComplete = useCallback(
    async (outcome: FindTheTargetTrialOutcome) => {
      if (!session) return;

      let nextSession = commitFindTheTargetTrial(session, outcome);

      if (isFindTheTargetSessionComplete(nextSession)) {
        nextSession = finalizeFindTheTargetSession(nextSession);
        recordSession(nextSession.trials);
        const metrics = calculateSessionMetrics(nextSession.trials);
        setResultStars(childFacingStars(metrics.accuracy));

        const withMood = await withChosenPostSessionMood(nextSession);
        try {
          persistSessionAndAdvancePlan(withMood);
          setSessionSaved(true);
        } catch (error) {
          console.error(
            '[taaluf-training] persistCompletedTrainingSession failed',
            error
          );
          setSessionSaved(false);
        }

        setSession(withMood);
        setPhase('complete');
        return;
      }

      nextSession = startFindTheTargetTrial(nextSession);
      setSession(nextSession);
    },
    [recordSession, session]
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
        settings={findTheTargetSettingsForLevel(sessionBundle.settings, level)}
        level={level}
        trialNumber={trialNumber}
        totalTrials={session.targetTrialCount}
        fieldSeed={fieldSeed}
        onTrialComplete={handleTrialComplete}
      />
    );
  }

  return null;
}

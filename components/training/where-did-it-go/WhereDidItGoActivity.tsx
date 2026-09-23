'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import WhereDidItGoComplete from '@/components/training/where-did-it-go/WhereDidItGoComplete';
import WhereDidItGoPlayArea from '@/components/training/where-did-it-go/WhereDidItGoPlayArea';
import WhereDidItGoWelcome from '@/components/training/where-did-it-go/WhereDidItGoWelcome';
import { childFacingStars } from '@/lib/training/followStarEngine';
import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '@/lib/training/loadChapter';
import {
  calculateSessionMetrics,
  requireTrainingMedia,
  resolveMediaRuntimeConfig,
} from '@/lib/training/engine';
import {
  buildWhereDidItGoTrialSpec,
  resolveWhereDidItGoRuntimeSettings,
  type WhereDidItGoTrialOutcome,
} from '@/lib/training/whereDidItGoEngine';
import {
  beginWhereDidItGoSession,
  commitWhereDidItGoTrial,
  finalizeWhereDidItGoSession,
  isWhereDidItGoSessionComplete,
  startWhereDidItGoTrial,
} from '@/lib/training/whereDidItGoSessionFlow';
import { prepareLiveActivitySession } from '@/lib/training/liveSessionDraft';
import PlanActivityGuardMessage from '@/components/training/PlanActivityGuardMessage';
import {
  persistSessionAndAdvancePlan,
  preparePlanActivityBegin,
  resolveTrainingActivityCompletionHref,
} from '@/lib/training/planActivityIntegration';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';

type ActivityPhase = 'welcome' | 'playing' | 'complete' | 'blocked';
type BlockReason = 'missing_child' | 'invalid_launch';

export default function WhereDidItGoActivity() {
  const router = useRouter();
  const media = useMemo(() => {
    const chapter = loadAttentionFocusChapter();
    return requireTrainingMedia(chapter, 'where-did-it-go');
  }, []);

  const [phase, setPhase] = useState<ActivityPhase>('welcome');
  const [sessionBundle, setSessionBundle] = useState<ReturnType<
    typeof beginWhereDidItGoSession
  > | null>(null);
  const [session, setSession] = useState<TrainingSessionRuntime | null>(null);
  const [resultStars, setResultStars] = useState(1);
  const [sessionSaved, setSessionSaved] = useState(true);
  const [blockReason, setBlockReason] = useState<BlockReason | null>(null);

  const welcomeSample = useMemo(() => {
    const config = resolveMediaRuntimeConfig(media);
    const settings = resolveWhereDidItGoRuntimeSettings(config);
    return buildWhereDidItGoTrialSpec(settings, 1).target;
  }, [media]);

  const handleStart = useCallback(() => {
    const begin = preparePlanActivityBegin({ pageMediaId: media.mediaId });
    if (!begin.ok) {
      setBlockReason(begin.reason);
      setPhase('blocked');
      return;
    }

    const bundle = beginWhereDidItGoSession({
      childId: begin.childId,
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
      planId: begin.planId,
      goalIds: begin.goalIds,
      sessionDifficulty: begin.sessionDifficulty,
    });
    const opened = prepareLiveActivitySession(
      bundle.session,
      startWhereDidItGoTrial
    );
    if (opened.action === 'finalize') {
      const nextSession = finalizeWhereDidItGoSession(opened.session);
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
    const started = opened.session;
    setSessionBundle({ ...bundle, session: started });
    setSession(started);
    setPhase('playing');
  }, [media]);

  const handleTrialComplete = useCallback(
    (outcome: WhereDidItGoTrialOutcome) => {
      if (!session) return;

      let nextSession = commitWhereDidItGoTrial(session, outcome);

      if (isWhereDidItGoSessionComplete(nextSession)) {
        nextSession = finalizeWhereDidItGoSession(nextSession);
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

      nextSession = startWhereDidItGoTrial(nextSession);
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
      <WhereDidItGoWelcome
        title={media.titleAr}
        sampleTarget={welcomeSample}
        onStart={handleStart}
      />
    );
  }

  if (phase === 'complete' && session) {
    return (
      <WhereDidItGoComplete
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
      <WhereDidItGoPlayArea
        settings={sessionBundle.settings}
        trialNumber={trialNumber}
        totalTrials={session.targetTrialCount}
        onTrialComplete={handleTrialComplete}
      />
    );
  }

  return null;
}

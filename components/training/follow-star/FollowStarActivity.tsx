'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import FollowStarComplete from '@/components/training/follow-star/FollowStarComplete';
import FollowStarPlayArea from '@/components/training/follow-star/FollowStarPlayArea';
import FollowStarWelcome from '@/components/training/follow-star/FollowStarWelcome';
import { childFacingStars, deriveFollowStarPathOrderSeed } from '@/lib/training/followStarEngine';
import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '@/lib/training/loadChapter';
import { requireTrainingMedia } from '@/lib/training/engine';
import {
  beginFollowStarSession,
  commitFollowStarTrial,
  finalizeFollowStarSession,
  isFollowStarSessionComplete,
  startFollowStarTrial,
} from '@/lib/training/followStarSessionFlow';
import type { FollowStarTrialOutcome } from '@/lib/training/followStarEngine';
import PlanActivityGuardMessage from '@/components/training/PlanActivityGuardMessage';
import {
  persistSessionAndAdvancePlan,
  preparePlanActivityBegin,
  resolveTrainingActivityCompletionHref,
} from '@/lib/training/planActivityIntegration';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';
import { calculateSessionMetrics } from '@/lib/training/engine';

type ActivityPhase = 'welcome' | 'playing' | 'complete' | 'blocked';
type BlockReason = 'missing_child' | 'invalid_launch';

export default function FollowStarActivity() {
  const router = useRouter();
  const media = useMemo(() => {
    const chapter = loadAttentionFocusChapter();
    return requireTrainingMedia(chapter, 'follow-star');
  }, []);

  const [phase, setPhase] = useState<ActivityPhase>('welcome');
  const [sessionBundle, setSessionBundle] = useState<ReturnType<
    typeof beginFollowStarSession
  > | null>(null);
  const [session, setSession] = useState<TrainingSessionRuntime | null>(null);
  const [resultStars, setResultStars] = useState(1);
  const [sessionSaved, setSessionSaved] = useState(true);
  const [blockReason, setBlockReason] = useState<BlockReason | null>(null);
  const pathOrderSeed = useMemo(
    () =>
      session?.id
        ? deriveFollowStarPathOrderSeed(session.id)
        : deriveFollowStarPathOrderSeed('preview'),
    [session?.id]
  );

  const handleStart = useCallback(() => {
    const begin = preparePlanActivityBegin({ pageMediaId: media.mediaId });
    if (!begin.ok) {
      setBlockReason(begin.reason);
      setPhase('blocked');
      return;
    }

    const bundle = beginFollowStarSession({
      childId: begin.childId,
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
      planId: begin.planId,
      goalIds: begin.goalIds,
      sessionDifficulty: begin.sessionDifficulty,
    });
    const started = startFollowStarTrial(bundle.session);
    setSessionBundle(bundle);
    setSession(started);
    setPhase('playing');
  }, [media]);

  const handleTrialComplete = useCallback(
    (outcome: FollowStarTrialOutcome) => {
      if (!session) return;

      let nextSession = commitFollowStarTrial(session, outcome);

      if (isFollowStarSessionComplete(nextSession)) {
        nextSession = finalizeFollowStarSession(nextSession);
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

      nextSession = startFollowStarTrial(nextSession);
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
      <FollowStarWelcome title={media.titleAr} onStart={handleStart} />
    );
  }

  if (phase === 'complete' && session) {
    return (
      <FollowStarComplete
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
      <FollowStarPlayArea
        settings={sessionBundle.settings}
        trialNumber={trialNumber}
        totalTrials={session.targetTrialCount}
        pathOrderSeed={pathOrderSeed}
        onTrialComplete={handleTrialComplete}
      />
    );
  }

  return null;
}

export function previewFollowStarMetrics(session: TrainingSessionRuntime) {
  return calculateSessionMetrics(session.trials);
}

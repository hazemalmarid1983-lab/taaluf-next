'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import FollowStarComplete from '@/components/training/follow-star/FollowStarComplete';
import FollowStarPlayArea from '@/components/training/follow-star/FollowStarPlayArea';
import FollowStarWelcome from '@/components/training/follow-star/FollowStarWelcome';
import { withChosenPostSessionMood } from '@/components/training/PostSessionMoodHost';
import { useActivityLevelGate } from '@/components/training/useActivityLevelGate';
import { childFacingStars, deriveFollowStarPathOrderSeed, followStarSettingsForLevel } from '@/lib/training/followStarEngine';
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
import { prepareLiveActivitySession } from '@/lib/training/liveSessionDraft';

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
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const { level, recordSession } = useActivityLevelGate({
    childId: activeChildId,
    mediaId: media.mediaId,
    chapterId: ATTENTION_FOCUS_CHAPTER_ID,
  });
  const pathOrderSeed = useMemo(
    () =>
      session?.id
        ? deriveFollowStarPathOrderSeed(session.id)
        : deriveFollowStarPathOrderSeed('preview'),
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
    const bundle = beginFollowStarSession({
      childId: begin.childId,
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
      planId: begin.planId,
      goalIds: begin.goalIds,
      sessionDifficulty: begin.sessionDifficulty,
    });
    const opened = prepareLiveActivitySession(
      bundle.session,
      startFollowStarTrial
    );
    if (opened.action === 'finalize') {
      const nextSession = finalizeFollowStarSession(opened.session);
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
    async (outcome: FollowStarTrialOutcome) => {
      if (!session) return;

      let nextSession = commitFollowStarTrial(session, outcome);

      if (isFollowStarSessionComplete(nextSession)) {
        nextSession = finalizeFollowStarSession(nextSession);
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

      nextSession = startFollowStarTrial(nextSession);
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
        settings={followStarSettingsForLevel(sessionBundle.settings, level)}
        level={level}
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

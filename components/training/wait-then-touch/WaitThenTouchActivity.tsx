'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import WaitThenTouchComplete from '@/components/training/wait-then-touch/WaitThenTouchComplete';
import WaitThenTouchPlayArea from '@/components/training/wait-then-touch/WaitThenTouchPlayArea';
import WaitThenTouchWelcome from '@/components/training/wait-then-touch/WaitThenTouchWelcome';
import { withChosenPostSessionMood } from '@/components/training/PostSessionMoodHost';
import { useActivityLevelGate } from '@/components/training/useActivityLevelGate';
import { childFacingStars } from '@/lib/training/followStarEngine';
import {
  buildWaitThenTouchTrialSpec,
  deriveWaitThenTouchSessionSeed,
  resolveWaitThenTouchRuntimeSettings,
  waitThenTouchSettingsForLevel,
  type WaitThenTouchTrialOutcome,
} from '@/lib/training/waitThenTouchEngine';
import {
  beginWaitThenTouchSession,
  commitWaitThenTouchTrial,
  finalizeWaitThenTouchSession,
  isWaitThenTouchSessionComplete,
  startWaitThenTouchTrial,
} from '@/lib/training/waitThenTouchSessionFlow';
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

export default function WaitThenTouchActivity() {
  const router = useRouter();
  const media = useMemo(() => {
    const chapter = loadAttentionFocusChapter();
    return requireTrainingMedia(chapter, 'wait-then-touch');
  }, []);

  const [phase, setPhase] = useState<ActivityPhase>('welcome');
  const [sessionBundle, setSessionBundle] = useState<ReturnType<
    typeof beginWaitThenTouchSession
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
    const settings = resolveWaitThenTouchRuntimeSettings(config);
    return buildWaitThenTouchTrialSpec(settings, 1, 1).target;
  }, [media]);

  const sessionSeed = useMemo(
    () =>
      session?.id
        ? deriveWaitThenTouchSessionSeed(session.id)
        : deriveWaitThenTouchSessionSeed('preview'),
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
    const bundle = beginWaitThenTouchSession({
      childId: begin.childId,
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
      planId: begin.planId,
      goalIds: begin.goalIds,
      sessionDifficulty: begin.sessionDifficulty,
    });
    const opened = prepareLiveActivitySession(
      bundle.session,
      startWaitThenTouchTrial
    );
    if (opened.action === 'finalize') {
      const nextSession = finalizeWaitThenTouchSession(opened.session);
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
    async (outcome: WaitThenTouchTrialOutcome) => {
      if (!session) return;

      let nextSession = commitWaitThenTouchTrial(session, outcome);

      if (isWaitThenTouchSessionComplete(nextSession)) {
        nextSession = finalizeWaitThenTouchSession(nextSession);
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

      nextSession = startWaitThenTouchTrial(nextSession);
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
      <WaitThenTouchWelcome
        title={media.titleAr}
        sampleTarget={welcomeSample}
        onStart={handleStart}
      />
    );
  }

  if (phase === 'complete' && session) {
    return (
      <WaitThenTouchComplete
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
      <WaitThenTouchPlayArea
        settings={waitThenTouchSettingsForLevel(sessionBundle.settings, level)}
        level={level}
        trialNumber={trialNumber}
        totalTrials={session.targetTrialCount}
        sessionSeed={sessionSeed}
        onTrialComplete={handleTrialComplete}
      />
    );
  }

  return null;
}

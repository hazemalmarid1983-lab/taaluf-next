'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ObserverImitationComplete from '@/components/training/observer-imitation/ObserverImitationComplete';
import ObserverImitationPlayArea from '@/components/training/observer-imitation/ObserverImitationPlayArea';
import ObserverImitationWelcome from '@/components/training/observer-imitation/ObserverImitationWelcome';
import { withChosenPostSessionMood } from '@/components/training/PostSessionMoodHost';
import { useActivityLevelGate } from '@/components/training/useActivityLevelGate';
import PlanActivityGuardMessage from '@/components/training/PlanActivityGuardMessage';
import { calculateSessionMetrics, requireTrainingMedia } from '@/lib/training/engine';
import {
  MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
  loadMotorSocialImitationChapter,
} from '@/lib/training/loadChapter';
import {
  OBSERVER_IMITATION_MEDIA_ID,
  observerModelDurationForLevel,
  resolveObserverImitationTrialMovement,
  type ObserverImitationTrialOutcome,
} from '@/lib/training/observerImitationEngine';
import {
  beginObserverImitationSession,
  commitObserverImitationTrial,
  finalizeObserverImitationSession,
  isObserverImitationSessionComplete,
  startObserverImitationTrial,
} from '@/lib/training/observerImitationSessionFlow';
import {
  persistSessionAndAdvancePlan,
  preparePlanActivityBegin,
  resolveTrainingActivityCompletionHref,
} from '@/lib/training/planActivityIntegration';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';
import type { ObserverImitationRuntimeSettings } from '@/lib/training/observerImitationEngine';
import { prepareLiveActivitySession } from '@/lib/training/liveSessionDraft';

type ActivityPhase = 'welcome' | 'playing' | 'complete' | 'blocked';
type BlockReason = 'missing_child' | 'invalid_launch';

export default function ObserverImitationActivity() {
  const router = useRouter();
  const media = useMemo(() => {
    const chapter = loadMotorSocialImitationChapter();
    return requireTrainingMedia(chapter, OBSERVER_IMITATION_MEDIA_ID);
  }, []);

  const [phase, setPhase] = useState<ActivityPhase>('welcome');
  const [settings, setSettings] = useState<ObserverImitationRuntimeSettings | null>(
    null
  );
  const [session, setSession] = useState<TrainingSessionRuntime | null>(null);
  const [activeTrial, setActiveTrial] = useState(1);
  const [sessionSaved, setSessionSaved] = useState(true);
  const [blockReason, setBlockReason] = useState<BlockReason | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const { level, recordSession } = useActivityLevelGate({
    childId: activeChildId,
    mediaId: media.mediaId,
    chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
  });
  const [summary, setSummary] = useState({
    accuracy: 0,
    independence: 0,
    totalTrials: 0,
  });

  const handleStart = useCallback(async () => {
    const begin = preparePlanActivityBegin({
      pageMediaId: media.mediaId,
    });
    if (!begin.ok) {
      setBlockReason(begin.reason);
      setPhase('blocked');
      return;
    }

    setActiveChildId(begin.childId);
    const bundle = beginObserverImitationSession({
      childId: begin.childId,
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      media,
      planId: begin.planId,
      goalIds: begin.goalIds,
      skillIds: begin.skillIds,
      sessionDifficulty: begin.sessionDifficulty,
    });
    const opened = prepareLiveActivitySession(
      bundle.session,
      startObserverImitationTrial
    );
    if (opened.action === 'finalize') {
      const nextSession = finalizeObserverImitationSession(opened.session);
      const metrics = calculateSessionMetrics(nextSession.trials);
      setSummary({
        accuracy: metrics.accuracy,
        independence: metrics.independence,
        totalTrials: metrics.totalTrials,
      });
      const withMood = await withChosenPostSessionMood(nextSession);
      try {
        persistSessionAndAdvancePlan(withMood);
        setSessionSaved(true);
      } catch (error) {
        console.error('[taaluf-training] observer-imitation persist failed', error);
        setSessionSaved(false);
      }
      setSession(withMood);
      setPhase('complete');
      return;
    }
    const started = opened.session;
    setSettings(bundle.settings);
    setSession(started);
    setActiveTrial(started.activeTrialNumber ?? started.trials.length + 1);
    setPhase('playing');
  }, [media]);

  const handleTrialComplete = useCallback(
    async (outcome: ObserverImitationTrialOutcome) => {
      if (!session || !settings) return;

      let nextSession = commitObserverImitationTrial(session, outcome);

      if (isObserverImitationSessionComplete(nextSession)) {
        nextSession = finalizeObserverImitationSession(nextSession);
        recordSession(nextSession.trials);
        const metrics = calculateSessionMetrics(nextSession.trials);
        setSummary({
          accuracy: metrics.accuracy,
          independence: metrics.independence,
          totalTrials: metrics.totalTrials,
        });

        const withMood = await withChosenPostSessionMood(nextSession);
        try {
          persistSessionAndAdvancePlan(withMood);
          setSessionSaved(true);
        } catch (error) {
          console.error('[taaluf-training] observer-imitation persist failed', error);
          setSessionSaved(false);
        }

        setSession(withMood);
        setPhase('complete');
        return;
      }

      nextSession = startObserverImitationTrial(nextSession);
      setSession(nextSession);
      setActiveTrial(nextSession.activeTrialNumber ?? nextSession.trials.length + 1);
    },
    [recordSession, session, settings]
  );

  const movement = useMemo(() => {
    if (!settings || !session) return null;
    return resolveObserverImitationTrialMovement(settings, activeTrial);
  }, [settings, session, activeTrial]);

  if (phase === 'blocked' && blockReason) {
    return <PlanActivityGuardMessage reason={blockReason} />;
  }

  if (phase === 'welcome') {
    return <ObserverImitationWelcome onStart={handleStart} />;
  }

  if (phase === 'complete' && session) {
    return (
      <ObserverImitationComplete
        accuracy={summary.accuracy}
        independence={summary.independence}
        totalTrials={summary.totalTrials}
        sessionSaved={sessionSaved}
        onDone={() => {
          router.push(resolveTrainingActivityCompletionHref(session.planId));
        }}
      />
    );
  }

  if (phase === 'playing' && settings && movement && session) {
    return (
      <ObserverImitationPlayArea
        movement={movement}
        trialNumber={activeTrial}
        totalTrials={settings.trialCount}
        modelDurationMs={observerModelDurationForLevel(settings.modelDurationMs, level)}
        level={level}
        replayAllowed={settings.replayAllowedDefault}
        onTrialComplete={handleTrialComplete}
      />
    );
  }

  return null;
}

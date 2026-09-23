'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ObserverImitationComplete from '@/components/training/observer-imitation/ObserverImitationComplete';
import ObserverImitationPlayArea from '@/components/training/observer-imitation/ObserverImitationPlayArea';
import ObserverImitationWelcome from '@/components/training/observer-imitation/ObserverImitationWelcome';
import PlanActivityGuardMessage from '@/components/training/PlanActivityGuardMessage';
import { calculateSessionMetrics, requireTrainingMedia } from '@/lib/training/engine';
import {
  MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
  loadMotorSocialImitationChapter,
} from '@/lib/training/loadChapter';
import {
  OBSERVER_IMITATION_MEDIA_ID,
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
  const [summary, setSummary] = useState({
    accuracy: 0,
    independence: 0,
    totalTrials: 0,
  });

  const handleStart = useCallback(() => {
    const begin = preparePlanActivityBegin({
      pageMediaId: media.mediaId,
    });
    if (!begin.ok) {
      setBlockReason(begin.reason);
      setPhase('blocked');
      return;
    }

    const bundle = beginObserverImitationSession({
      childId: begin.childId,
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      media,
      planId: begin.planId,
      goalIds: begin.goalIds,
      skillIds: begin.skillIds,
      sessionDifficulty: begin.sessionDifficulty,
    });
    const started = startObserverImitationTrial(bundle.session);
    setSettings(bundle.settings);
    setSession(started);
    setActiveTrial(started.activeTrialNumber ?? 1);
    setPhase('playing');
  }, [media]);

  const handleTrialComplete = useCallback(
    (outcome: ObserverImitationTrialOutcome) => {
      if (!session || !settings) return;

      let nextSession = commitObserverImitationTrial(session, outcome);

      if (isObserverImitationSessionComplete(nextSession)) {
        nextSession = finalizeObserverImitationSession(nextSession);
        const metrics = calculateSessionMetrics(nextSession.trials);
        setSummary({
          accuracy: metrics.accuracy,
          independence: metrics.independence,
          totalTrials: metrics.totalTrials,
        });

        try {
          persistSessionAndAdvancePlan(nextSession);
          setSessionSaved(true);
        } catch (error) {
          console.error('[taaluf-training] observer-imitation persist failed', error);
          setSessionSaved(false);
        }

        setSession(nextSession);
        setPhase('complete');
        return;
      }

      nextSession = startObserverImitationTrial(nextSession);
      setSession(nextSession);
      setActiveTrial(nextSession.activeTrialNumber ?? nextSession.trials.length + 1);
    },
    [session, settings]
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
        modelDurationMs={settings.modelDurationMs}
        replayAllowed={settings.replayAllowedDefault}
        onTrialComplete={handleTrialComplete}
      />
    );
  }

  return null;
}

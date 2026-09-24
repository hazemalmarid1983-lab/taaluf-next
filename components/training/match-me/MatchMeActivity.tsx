'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import MatchMeComplete from '@/components/training/match-me/MatchMeComplete';
import MatchMePlayArea from '@/components/training/match-me/MatchMePlayArea';
import MatchMeWelcome from '@/components/training/match-me/MatchMeWelcome';
import { useActivityLevelGate } from '@/components/training/useActivityLevelGate';
import { childFacingStars } from '@/lib/training/followStarEngine';
import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '@/lib/training/loadChapter';
import { requireTrainingMedia, calculateSessionMetrics, resolveMediaRuntimeConfig } from '@/lib/training/engine';
import { buildMatchMeTrialSpec, matchMeSettingsForLevel, resolveMatchMeRuntimeSettings } from '@/lib/training/matchMeEngine';
import {
  beginMatchMeSession,
  commitMatchMeTrial,
  finalizeMatchMeSession,
  isMatchMeSessionComplete,
  startMatchMeTrial,
} from '@/lib/training/matchMeSessionFlow';
import type { MatchMeTrialOutcome } from '@/lib/training/matchMeEngine';
import PlanActivityGuardMessage from '@/components/training/PlanActivityGuardMessage';
import {
  persistSessionAndAdvancePlan,
  preparePlanActivityBegin,
  resolveTrainingActivityCompletionHref,
} from '@/lib/training/planActivityIntegration';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';
import { prepareLiveActivitySession } from '@/lib/training/liveSessionDraft';

type ActivityPhase = 'welcome' | 'playing' | 'complete' | 'blocked';
type BlockReason = 'missing_child' | 'invalid_launch';

export default function MatchMeActivity() {
  const router = useRouter();
  const media = useMemo(() => {
    const chapter = loadAttentionFocusChapter();
    return requireTrainingMedia(chapter, 'match-me');
  }, []);

  const [phase, setPhase] = useState<ActivityPhase>('welcome');
  const [sessionBundle, setSessionBundle] = useState<ReturnType<
    typeof beginMatchMeSession
  > | null>(null);
  const [session, setSession] = useState<TrainingSessionRuntime | null>(null);
  const [resultStars, setResultStars] = useState(1);
  const [sessionSaved, setSessionSaved] = useState(true);
  const [blockReason, setBlockReason] = useState<BlockReason | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const { level, recordAttempt } = useActivityLevelGate({
    childId: activeChildId,
    mediaId: media.mediaId,
    chapterId: ATTENTION_FOCUS_CHAPTER_ID,
  });

  const welcomeSample = useMemo(() => {
    const config = resolveMediaRuntimeConfig(media);
    const settings = resolveMatchMeRuntimeSettings(config);
    return buildMatchMeTrialSpec(settings, 1).target;
  }, [media]);

  const handleStart = useCallback(() => {
    const begin = preparePlanActivityBegin({ pageMediaId: media.mediaId });
    if (!begin.ok) {
      setBlockReason(begin.reason);
      setPhase('blocked');
      return;
    }

    setActiveChildId(begin.childId);
    const bundle = beginMatchMeSession({
      childId: begin.childId,
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
      planId: begin.planId,
      goalIds: begin.goalIds,
      sessionDifficulty: begin.sessionDifficulty,
    });
    const opened = prepareLiveActivitySession(bundle.session, startMatchMeTrial);
    if (opened.action === 'finalize') {
      const nextSession = finalizeMatchMeSession(opened.session);
      const metrics = calculateSessionMetrics(nextSession.trials);
      setResultStars(childFacingStars(metrics.accuracy));
      try {
        persistSessionAndAdvancePlan(nextSession);
        setSessionSaved(true);
      } catch (error) {
        console.error('[taaluf-training] persist session failed', error);
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
    (outcome: MatchMeTrialOutcome) => {
      if (!session) return;
      recordAttempt({
        correct: outcome.correct,
        promptLevel: outcome.promptLevel,
      });

      let nextSession = commitMatchMeTrial(session, outcome);

      if (isMatchMeSessionComplete(nextSession)) {
        nextSession = finalizeMatchMeSession(nextSession);
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

      nextSession = startMatchMeTrial(nextSession);
      setSession(nextSession);
    },
    [recordAttempt, session]
  );

  const handleDone = useCallback(() => {
    router.push(resolveTrainingActivityCompletionHref(session?.planId));
  }, [router, session?.planId]);

  if (phase === 'blocked' && blockReason) {
    return <PlanActivityGuardMessage reason={blockReason} />;
  }

  if (phase === 'welcome') {
    return (
      <MatchMeWelcome
        title={media.titleAr}
        sampleItem={welcomeSample}
        onStart={handleStart}
      />
    );
  }

  if (phase === 'complete' && session) {
    return (
      <MatchMeComplete
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
      <MatchMePlayArea
        settings={matchMeSettingsForLevel(sessionBundle.settings, level)}
        level={level}
        trialNumber={trialNumber}
        totalTrials={session.targetTrialCount}
        onTrialComplete={handleTrialComplete}
      />
    );
  }

  return null;
}

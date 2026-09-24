'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ActivityFocusShell from '@/components/training/ActivityFocusShell';
import ActivityLevelBadge from '@/components/training/ActivityLevelBadge';
import FieldPromptRecordBar from '@/components/training/FieldPromptRecordBar';
import MatchVisual, { matchVisualAriaLabel } from '@/components/training/match-me/MatchVisual';
import { useActivityFeedback } from '@/components/training/useActivityFeedback';
import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';
import type { TrainingAssistanceStage } from '@/lib/training/assistanceSemantics';
import { shouldAutoFinishTrial } from '@/lib/training/activityResponsePolicy';
import {
  buildWaitThenTouchTrialSpec,
  resolveWaitThenTouchTrialOutcome,
  shouldStrengthenGoCueVisual,
  type WaitThenTouchRuntimeSettings,
  type WaitThenTouchTrialOutcome,
  type WaitThenTouchTrialPhase,
} from '@/lib/training/waitThenTouchEngine';

type Props = {
  settings: WaitThenTouchRuntimeSettings;
  trialNumber: number;
  totalTrials: number;
  sessionSeed: number;
  onTrialComplete: (outcome: WaitThenTouchTrialOutcome) => void;
  level?: number;
};

type UiPhase = WaitThenTouchTrialPhase;

export default function WaitThenTouchPlayArea({
  settings,
  trialNumber,
  totalTrials,
  sessionSeed,
  onTrialComplete,
  level = 1,
}: Props) {
  const waitStartedAt = useRef<number | null>(null);
  const goStartedAt = useRef<number | null>(null);
  const completedRef = useRef(false);
  const audio = useActivityFeedback();

  const spec = buildWaitThenTouchTrialSpec(settings, trialNumber, sessionSeed);

  const [phase, setPhase] = useState<UiPhase>('ready');
  const [assistanceStage, setAssistanceStage] =
    useState<TrainingAssistanceStage>('none');
  const [feedback, setFeedback] = useState<
    'success' | 'premature' | 'timeout' | null
  >(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pendingOutcome, setPendingOutcome] =
    useState<WaitThenTouchTrialOutcome | null>(null);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const finishTrial = useCallback(
    (outcomeKind: 'correct' | 'premature' | 'timeout', timing: {
      responseLatencyMs?: number;
      waitElapsedMs?: number;
      goPhaseElapsedMs?: number;
    }) => {
      if (completedRef.current) return;
      completedRef.current = true;

      const outcome = resolveWaitThenTouchTrialOutcome({
        promptingEnabled: settings.prompting,
        outcomeKind,
        responseLatencyMs: timing.responseLatencyMs,
        waitElapsedMs: timing.waitElapsedMs,
        goPhaseElapsedMs: timing.goPhaseElapsedMs,
        responseWindowMs: spec.responseWindowMs,
      });

      if (outcomeKind === 'correct') audio.playSuccess();
      else audio.playIncorrect();
      setFeedback(
        outcomeKind === 'correct'
          ? 'success'
          : outcomeKind === 'premature'
            ? 'premature'
            : 'timeout'
      );
      setPendingOutcome(outcome);
      setPhase('feedback');
    },
    [audio, settings, spec.responseWindowMs]
  );

  const recordPrompt = (level: PromptHierarchyLevel) => {
    if (!pendingOutcome) return;
    onTrialComplete({ ...pendingOutcome, promptLevel: level });
    setPendingOutcome(null);
  };

  useEffect(() => {
    completedRef.current = false;
    waitStartedAt.current = null;
    goStartedAt.current = null;
    setPhase('ready');
    setAssistanceStage('none');
    setFeedback(null);
    setPendingOutcome(null);

    const readyMs = reducedMotion
      ? Math.min(spec.readyDurationMs, 350)
      : spec.readyDurationMs;

    const readyTimer = window.setTimeout(() => {
      setPhase('wait');
      waitStartedAt.current = Date.now();
    }, readyMs);

    const waitMs = reducedMotion
      ? Math.min(spec.waitDurationMs, 900)
      : spec.waitDurationMs;

    const goTimer = window.setTimeout(() => {
      setPhase('go');
      goStartedAt.current = Date.now();
    }, readyMs + waitMs);

    return () => {
      window.clearTimeout(readyTimer);
      window.clearTimeout(goTimer);
    };
  }, [
    reducedMotion,
    sessionSeed,
    settings,
    spec.readyDurationMs,
    spec.waitDurationMs,
    trialNumber,
  ]);

  useEffect(() => {
    if (!shouldAutoFinishTrial() || phase !== 'go') return;

    const tick = window.setInterval(() => {
      if (goStartedAt.current === null) return;
      const goElapsed = Date.now() - goStartedAt.current;
      if (goElapsed >= spec.responseWindowMs) {
        finishTrial('timeout', { goPhaseElapsedMs: goElapsed });
      }
    }, 120);

    return () => window.clearInterval(tick);
  }, [finishTrial, phase, spec.responseWindowMs]);

  const handleTargetPointer = () => {
    if (completedRef.current) return;
    audio.playTap();

    if (phase === 'wait') {
      const waitElapsedMs =
        waitStartedAt.current === null
          ? 0
          : Date.now() - waitStartedAt.current;
      finishTrial('premature', { waitElapsedMs });
      return;
    }

    if (phase === 'go') {
      const responseLatencyMs =
        goStartedAt.current === null ? 0 : Date.now() - goStartedAt.current;
      finishTrial('correct', {
        responseLatencyMs,
        goPhaseElapsedMs: responseLatencyMs,
      });
    }
  };

  const handleTargetKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleTargetPointer();
  };

  const isGoPhase = phase === 'go';
  const isWaitPhase = phase === 'wait';
  const showTarget = phase !== 'ready' || feedback !== null;
  const strengthenGo = shouldStrengthenGoCueVisual(assistanceStage, phase);

  const targetWaitClass =
    'border-dashed border-[#94A3B8]/70 bg-white/60 opacity-75 shadow-inner';
  const targetGoClass =
    spec.goCueStyle === 'scale'
      ? 'scale-110 border-[#3A9B6E] bg-white ring-4 ring-[#3A9B6E]/35 shadow-[0_0_48px_rgba(58,155,110,0.45)] motion-safe:animate-pulse'
      : spec.goCueStyle === 'ring'
        ? 'border-[#3A9B6E] bg-white ring-[6px] ring-[#3A9B6E]/50 shadow-[0_0_40px_rgba(58,155,110,0.4)]'
        : 'border-[#3A9B6E] bg-white shadow-[0_0_56px_rgba(58,155,110,0.55)] ring-4 ring-[#3A9B6E]/40';

  const targetClass = isGoPhase
    ? `${targetGoClass}${strengthenGo ? ' motion-safe:animate-pulse ring-[#2E7D8E]/50' : ''}`
    : isWaitPhase
      ? targetWaitClass
      : 'border-[#CBD5E1] bg-white/80';

  const phaseLabel =
    phase === 'ready'
      ? '…'
      : phase === 'wait'
        ? 'انتظر'
        : phase === 'go'
          ? 'المس'
          : '';

  return (
    <ActivityFocusShell>
    <div
      className="relative flex h-full min-h-[100dvh] flex-col bg-gradient-to-b from-[#F5F2EB] via-[#EDE8DC] to-[#E2DDD0]"
      dir="rtl"
    >
      <div className="flex justify-center px-5 pt-10">
        <ActivityLevelBadge level={level} />
      </div>
      <div className="flex items-center justify-between px-5 pb-2 pt-3 sm:px-8">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-[#3A9B6E]/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalTrials}
          aria-valuenow={trialNumber}
          aria-label="تقدم المحاولات"
        >
          <div
            className="h-full rounded-full bg-[#3A9B6E] transition-all duration-500 motion-reduce:transition-none"
            style={{ width: `${(trialNumber / totalTrials) * 100}%` }}
          />
        </div>
        <span className="ms-4 min-w-[3rem] text-sm font-semibold text-[#4B5563]">
          {trialNumber}/{totalTrials}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 pb-8 pt-2 sm:px-8">
        <p
          className={`mb-4 text-base font-medium sm:text-lg ${
            isGoPhase ? 'text-[#3A9B6E]' : 'text-[#374151]'
          }`}
          aria-live="polite"
        >
          {phaseLabel}
        </p>

        <div
          className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[2rem] border-2 border-[#3A9B6E]/12 bg-[radial-gradient(circle_at_50%_40%,rgba(58,155,110,0.08),transparent_55%),linear-gradient(180deg,#FAFAF7_0%,#EDE8DC_100%)] shadow-[0_28px_72px_rgba(58,155,110,0.1)]"
          role="application"
          aria-label="مساحة الانتظار والاستجابة"
        >
          {spec.distractors.map((distractor) => (
            <div
              key={distractor.id}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-50"
              style={{ left: `${distractor.x}%`, top: `${distractor.y}%` }}
              aria-hidden
            >
              <MatchVisual item={distractor.item} sizePx={56} />
            </div>
          ))}

          {showTarget && (
            <button
              type="button"
              aria-label={`هدف: ${matchVisualAriaLabel(spec.target)}${
                isGoPhase ? ' — يمكن اللمس الآن' : isWaitPhase ? ' — انتظر الإشارة' : ''
              }`}
              disabled={phase === 'feedback' || phase === 'ready'}
              onPointerDown={(event) => {
                event.preventDefault();
                handleTargetPointer();
              }}
              onKeyDown={handleTargetKeyDown}
              className={`absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 touch-manipulation items-center justify-center rounded-[1.75rem] border-[3px] transition-all motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3A9B6E]/45 ${targetClass} ${
                feedback === 'success'
                  ? 'ring-4 ring-[#3A9B6E]/40'
                  : feedback === 'premature'
                    ? 'ring-4 ring-[#C94C4C]/35 opacity-80'
                    : ''
              }`}
              style={{
                minWidth: spec.targetSizePx + 32,
                minHeight: spec.targetSizePx + 32,
              }}
            >
              <MatchVisual item={spec.target} sizePx={spec.targetSizePx} />
            </button>
          )}
        </div>

        {feedback === 'success' && settings.reinforcement && (
          <p className="mt-5 text-sm font-medium text-[#3A9B6E]" aria-live="polite">
            في الوقت المناسب!
          </p>
        )}
        {feedback === 'premature' && (
          <p className="mt-5 text-sm font-medium text-[#9B6B4C]" aria-live="polite">
            انتظر الإشارة أولاً
          </p>
        )}
        {feedback === 'timeout' && (
          <p className="mt-5 text-sm font-medium text-[#9B6B4C]" aria-live="polite">
            حاول مرة أخرى
          </p>
        )}
        {pendingOutcome ? (
          <div className="mt-4 flex justify-center px-2">
            <FieldPromptRecordBar onRecord={recordPrompt} />
          </div>
        ) : null}
      </div>
    </div>
    </ActivityFocusShell>
  );
}

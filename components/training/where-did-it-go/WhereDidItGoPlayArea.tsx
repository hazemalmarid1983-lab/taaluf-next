'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ActivityFocusShell from '@/components/training/ActivityFocusShell';
import FieldPromptRecordBar from '@/components/training/FieldPromptRecordBar';
import MatchVisual, { matchVisualAriaLabel } from '@/components/training/match-me/MatchVisual';
import { useActivityFeedback } from '@/components/training/useActivityFeedback';
import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';
import type { TrainingAssistanceStage } from '@/lib/training/assistanceSemantics';
import { shouldAutoFinishTrial } from '@/lib/training/activityResponsePolicy';
import {
  buildWhereDidItGoTrialSpec,
  resolveWhereDidItGoTrialOutcome,
  shouldHighlightWhereDidItGoCorrectLocation,
  shouldPulseWhereDidItGoScene,
  type WhereDidItGoLocationChoice,
  type WhereDidItGoRuntimeSettings,
  type WhereDidItGoTrialOutcome,
  type WhereDidItGoTrialPhase,
} from '@/lib/training/whereDidItGoEngine';

type Props = {
  settings: WhereDidItGoRuntimeSettings;
  trialNumber: number;
  totalTrials: number;
  onTrialComplete: (outcome: WhereDidItGoTrialOutcome) => void;
};

export default function WhereDidItGoPlayArea({
  settings,
  trialNumber,
  totalTrials,
  onTrialComplete,
}: Props) {
  const chooseStartedAt = useRef<number | null>(null);
  const completedRef = useRef(false);
  const audio = useActivityFeedback();

  const spec = buildWhereDidItGoTrialSpec(settings, trialNumber);

  const [phase, setPhase] = useState<WhereDidItGoTrialPhase>('observe');
  const [assistanceStage, setAssistanceStage] =
    useState<TrainingAssistanceStage>('none');
  const [displayedLocations, setDisplayedLocations] = useState<
    WhereDidItGoLocationChoice[]
  >(spec.locations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'success' | 'miss' | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pendingOutcome, setPendingOutcome] =
    useState<WhereDidItGoTrialOutcome | null>(null);
  const [targetVisible, setTargetVisible] = useState(true);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const finishTrial = useCallback(
    (input: { selected: boolean; locationChoiceId?: string }) => {
      if (completedRef.current) return;
      completedRef.current = true;

      const chooseElapsedMs =
        chooseStartedAt.current === null
          ? 0
          : Date.now() - chooseStartedAt.current;
      const currentSpec = buildWhereDidItGoTrialSpec(settings, trialNumber);

      const outcome = resolveWhereDidItGoTrialOutcome({
        promptingEnabled: settings.prompting,
        selected: input.selected,
        locationChoiceId: input.locationChoiceId,
        spec: currentSpec,
        chooseElapsedMs,
      });

      if (outcome.correct) audio.playSuccess();
      else audio.playIncorrect();
      setFeedback(outcome.correct ? 'success' : 'miss');
      setPendingOutcome(outcome);
      setPhase('feedback');
    },
    [audio, settings, trialNumber]
  );

  const recordPrompt = (level: PromptHierarchyLevel) => {
    if (!pendingOutcome) return;
    onTrialComplete({ ...pendingOutcome, promptLevel: level });
    setPendingOutcome(null);
  };

  useEffect(() => {
    completedRef.current = false;
    chooseStartedAt.current = null;
    setPhase('observe');
    setAssistanceStage('none');
    setSelectedId(null);
    setFeedback(null);
    setPendingOutcome(null);
    setTargetVisible(true);

    const freshSpec = buildWhereDidItGoTrialSpec(settings, trialNumber);
    setDisplayedLocations(freshSpec.locations);

    const observeMs = reducedMotion
      ? Math.min(freshSpec.displayDurationMs, 800)
      : freshSpec.displayDurationMs;
    const hideMs = reducedMotion
      ? Math.min(freshSpec.hideDurationMs, 400)
      : freshSpec.hideDurationMs;

    const observeTimer = window.setTimeout(() => {
      setPhase('hide');
      setTargetVisible(false);
    }, observeMs);

    const chooseTimer = window.setTimeout(() => {
      setPhase('choose');
      chooseStartedAt.current = Date.now();
    }, observeMs + hideMs);

    return () => {
      window.clearTimeout(observeTimer);
      window.clearTimeout(chooseTimer);
    };
  }, [trialNumber, settings, reducedMotion]);

  useEffect(() => {
    if (!shouldAutoFinishTrial() || phase !== 'choose') return;

    const tick = window.setInterval(() => {
      if (chooseStartedAt.current === null) return;
      const chooseElapsed = Date.now() - chooseStartedAt.current;
      if (chooseElapsed >= spec.chooseWindowMs) {
        finishTrial({ selected: false });
      }
    }, 150);

    return () => window.clearInterval(tick);
  }, [finishTrial, phase, spec.chooseWindowMs]);

  const handleLocationSelect = (choiceId: string) => {
    if (phase !== 'choose' || completedRef.current) return;
    audio.playTap();
    setSelectedId(choiceId);
    finishTrial({ selected: true, locationChoiceId: choiceId });
  };

  const handleLocationKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    choiceId: string
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleLocationSelect(choiceId);
  };

  const showTarget =
    (phase === 'observe' && targetVisible) ||
    (phase === 'feedback' && feedback === 'success');
  const scenePulse = shouldPulseWhereDidItGoScene(assistanceStage);
  const showCorrectHint = shouldHighlightWhereDidItGoCorrectLocation(
    assistanceStage,
    phase === 'feedback'
  );

  const phaseLabel =
    phase === 'observe'
      ? 'شاهد'
      : phase === 'hide'
        ? '…'
        : phase === 'choose'
          ? 'أين ذهب؟'
          : '';

  return (
    <ActivityFocusShell>
    <div
      className="relative flex h-full min-h-[100dvh] flex-col bg-gradient-to-b from-[#EEF4F8] via-[#E8F0F5] to-[#DDE8EF]"
      dir="rtl"
    >
      <div className="flex items-center justify-between px-5 pb-2 pt-5 sm:px-8">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-[#2E7D8E]/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalTrials}
          aria-valuenow={trialNumber}
          aria-label="تقدم المحاولات"
        >
          <div
            className="h-full rounded-full bg-[#2E7D8E] transition-all duration-500 motion-reduce:transition-none"
            style={{ width: `${(trialNumber / totalTrials) * 100}%` }}
          />
        </div>
        <span className="ms-4 min-w-[3rem] text-sm font-semibold text-[#4B5563]">
          {trialNumber}/{totalTrials}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 pb-8 pt-2 sm:px-8">
        <p
          className="mb-4 text-base font-medium text-[#374151] sm:text-lg"
          aria-live="polite"
        >
          {phaseLabel}
        </p>

        <div
          className={`relative mx-auto aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-[2rem] border-2 border-[#2E7D8E]/15 bg-gradient-to-br from-[#F8FBFD] to-[#E8F0F5] shadow-[0_28px_72px_rgba(46,125,142,0.12)] ${
            scenePulse ? 'motion-safe:animate-pulse ring-2 ring-[#2E7D8E]/20' : ''
          }`}
          role="application"
          aria-label="مساحة الذاكرة البصرية"
        >
          {showTarget && (
            <div
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 motion-reduce:transition-none"
              style={{
                left: `${spec.observeLocation.x}%`,
                top: `${spec.observeLocation.y}%`,
              }}
            >
              <MatchVisual
                item={spec.target}
                sizePx={100}
                label={`هدف: ${matchVisualAriaLabel(spec.target)}`}
              />
            </div>
          )}

          {(phase === 'choose' || phase === 'feedback') &&
            displayedLocations.map((choice) => {
              const isSelected = selectedId === choice.id;
              const showAsCorrect =
                phase === 'feedback' && choice.isCorrect && feedback === 'success';
              const showAsWrong =
                phase === 'feedback' && isSelected && feedback === 'miss';
              const directHint =
                showCorrectHint && choice.isCorrect && phase === 'choose';

              return (
                <button
                  key={choice.id}
                  type="button"
                  aria-label={`موقع: ${choice.location.labelAr}${
                    showAsCorrect ? ' — صحيح' : ''
                  }${showAsWrong ? ' — خطأ' : ''}`}
                  aria-pressed={isSelected}
                  disabled={phase !== 'choose'}
                  onClick={() => handleLocationSelect(choice.id)}
                  onKeyDown={(event) => handleLocationKeyDown(event, choice.id)}
                  className={`absolute z-10 flex h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full border-[3px] bg-white/90 shadow-lg transition-all motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2E7D8E]/45 sm:h-24 sm:w-24 ${
                    showAsCorrect
                      ? 'border-[#3A9B6E] bg-[#3A9B6E]/10 ring-4 ring-[#3A9B6E]/25'
                      : showAsWrong
                        ? 'border-[#C94C4C] bg-[#C94C4C]/8'
                        : directHint
                          ? 'border-[#2E7D8E] ring-2 ring-[#2E7D8E]/35'
                          : isSelected
                            ? 'border-[#2E7D8E] scale-95'
                            : 'border-[#CBD5E1] hover:border-[#2E7D8E]/50'
                  }`}
                  style={{
                    left: `${choice.location.x}%`,
                    top: `${choice.location.y}%`,
                  }}
                >
                  <span
                    className="h-3 w-3 rounded-full bg-[#94A3B8]/50"
                    aria-hidden
                  />
                </button>
              );
            })}
        </div>

        {feedback === 'success' && settings.reinforcement && (
          <p className="mt-5 text-sm font-medium text-[#3A9B6E]" aria-live="polite">
            مكان صحيح!
          </p>
        )}
        {feedback === 'miss' && (
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

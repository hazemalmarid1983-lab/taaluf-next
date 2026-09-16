'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import MatchVisual, { matchVisualAriaLabel } from '@/components/training/match-me/MatchVisual';
import {
  buildMatchMeTrialSpec,
  getMatchMeDisplayedChoices,
  resolveMatchMeAssistanceStage,
  resolveMatchMeTrialOutcome,
  shouldHighlightMatchMeCorrectChoice,
  shouldHighlightMatchMeModel,
  type MatchMeChoice,
  type MatchMeRuntimeSettings,
  type MatchMeTrialOutcome,
  type MatchMeTrialSpec,
} from '@/lib/training/matchMeEngine';
import type { TrainingAssistanceStage } from '@/lib/training/assistanceSemantics';

type Props = {
  settings: MatchMeRuntimeSettings;
  trialNumber: number;
  totalTrials: number;
  onTrialComplete: (outcome: MatchMeTrialOutcome) => void;
};

type TrialPhase = 'choosing' | 'feedback';

export default function MatchMePlayArea({
  settings,
  trialNumber,
  totalTrials,
  onTrialComplete,
}: Props) {
  const trialStartedAt = useRef<number>(Date.now());
  const completedRef = useRef(false);

  const spec = buildMatchMeTrialSpec(settings, trialNumber);

  const [phase, setPhase] = useState<TrialPhase>('choosing');
  const [assistanceStage, setAssistanceStage] = useState<TrainingAssistanceStage>('none');
  const [displayedChoices, setDisplayedChoices] = useState<MatchMeChoice[]>(
    spec.choices
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'success' | 'miss' | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  useEffect(() => {
    completedRef.current = false;
    trialStartedAt.current = Date.now();
    setPhase('choosing');
    setAssistanceStage('none');
    setSelectedId(null);
    setFeedback(null);

    const freshSpec = buildMatchMeTrialSpec(settings, trialNumber);
    setDisplayedChoices(freshSpec.choices);
  }, [trialNumber, settings]);

  const finishTrial = useCallback(
    (input: { selected: boolean; choiceId?: string }) => {
      if (completedRef.current) return;
      completedRef.current = true;

      const elapsedMs = Date.now() - trialStartedAt.current;
      const currentSpec = buildMatchMeTrialSpec(settings, trialNumber);

      const outcome = resolveMatchMeTrialOutcome({
        promptingEnabled: settings.prompting,
        selected: input.selected,
        choiceId: input.choiceId,
        spec: currentSpec,
        elapsedMs,
      });

      const wasCorrect = outcome.correct;
      setFeedback(wasCorrect ? 'success' : 'miss');
      setPhase('feedback');

      const delay = settings.reinforcement ? 700 : 220;
      window.setTimeout(() => {
        onTrialComplete(outcome);
        completedRef.current = false;
      }, reducedMotion ? Math.min(delay, 150) : delay);
    },
    [onTrialComplete, reducedMotion, settings, trialNumber]
  );

  useEffect(() => {
    if (phase !== 'choosing') return;

    const tick = window.setInterval(() => {
      const elapsed = Date.now() - trialStartedAt.current;
      const stage = resolveMatchMeAssistanceStage(elapsed, settings.prompting);
      setAssistanceStage(stage);

      const currentSpec = buildMatchMeTrialSpec(settings, trialNumber);
      setDisplayedChoices(getMatchMeDisplayedChoices(currentSpec, stage));

      if (elapsed >= spec.responseWindowMs) {
        finishTrial({ selected: false });
      }
    }, 150);

    return () => window.clearInterval(tick);
  }, [finishTrial, phase, settings, spec.responseWindowMs, trialNumber]);

  const handleChoice = (choiceId: string) => {
    if (phase !== 'choosing' || completedRef.current) return;
    setSelectedId(choiceId);
    finishTrial({ selected: true, choiceId });
  };

  const handleChoiceKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    choiceId: string
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleChoice(choiceId);
  };

  const highlightModel = shouldHighlightMatchMeModel(assistanceStage);
  const showCorrectHint =
    shouldHighlightMatchMeCorrectChoice(assistanceStage, phase === 'feedback') &&
    phase === 'choosing';

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col bg-gradient-to-b from-[#F7F3EB] via-[#F0EBE1] to-[#E8E2D6]"
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

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-10 sm:gap-10 sm:px-8">
        <p className="text-base font-medium text-[#374151] sm:text-lg">طابق مثلي</p>

        <div
          className={`flex min-h-[11rem] w-full max-w-md items-center justify-center rounded-[2rem] border-2 bg-white/90 px-8 py-10 shadow-[0_24px_64px_rgba(46,125,142,0.1)] backdrop-blur-sm sm:min-h-[13rem] ${
            highlightModel
              ? 'border-[#2E7D8E] ring-4 ring-[#2E7D8E]/25 motion-safe:animate-pulse'
              : 'border-[#2E7D8E]/20'
          } ${feedback === 'success' ? 'ring-4 ring-[#3A9B6E]/30' : ''}`}
          aria-label="النموذج — طابق هذا الشكل"
        >
          <MatchVisual
            item={spec.target}
            sizePx={140}
            label={`النموذج: ${matchVisualAriaLabel(spec.target)}`}
          />
        </div>

        <div
          className="flex w-full max-w-lg flex-col items-center gap-3"
          aria-hidden
        >
          <span className="h-8 w-px bg-gradient-to-b from-[#2E7D8E]/40 to-transparent" />
        </div>

        <div
          className={`grid w-full max-w-2xl gap-4 ${
            displayedChoices.length <= 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : displayedChoices.length === 3
                ? 'grid-cols-1 sm:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
          }`}
          role="group"
          aria-label="اختيارات المطابقة"
        >
          {displayedChoices.map((choice) => {
            const isSelected = selectedId === choice.id;
            const showAsCorrect =
              phase === 'feedback' && choice.isCorrect && feedback === 'success';
            const showAsWrong =
              phase === 'feedback' && isSelected && feedback === 'miss';
            const directHint =
              showCorrectHint && choice.isCorrect && !isSelected;

            return (
              <button
                key={choice.id}
                type="button"
                aria-label={`اختيار: ${matchVisualAriaLabel(choice.item)}${
                  showAsCorrect ? ' — صحيح' : ''
                }${showAsWrong ? ' — خطأ' : ''}`}
                aria-pressed={isSelected}
                disabled={phase !== 'choosing'}
                onClick={() => handleChoice(choice.id)}
                onKeyDown={(event) => handleChoiceKeyDown(event, choice.id)}
                className={`flex min-h-[8.5rem] touch-manipulation items-center justify-center rounded-[1.5rem] border-2 bg-white/95 p-6 shadow-[0_12px_32px_rgba(31,42,55,0.06)] transition-all motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2E7D8E]/45 sm:min-h-[10rem] ${
                  showAsCorrect
                    ? 'border-[#3A9B6E] bg-[#3A9B6E]/10 ring-4 ring-[#3A9B6E]/25'
                    : showAsWrong
                      ? 'border-[#C94C4C] bg-[#C94C4C]/8 opacity-90'
                      : directHint
                        ? 'border-[#2E7D8E] ring-2 ring-[#2E7D8E]/30'
                        : isSelected
                          ? 'border-[#2E7D8E] scale-[0.98]'
                          : 'border-[#D1D5DB] hover:border-[#2E7D8E]/40 hover:bg-white'
                }`}
              >
                <MatchVisual item={choice.item} sizePx={100} />
              </button>
            );
          })}
        </div>

        {feedback === 'success' && settings.reinforcement && (
          <p className="text-sm font-medium text-[#3A9B6E]" aria-live="polite">
            مطابق!
          </p>
        )}
        {feedback === 'miss' && (
          <p className="text-sm font-medium text-[#9B6B4C]" aria-live="polite">
            حاول مرة أخرى
          </p>
        )}
      </div>
    </div>
  );
}

export function previewMatchMeTrialSpec(
  settings: MatchMeRuntimeSettings,
  trialNumber: number
): MatchMeTrialSpec {
  return buildMatchMeTrialSpec(settings, trialNumber);
}

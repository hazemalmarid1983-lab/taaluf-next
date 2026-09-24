'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import PromptRecordingBar from '@/components/classroom/PromptRecordingBar';
import ActivityFocusShell from '@/components/training/ActivityFocusShell';
import ActivityLevelBadge from '@/components/training/ActivityLevelBadge';
import MatchVisual, { matchVisualAriaLabel } from '@/components/training/match-me/MatchVisual';
import { useActivityFeedback } from '@/components/training/useActivityFeedback';
import { shouldAutoFinishTrial } from '@/lib/training/activityResponsePolicy';
import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';
import {
  buildMatchMeTrialSpec,
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
  level?: number;
};

type TrialPhase = 'choosing' | 'feedback';

export default function MatchMePlayArea({
  settings,
  trialNumber,
  totalTrials,
  onTrialComplete,
  level = 1,
}: Props) {
  const trialStartedAt = useRef<number>(Date.now());
  const completedRef = useRef(false);
  const audio = useActivityFeedback();

  const spec = buildMatchMeTrialSpec(settings, trialNumber);

  const [phase, setPhase] = useState<TrialPhase>('choosing');
  const [assistanceStage, setAssistanceStage] = useState<TrainingAssistanceStage>('none');
  const [displayedChoices, setDisplayedChoices] = useState<MatchMeChoice[]>(
    spec.choices
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'success' | 'miss' | null>(null);
  const [pendingOutcome, setPendingOutcome] = useState<MatchMeTrialOutcome | null>(
    null
  );

  useEffect(() => {
    completedRef.current = false;
    trialStartedAt.current = Date.now();
    setPhase('choosing');
    setAssistanceStage('none');
    setSelectedId(null);
    setFeedback(null);
    setPendingOutcome(null);

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
      if (wasCorrect) audio.playSuccess();
      else audio.playIncorrect();
      setFeedback(wasCorrect ? 'success' : 'miss');
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
    if (!shouldAutoFinishTrial() || phase !== 'choosing') return;
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - trialStartedAt.current;
      if (elapsed >= spec.responseWindowMs) {
        finishTrial({ selected: false });
      }
    }, 150);
    return () => window.clearInterval(tick);
  }, [finishTrial, phase, spec.responseWindowMs]);

  const handleChoice = (choiceId: string) => {
    if (phase !== 'choosing' || completedRef.current) return;
    audio.playTap();
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
    <ActivityFocusShell>
    <div
      className="relative flex h-full min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-[#F7F3EB] via-[#F0EBE1] to-[#E8E2D6]"
      dir="rtl"
    >
      <div className="flex justify-center px-5 pt-10">
        <ActivityLevelBadge level={level} />
      </div>
      <div className="flex items-center justify-between px-5 pb-2 pt-3 sm:px-8">
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

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 pb-4 pl-4 pr-4 lg:pl-[18.5rem]">
        <p className="text-base font-medium text-[#374151] sm:text-lg">طابق مثلي</p>

        <div
          className={`flex w-[min(340px,70vw)] items-center justify-center rounded-[2rem] border-2 bg-white/95 px-4 py-4 shadow-[0_24px_48px_rgba(31,42,55,0.12)] backdrop-blur-sm ${
            highlightModel
              ? 'border-[#2E7D8E] ring-4 ring-[#2E7D8E]/25 motion-safe:animate-pulse'
              : 'border-[#2E7D8E]/20'
          } ${feedback === 'success' ? 'ring-4 ring-[#3A9B6E]/30' : ''}`}
          aria-label="النموذج — طابق هذا الشكل"
        >
          <MatchVisual
            item={spec.target}
            sizePx={300}
            label={`النموذج: ${matchVisualAriaLabel(spec.target)}`}
          />
        </div>

        <div
          className="flex w-full max-w-lg flex-col items-center gap-3"
          aria-hidden
        >
          <span className="h-4 w-px bg-gradient-to-b from-[#2E7D8E]/40 to-transparent" />
        </div>

        <div
          className={`grid w-full max-w-5xl gap-3 ${
            displayedChoices.length <= 2
              ? 'grid-cols-2'
              : displayedChoices.length === 3
                ? 'grid-cols-3'
                : 'grid-cols-2 xl:grid-cols-4'
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
                className={`flex min-h-[9.5rem] touch-manipulation items-center justify-center rounded-[1.5rem] border-2 bg-white/95 p-3 shadow-[0_12px_28px_rgba(31,42,55,0.08)] transition-all motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2E7D8E]/45 sm:min-h-[11rem] ${
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
                <MatchVisual item={choice.item} sizePx={152} />
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

        {pendingOutcome ? (
          <div className="w-full max-w-2xl" aria-label="تسجيل مستوى المساعدة">
            <PromptRecordingBar isAr visible onRecord={recordPrompt} />
          </div>
        ) : null}
      </div>
    </div>
    </ActivityFocusShell>
  );
}

export function previewMatchMeTrialSpec(
  settings: MatchMeRuntimeSettings,
  trialNumber: number
): MatchMeTrialSpec {
  return buildMatchMeTrialSpec(settings, trialNumber);
}

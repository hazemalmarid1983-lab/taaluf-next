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
  level?: number;
};

function CupCover({ lifted }: { lifted: boolean }) {
  return (
    <svg
      viewBox="0 0 88 78"
      className={`h-[4.5rem] w-[4.5rem] transition-transform duration-500 ease-out motion-reduce:transition-none sm:h-24 sm:w-24 ${
        lifted ? '-translate-y-10' : ''
      }`}
      aria-hidden
    >
      <ellipse cx="44" cy="64" rx="30" ry="8" fill="#C5D0D8" />
      <path d="M16 30h56l-7 30H23z" fill="#F7FBFD" stroke="#6D7C89" strokeWidth="3" />
      <ellipse cx="44" cy="30" rx="28" ry="11" fill="#E7EEF3" stroke="#4E5D6A" strokeWidth="3" />
      <ellipse cx="44" cy="30" rx="16" ry="5" fill="#D3DDE6" />
    </svg>
  );
}

export default function WhereDidItGoPlayArea({
  settings,
  trialNumber,
  totalTrials,
  onTrialComplete,
  level = 1,
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
  const [sliding, setSliding] = useState(false);

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
    setSliding(false);

    const freshSpec = buildWhereDidItGoTrialSpec(settings, trialNumber);
    setDisplayedLocations(freshSpec.locations);

    const observeMs = reducedMotion
      ? Math.min(freshSpec.displayDurationMs, 800)
      : freshSpec.displayDurationMs;
    const hideMs = reducedMotion
      ? Math.min(freshSpec.hideDurationMs, 280)
      : freshSpec.hideDurationMs;
    const instantHide = reducedMotion || freshSpec.hideAnimation === 'instant';

    const observeTimer = window.setTimeout(() => {
      setPhase('hide');
      if (instantHide) {
        setSliding(true);
        setTargetVisible(false);
        return;
      }
      window.requestAnimationFrame(() => setSliding(true));
    }, observeMs);

    const chooseTimer = window.setTimeout(() => {
      setPhase('choose');
      setTargetVisible(false);
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

  const showTravelingObject =
    (phase === 'observe' && targetVisible) ||
    (phase === 'hide' && targetVisible) ||
    (phase === 'feedback' && feedback === 'success');
  const objectAtCup = sliding || phase === 'feedback';
  const objectX = objectAtCup ? spec.observeLocation.x : 50;
  const objectY = objectAtCup ? spec.observeLocation.y : 34;
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
          {showTravelingObject && (
            <div
              className={`absolute -translate-x-1/2 -translate-y-1/2 motion-reduce:transition-none ${
                phase === 'observe' ? 'z-30' : 'z-10'
              }`}
              style={{
                left: `${objectX}%`,
                top: `${objectY}%`,
                transition:
                  phase === 'hide' && sliding && !reducedMotion
                    ? `left ${spec.hideDurationMs}ms linear, top ${spec.hideDurationMs}ms linear`
                    : 'none',
              }}
            >
              <MatchVisual
                item={spec.target}
                sizePx={88}
                label={`هدف: ${matchVisualAriaLabel(spec.target)}`}
              />
            </div>
          )}

          {displayedLocations.map((choice) => {
              const isSelected = selectedId === choice.id;
              const lifted =
                phase === 'feedback' && choice.isCorrect && feedback === 'success';
              const showAsWrong =
                phase === 'feedback' && isSelected && feedback === 'miss';
              const directHint =
                showCorrectHint && choice.isCorrect && phase === 'choose';
              const canChoose = phase === 'choose';

              return (
                <button
                  key={choice.id}
                  type="button"
                  aria-label={`غطاء: ${choice.location.labelAr}${
                    lifted ? ' — صحيح' : ''
                  }${showAsWrong ? ' — خطأ' : ''}`}
                  aria-pressed={isSelected}
                  disabled={!canChoose}
                  onClick={() => handleLocationSelect(choice.id)}
                  onKeyDown={(event) => handleLocationKeyDown(event, choice.id)}
                  className={`absolute z-20 flex -translate-x-1/2 -translate-y-1/2 touch-manipulation items-end justify-center bg-transparent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2E7D8E]/45 ${
                    showAsWrong
                      ? 'rounded-full ring-4 ring-[#C94C4C]/35'
                      : directHint
                        ? 'rounded-full ring-4 ring-[#2E7D8E]/40'
                        : ''
                  }`}
                  style={{
                    left: `${choice.location.x}%`,
                    top: `${choice.location.y}%`,
                  }}
                >
                  <CupCover lifted={lifted} />
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

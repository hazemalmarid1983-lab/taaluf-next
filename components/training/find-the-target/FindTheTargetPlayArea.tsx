'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FieldPromptRecordBar from '@/components/training/FieldPromptRecordBar';
import MatchVisual, { matchVisualAriaLabel } from '@/components/training/match-me/MatchVisual';
import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';
import type { TrainingAssistanceStage } from '@/lib/training/assistanceSemantics';
import {
  buildFindTheTargetTrialSpec,
  getFindTheTargetDisplayedItems,
  getFindTheTargetHintRegion,
  resolveFindTheTargetAssistanceStage,
  resolveFindTheTargetTrialOutcome,
  shouldHighlightFindTheTargetItem,
  type FindTheTargetFieldItem,
  type FindTheTargetRuntimeSettings,
  type FindTheTargetTrialOutcome,
  type FindTheTargetTrialPhase,
} from '@/lib/training/findTheTargetEngine';

type Props = {
  settings: FindTheTargetRuntimeSettings;
  trialNumber: number;
  totalTrials: number;
  fieldSeed: number;
  onTrialComplete: (outcome: FindTheTargetTrialOutcome) => void;
};

const REGION_HINT_CLASS: Record<string, string> = {
  nw: 'left-[8%] top-[8%] h-[42%] w-[42%]',
  ne: 'right-[8%] top-[8%] h-[42%] w-[42%]',
  sw: 'bottom-[8%] left-[8%] h-[42%] w-[42%]',
  se: 'bottom-[8%] right-[8%] h-[42%] w-[42%]',
  center: 'left-1/2 top-1/2 h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2',
  north: 'left-1/2 top-[4%] h-[34%] w-[56%] -translate-x-1/2',
  south: 'bottom-[4%] left-1/2 h-[34%] w-[56%] -translate-x-1/2',
  west: 'left-[4%] top-1/2 h-[56%] w-[34%] -translate-y-1/2',
  east: 'right-[4%] top-1/2 h-[56%] w-[34%] -translate-y-1/2',
};

export default function FindTheTargetPlayArea({
  settings,
  trialNumber,
  totalTrials,
  fieldSeed,
  onTrialComplete,
}: Props) {
  const searchStartedAt = useRef<number | null>(null);
  const completedRef = useRef(false);

  const spec = buildFindTheTargetTrialSpec(settings, trialNumber, fieldSeed);

  const [phase, setPhase] = useState<FindTheTargetTrialPhase>('target');
  const [assistanceStage, setAssistanceStage] =
    useState<TrainingAssistanceStage>('none');
  const [displayedItems, setDisplayedItems] = useState<FindTheTargetFieldItem[]>(
    spec.fieldItems
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'success' | 'miss' | null>(null);
  const [pendingOutcome, setPendingOutcome] =
    useState<FindTheTargetTrialOutcome | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }, []);

  const finishTrial = useCallback(
    (input: { selected: boolean; fieldItemId?: string }) => {
      if (completedRef.current) return;
      completedRef.current = true;

      const searchElapsedMs =
        searchStartedAt.current === null
          ? 0
          : Date.now() - searchStartedAt.current;
      const currentSpec = buildFindTheTargetTrialSpec(
        settings,
        trialNumber,
        fieldSeed
      );

      const outcome = resolveFindTheTargetTrialOutcome({
        promptingEnabled: settings.prompting,
        selected: input.selected,
        fieldItemId: input.fieldItemId,
        spec: currentSpec,
        searchElapsedMs,
      });

      setFeedback(outcome.correct ? 'success' : 'miss');
      setPendingOutcome(outcome);
      setPhase('feedback');
    },
    [fieldSeed, settings, trialNumber]
  );

  const recordPrompt = (level: PromptHierarchyLevel) => {
    if (!pendingOutcome) return;
    onTrialComplete({ ...pendingOutcome, promptLevel: level });
    setPendingOutcome(null);
  };

  useEffect(() => {
    completedRef.current = false;
    searchStartedAt.current = null;
    setPhase('target');
    setAssistanceStage('none');
    setSelectedId(null);
    setFeedback(null);
    setPendingOutcome(null);

    const freshSpec = buildFindTheTargetTrialSpec(
      settings,
      trialNumber,
      fieldSeed
    );
    setDisplayedItems(freshSpec.fieldItems);

    const previewMs = reducedMotion
      ? Math.min(freshSpec.targetPreviewMs, 900)
      : freshSpec.targetPreviewMs;

    const searchTimer = window.setTimeout(() => {
      setPhase('search');
      searchStartedAt.current = Date.now();
    }, previewMs);

    return () => window.clearTimeout(searchTimer);
  }, [fieldSeed, reducedMotion, settings, trialNumber]);

  useEffect(() => {
    if (phase !== 'search') return;

    const tick = window.setInterval(() => {
      if (searchStartedAt.current === null) return;
      const searchElapsed = Date.now() - searchStartedAt.current;
      const stage = resolveFindTheTargetAssistanceStage(
        searchElapsed,
        settings.prompting
      );
      setAssistanceStage(stage);

      const currentSpec = buildFindTheTargetTrialSpec(
        settings,
        trialNumber,
        fieldSeed
      );
      setDisplayedItems(getFindTheTargetDisplayedItems(currentSpec, stage));

      if (searchElapsed >= spec.searchWindowMs) {
        finishTrial({ selected: false });
      }
    }, 150);

    return () => window.clearInterval(tick);
  }, [fieldSeed, finishTrial, phase, settings, spec.searchWindowMs, trialNumber]);

  const handleSelect = (fieldItemId: string) => {
    if (phase !== 'search' || completedRef.current) return;
    setSelectedId(fieldItemId);
    finishTrial({ selected: true, fieldItemId });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    fieldItemId: string
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleSelect(fieldItemId);
  };

  const hintRegion = getFindTheTargetHintRegion(spec, assistanceStage);
  const showDirectHint = shouldHighlightFindTheTargetItem(
    assistanceStage,
    phase === 'feedback'
  );

  const phaseLabel =
    phase === 'target' ? 'تذكّر' : phase === 'search' ? 'ابحث' : '';

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col bg-gradient-to-b from-[#F3F6FA] via-[#E8EEF5] to-[#DDE5EF]"
      dir="rtl"
    >
      <div className="flex items-center justify-between px-5 pb-2 pt-5 sm:px-8">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-[#4B5EB8]/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalTrials}
          aria-valuenow={trialNumber}
          aria-label="تقدم المحاولات"
        >
          <div
            className="h-full rounded-full bg-[#4B5EB8] transition-all duration-500 motion-reduce:transition-none"
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

        {phase === 'target' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="flex h-48 w-48 items-center justify-center rounded-[2rem] border-2 border-[#4B5EB8]/25 bg-white/90 shadow-[0_28px_72px_rgba(75,94,184,0.16)] motion-safe:animate-pulse">
              <MatchVisual
                item={spec.target}
                sizePx={spec.itemSizePx + 16}
                label={`الهدف: ${matchVisualAriaLabel(spec.target)}`}
              />
            </div>
          </div>
        )}

        {(phase === 'search' || phase === 'feedback') && (
          <div
            className="relative mx-auto aspect-[5/4] w-full max-w-4xl overflow-hidden rounded-[2rem] border-2 border-[#4B5EB8]/15 bg-[radial-gradient(circle_at_30%_20%,rgba(75,94,184,0.08),transparent_50%),linear-gradient(180deg,#FAFCFE_0%,#EEF3F8_100%)] shadow-[0_28px_72px_rgba(75,94,184,0.12)]"
            role="application"
            aria-label="حقل البحث البصري"
          >
            {hintRegion && phase === 'search' && (
              <div
                className={`pointer-events-none absolute z-0 rounded-[1.5rem] border-2 border-dashed border-[#4B5EB8]/35 bg-[#4B5EB8]/5 motion-safe:animate-pulse ${REGION_HINT_CLASS[hintRegion] ?? ''}`}
                aria-hidden
              />
            )}

            {displayedItems.map((entry) => {
              const isSelected = selectedId === entry.id;
              const showAsCorrect =
                phase === 'feedback' && entry.isTarget && feedback === 'success';
              const showAsWrong =
                phase === 'feedback' && isSelected && feedback === 'miss';
              const directHint =
                showDirectHint && entry.isTarget && phase === 'search';

              return (
                <button
                  key={entry.id}
                  type="button"
                  aria-label={`عنصر: ${matchVisualAriaLabel(entry.item)}${
                    showAsCorrect ? ' — صحيح' : ''
                  }${showAsWrong ? ' — خطأ' : ''}`}
                  aria-pressed={isSelected}
                  disabled={phase !== 'search'}
                  onClick={() => handleSelect(entry.id)}
                  onKeyDown={(event) => handleKeyDown(event, entry.id)}
                  className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 touch-manipulation items-center justify-center rounded-[1.25rem] border-[3px] bg-white/95 shadow-lg transition-all motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4B5EB8]/40 ${
                    showAsCorrect
                      ? 'border-[#3A9B6E] bg-[#3A9B6E]/10 ring-4 ring-[#3A9B6E]/25'
                      : showAsWrong
                        ? 'border-[#C94C4C] bg-[#C94C4C]/8'
                        : directHint
                          ? 'border-[#4B5EB8] ring-4 ring-[#4B5EB8]/35'
                          : isSelected
                            ? 'border-[#4B5EB8] scale-95'
                            : 'border-[#CBD5E1] hover:border-[#4B5EB8]/45'
                  }`}
                  style={{
                    left: `${entry.x}%`,
                    top: `${entry.y}%`,
                    minWidth: spec.itemSizePx + 24,
                    minHeight: spec.itemSizePx + 24,
                  }}
                >
                  <MatchVisual item={entry.item} sizePx={spec.itemSizePx} />
                </button>
              );
            })}
          </div>
        )}

        {feedback === 'success' && settings.reinforcement && (
          <p className="mt-5 text-sm font-medium text-[#3A9B6E]" aria-live="polite">
            وجدت الهدف!
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
  );
}

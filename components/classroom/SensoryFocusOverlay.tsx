'use client';

import { useEffect, useRef, useState } from 'react';
import type { HomeClassroomGoal, InteractiveToolItem } from '@/lib/homeClassroomEngine';
import { HOME_SESSION_TARGET_TRIALS } from '@/lib/homeClassroomEngine';
import type { SortingBin } from '@/lib/homeClassroomEngine';
import {
  holdExitProgress,
  shouldExitOnDoubleTap,
  SENSORY_FOCUS_EXIT_HOLD_MS,
} from '@/lib/sensoryFocusMode';

type SensoryFocusOverlayProps = {
  goal: HomeClassroomGoal;
  target: InteractiveToolItem;
  choices: InteractiveToolItem[];
  targetName: string;
  isAr: boolean;
  soundOn: boolean;
  trialsDone: number;
  pickedId: string | null;
  feedback: 'ok' | 'miss' | null;
  tapTone: (id: string) => string;
  onChoiceTap: (item: InteractiveToolItem) => void;
  onBinTap: (bin: SortingBin) => void;
  onSpeakTarget: () => void;
  onExit: () => void;
};

/**
 * واجهة ملء الشاشة للطفل: هدف + عناصر لمس + مؤشر المحاولات فقط.
 * خروج ولي الأمر: ضغط مطول 3 ثوانٍ أو نقرتان متتاليتان.
 */
export default function SensoryFocusOverlay({
  goal,
  target,
  choices,
  targetName,
  isAr,
  soundOn,
  trialsDone,
  pickedId,
  feedback,
  tapTone,
  onChoiceTap,
  onBinTap,
  onSpeakTarget,
  onExit,
}: SensoryFocusOverlayProps) {
  return (
    <div
      data-sensory-focus
      className="fixed inset-0 z-[9999] flex flex-col bg-gradient-to-b from-[#e4f2f7] via-[#dcecf4] to-[#d2e6f0]"
      role="dialog"
      aria-modal="true"
      aria-label={
        isAr ? 'نمط التركيز الهادئ' : 'Sensory focus mode'
      }
    >
      <ParentExitLock onExit={onExit} isAr={isAr} />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-10 pt-16">
        <TrialProgressDots completed={trialsDone} isAr={isAr} />

        <div className="max-w-lg space-y-2 text-center">
          <span className="inline-block rounded-full border border-teal-300/50 bg-white/50 px-4 py-1.5 text-xs font-bold text-teal-800/90 backdrop-blur-sm">
            {isAr ? goal.titleAr : goal.titleEn}
          </span>
          <p className="text-[11px] font-semibold text-slate-500/90">
            {isAr ? goal.targetSkill : goal.targetSkillEn}
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col items-center gap-6">
          {goal.toolType !== 'receptive_discrimination' && (
            <button
              type="button"
              onClick={onSpeakTarget}
              disabled={!soundOn}
              className="flex h-36 w-36 items-center justify-center rounded-[2rem] border-2 border-white/80 bg-white/70 text-7xl shadow-[0_8px_32px_rgba(14,116,144,0.12),inset_0_2px_12px_rgba(255,255,255,0.9)] backdrop-blur-md transition active:scale-95 disabled:cursor-default"
              aria-label={targetName}
            >
              {target.imageUrl}
            </button>
          )}

          {goal.toolType === 'sorting_categories' ? (
            <div className="grid w-full grid-cols-2 gap-4">
              {(goal.sortingBins || []).map((bin) => (
                <button
                  key={bin.id}
                  type="button"
                  onClick={() => onBinTap(bin)}
                  className={`rounded-3xl border-2 p-6 transition active:scale-95 ${tapTone(bin.id)}`}
                >
                  <span className="block text-5xl">{bin.emoji}</span>
                  <span className="mt-2 block text-sm font-bold text-slate-700">
                    {isAr ? bin.labelAr : bin.labelEn}
                  </span>
                </button>
              ))}
            </div>
          ) : goal.toolType === 'functional_naming' ? (
            <p className="rounded-2xl border border-white/60 bg-white/40 px-4 py-3 text-sm font-medium text-slate-600 backdrop-blur-sm">
              {isAr ? targetName : targetName}
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-4">
              {choices.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChoiceTap(item)}
                  className={`flex h-24 w-24 items-center justify-center rounded-3xl border-2 text-5xl transition active:scale-95 sm:h-28 sm:w-28 ${tapTone(item.id)}`}
                  aria-label={isAr ? item.nameAr : item.nameEn}
                >
                  {item.imageUrl}
                </button>
              ))}
            </div>
          )}

          {feedback && pickedId && (
            <p
              aria-live="polite"
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                feedback === 'ok'
                  ? 'bg-emerald-100/80 text-emerald-800'
                  : 'bg-rose-100/80 text-rose-800'
              }`}
            >
              {feedback === 'ok'
                ? isAr
                  ? '✓ اختيار صحيح'
                  : '✓ Correct choice'
                : isAr
                  ? 'جرّب مرة أخرى'
                  : 'Try again'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TrialProgressDots({
  completed,
  isAr,
}: {
  completed: number;
  isAr: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2.5"
      aria-label={
        isAr
          ? `المحاولة ${Math.min(completed + 1, HOME_SESSION_TARGET_TRIALS)} من ${HOME_SESSION_TARGET_TRIALS}`
          : `Trial ${Math.min(completed + 1, HOME_SESSION_TARGET_TRIALS)} of ${HOME_SESSION_TARGET_TRIALS}`
      }
    >
      {Array.from({ length: HOME_SESSION_TARGET_TRIALS }, (_, index) => {
        const done = index < completed;
        const current = index === completed;
        return (
          <span
            key={index}
            className={`block rounded-full transition-all duration-500 ${
              done
                ? 'h-3.5 w-3.5 bg-teal-400/90 shadow-[0_0_10px_rgba(45,212,191,0.45)]'
                : current
                  ? 'h-4 w-4 border-2 border-sky-400/70 bg-sky-200/80 shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                  : 'h-3 w-3 border border-slate-300/60 bg-white/50'
            }`}
          />
        );
      })}
    </div>
  );
}

function ParentExitLock({
  onExit,
  isAr,
}: {
  onExit: () => void;
  isAr: boolean;
}) {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTapRef = useRef(0);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const stopHold = () => {
    holdStartRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setHoldProgress(0);
  };

  const onPointerDown = () => {
    holdStartRef.current = Date.now();
    const tick = () => {
      if (holdStartRef.current === null) return;
      const elapsed = Date.now() - holdStartRef.current;
      setHoldProgress(holdExitProgress(elapsed));
      if (elapsed >= SENSORY_FOCUS_EXIT_HOLD_MS) {
        stopHold();
        onExit();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const onPointerUp = () => stopHold();

  const onClick = () => {
    const now = Date.now();
    if (shouldExitOnDoubleTap(now, lastTapRef.current)) {
      lastTapRef.current = 0;
      onExit();
      return;
    }
    lastTapRef.current = now;
  };

  const size = 36;
  const stroke = 2.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
      title={
        isAr
          ? 'خروج ولي الأمر: ضغط مطول 3 ثوانٍ أو نقرتان'
          : 'Parent exit: hold 3s or double-tap'
      }
      aria-label={
        isAr
          ? 'خروج من نمط التركيز — ضغط مطول أو نقرتان'
          : 'Exit focus mode — hold or double-tap'
      }
      className="absolute top-3 end-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-300/40 bg-white/30 opacity-40 backdrop-blur-sm transition hover:opacity-70 active:opacity-90"
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0 m-auto -rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(100,116,139,0.25)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(14,116,144,0.65)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - holdProgress)}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[10px] text-slate-500" aria-hidden>
        ✕
      </span>
    </button>
  );
}

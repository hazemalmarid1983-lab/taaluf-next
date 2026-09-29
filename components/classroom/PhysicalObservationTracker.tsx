'use client';

import {
  PROMPT_HIERARCHY_LEVELS,
  type PromptHierarchyLevel,
} from '@/lib/promptHierarchy';
import type { HomeClassroomGoal, TrialResult } from '@/lib/homeClassroomEngine';

/**
 * رصد مباشر لهدف حركي (لضم خرز، نقل كرات…) بأدوات حقيقية.
 * لا بطاقات اختيار ولا مثيرات رقمية: الأخصائي يسجّل مستوى التلقين الفعلي لكل محاولة.
 */
export default function PhysicalObservationTracker({
  goal,
  coach,
  isAr,
  trials,
  currentTrial,
  totalTrials,
  onRecord,
  onUndo,
}: {
  goal: HomeClassroomGoal;
  coach: { setup: string; verbalCue: string; support: string };
  isAr: boolean;
  trials: TrialResult[];
  currentTrial: number;
  totalTrials: number;
  onRecord: (level: PromptHierarchyLevel) => void;
  onUndo: () => void;
}) {
  const labelFor = (level: string) => {
    const option = PROMPT_HIERARCHY_LEVELS.find((item) => item.level === level);
    if (!option) return level;
    return isAr ? option.labelAr : option.labelEn;
  };
  const done = trials.length >= totalTrials;

  return (
    <div
      id="training-activity"
      className="space-y-5 rounded-3xl border-2 border-teal-300/80 bg-white/90 p-6 shadow-xl backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border border-teal-300 bg-teal-50 px-3 py-1 text-xs font-black text-teal-900">
          {isAr ? '🤲 رصد حركي مباشر — بلا شاشة للطفل' : '🤲 Live motor observation — no screen for the child'}
        </span>
        <span className="text-xs font-bold text-slate-500">
          {isAr
            ? `المحاولة ${currentTrial} من ${totalTrials}`
            : `Trial ${currentTrial} of ${totalTrials}`}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-5xl" aria-hidden>
          {goal.sampleItems[0]?.imageUrl || '🤲'}
        </span>
        <h3 className="min-w-0 flex-1 text-lg font-black leading-8 text-[#0b1f14]">
          {goal.sourceGoalText || goal.titleAr}
        </h3>
      </div>

      <ol className="space-y-2 text-xs leading-6 text-slate-700">
        <li>
          <strong>{isAr ? '١. التهيئة: ' : '1. Setup: '}</strong>
          {coach.setup}
        </li>
        <li>
          <strong>{isAr ? '٢. التعليمة: ' : '2. Instruction: '}</strong>
          {coach.verbalCue}
        </li>
        <li>
          <strong>{isAr ? '٣. المساعدة: ' : '3. Support: '}</strong>
          {coach.support}
        </li>
      </ol>

      {!done && (
        <div className="space-y-2">
          <p className="text-xs font-black text-[#0b1f14]">
            {isAr
              ? 'بعد انتهاء المحاولة، سجّل أعلى مستوى تلقين قدّمته فعلاً:'
              : 'After the trial ends, record the highest prompt level you actually gave:'}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PROMPT_HIERARCHY_LEVELS.map((option) => (
              <button
                key={option.level}
                type="button"
                onClick={() => onRecord(option.level)}
                className={`rounded-2xl border px-3 py-2.5 text-start text-xs font-black transition active:scale-[0.99] ${option.tone}`}
              >
                {isAr ? option.labelAr : option.labelEn}
              </button>
            ))}
          </div>
        </div>
      )}

      {trials.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-[11px] font-bold text-slate-500">
            {isAr ? 'المحاولات المسجّلة' : 'Recorded trials'}
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {trials.map((trial) => (
              <li
                key={trial.trialNumber}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700"
              >
                {trial.trialNumber}. {labelFor(trial.promptLevel)}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onUndo}
            className="text-[11px] font-semibold text-slate-400 underline transition hover:text-rose-600"
          >
            {isAr ? 'تراجع عن آخر محاولة' : 'Undo last recorded trial'}
          </button>
        </div>
      )}
    </div>
  );
}

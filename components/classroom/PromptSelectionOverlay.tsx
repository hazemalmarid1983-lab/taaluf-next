'use client';

import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';

/** خيارات الرصد الميداني — لا تُرسل أي قيمة قبل نقرة الملاحظ. */
export const FIELD_PROMPT_CHOICES: {
  level: PromptHierarchyLevel;
  labelAr: string;
  labelEn: string;
  tone: string;
}[] = [
  {
    level: 'independent',
    labelAr: 'مستقلة',
    labelEn: 'Independent',
    tone: 'border-emerald-500 bg-emerald-50 text-emerald-900',
  },
  {
    level: 'verbal',
    labelAr: 'مساعدة لفظية / إيماءة',
    labelEn: 'Verbal or gesture',
    tone: 'border-orange-400 bg-orange-50 text-orange-950',
  },
  {
    level: 'partial_physical',
    labelAr: 'مساعدة جسدية',
    labelEn: 'Physical prompt',
    tone: 'border-sky-500 bg-sky-50 text-sky-950',
  },
  {
    level: 'no_response',
    labelAr: 'عدم استجابة',
    labelEn: 'No response',
    tone: 'border-rose-400 bg-rose-50 text-rose-900',
  },
];

export default function PromptSelectionOverlay({
  isAr,
  onSelect,
}: {
  isAr: boolean;
  onSelect: (level: PromptHierarchyLevel) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[10050] flex items-end justify-center bg-slate-900/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'اختيار مستوى الدعم' : 'Choose support level'}
    >
      <div className="w-full max-w-lg rounded-3xl border border-white bg-white p-5 shadow-2xl">
        <p className="text-center text-lg font-black text-[#0b1f14]">
          {isAr ? 'ما مستوى الدعم في هذه المحاولة؟' : 'What support did this trial need?'}
        </p>
        <p className="mt-2 text-center text-xs leading-6 text-slate-500">
          {isAr
            ? 'المحاولة التالية متوقفة. لا تُحتسب استقلالية إلا إذا اخترت «مستقلة».'
            : 'The next trial is paused. Independence is counted only if you choose Independent.'}
        </p>
        <div className="mt-4 grid gap-2">
          {FIELD_PROMPT_CHOICES.map((choice) => (
            <button
              key={choice.level}
              type="button"
              onClick={() => onSelect(choice.level)}
              className={`rounded-2xl border-2 px-4 py-3 text-base font-black transition active:scale-[0.99] ${choice.tone}`}
            >
              {isAr ? choice.labelAr : choice.labelEn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

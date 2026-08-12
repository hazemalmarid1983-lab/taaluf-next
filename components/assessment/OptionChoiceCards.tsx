'use client';

import { cn } from '@/lib/utils';

export type ChoiceOption = {
  score: number;
  label: string;
  description: string;
};

type Props = {
  options: ChoiceOption[];
  value?: number | null;
  onChange: (score: number) => void;
  hint?: string;
};

export default function OptionChoiceCards({
  options,
  value,
  onChange,
  hint = 'اختر الوصف الأقرب لطبيعة طفلك:',
}: Props) {
  const sorted = [...options].sort((a, b) => a.score - b.score);
  const answered = value != null;

  return (
    <div className="space-y-0">
      <p className="mb-3 text-xs font-semibold text-slate-500">{hint}</p>
      {sorted.map((opt) => {
        const selected = answered && value === opt.score;
        return (
          <button
            key={opt.score}
            type="button"
            onClick={() => onChange(opt.score)}
            className={cn(
              'mb-[30px] w-full rounded-xl border-2 px-3 py-3 text-right transition last:mb-0',
              selected
                ? 'border-[#2D8B5A] bg-[#F0F9F4] ring-2 ring-[#2D8B5A]/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  'text-xs font-bold',
                  selected ? 'text-[#1f6b44]' : 'text-slate-700'
                )}
              >
                {opt.score} · {opt.label}
              </span>
              {selected ? (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2D8B5A] text-xs font-bold text-white">
                  ✓
                </span>
              ) : (
                <span className="inline-flex h-6 w-6 rounded-full border border-slate-200 bg-slate-50" />
              )}
            </div>
            <p
              className={cn(
                'mt-1.5 text-xs leading-6',
                selected ? 'text-slate-800' : 'text-slate-500'
              )}
            >
              {opt.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

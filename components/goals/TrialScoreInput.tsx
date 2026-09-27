'use client';

import {
  CLINICAL_PROMPT_LABELS_AR,
  CLINICAL_PROMPT_LEVELS,
  type ClinicalPromptLevel,
} from '@/lib/skillMastery';

/** تسجيل مستوى المساعدة لكل محاولة بالترتيب */
export default function TrialScoreInput({
  value,
  onChange,
  expectedCount,
}: {
  value: ClinicalPromptLevel[];
  onChange: (next: ClinicalPromptLevel[]) => void;
  expectedCount?: number;
}) {
  const full = expectedCount !== undefined && value.length >= expectedCount;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {CLINICAL_PROMPT_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            disabled={full}
            onClick={() => onChange([...value, level])}
            className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-40"
          >
            {CLINICAL_PROMPT_LABELS_AR[level]}
          </button>
        ))}
      </div>
      {value.length ? (
        <ol className="flex flex-wrap gap-1 text-xs">
          {value.map((level, i) => (
            <li key={`${i}-${level}`}>
              <button
                type="button"
                title="إزالة"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className={`rounded-full px-2 py-0.5 ${
                  level === 'Independent' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {i + 1}. {CLINICAL_PROMPT_LABELS_AR[level]} ×
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      <p className="text-xs text-slate-500">
        {value.length} محاولة
        {expectedCount !== undefined ? ` من ${expectedCount}` : ''}
      </p>
    </div>
  );
}

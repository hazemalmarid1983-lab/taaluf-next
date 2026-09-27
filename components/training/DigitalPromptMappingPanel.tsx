'use client';

import { DIGITAL_PROMPT_MAPPING_SUMMARY_AR } from '@/lib/skillMastery';
import { summarizeDigitalPromptMapping } from '@/lib/training/trainingResultsPresentation';
import type { TrainingPromptLevel } from '@/lib/training/types';

export default function DigitalPromptMappingPanel({
  trials,
  compact = false,
}: {
  trials: ReadonlyArray<{ promptLevel: TrainingPromptLevel }>;
  compact?: boolean;
}) {
  const summary = summarizeDigitalPromptMapping(trials);
  if (!summary.rows.length && !summary.sessionPromptLabelAr) return null;

  return (
    <div
      className={compact ? 'mt-4 border-t border-slate-100 pt-3' : 'mt-4 space-y-3'}
      aria-label="مطابقة المساعدات الرقمية مع مقياس المساعدة"
    >
      {summary.sessionPromptLabelAr ? (
        <p className="text-sm text-slate-700">
          <span className="font-semibold">المستوى السريري المسجّل للجلسة:</span>{' '}
          {summary.sessionPromptLabelAr}
        </p>
      ) : null}
      {summary.rows.length > 0 ? (
        <ul className={compact ? 'mt-2 space-y-1 text-xs' : 'space-y-2 text-sm'}>
          {summary.rows.map((row) => (
            <li
              key={row.cue}
              className={
                compact
                  ? 'flex justify-between gap-2'
                  : 'flex flex-wrap items-center justify-between gap-2 rounded-xl bg-blue-50/60 px-4 py-2'
              }
            >
              <span className="text-slate-700">
                {row.cueLabelAr} (رقمي) ←{' '}
                <strong className="text-slate-900">{row.clinicalLabelAr}</strong>
                {compact ? null : (
                  <span className="block text-xs text-slate-500">{row.onScreenAr}</span>
                )}
              </span>
              <span className="font-bold text-slate-900">{row.count}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {summary.rows.length > 0 && summary.pendingSignoff ? (
        <p className="mt-2 text-xs leading-5 text-amber-800">
          مطابقة المساعدات الرقمية ({DIGITAL_PROMPT_MAPPING_SUMMARY_AR}) بانتظار اعتماد الاستشاري السريري.
        </p>
      ) : null}
    </div>
  );
}

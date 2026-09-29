'use client';

import { DIGITAL_STIMULUS_SUPPORT_SUMMARY_AR } from '@/lib/skillMastery';
import { summarizeStimulusSupport } from '@/lib/training/trainingResultsPresentation';
import type { TrainingPromptLevel } from '@/lib/training/types';

export default function StimulusSupportPanel({
  trials,
  compact = false,
}: {
  trials: ReadonlyArray<{ promptLevel: TrainingPromptLevel }>;
  compact?: boolean;
}) {
  const summary = summarizeStimulusSupport(trials);
  if (!summary.totalTrials) return null;

  return (
    <div
      className={compact ? 'mt-4 border-t border-slate-100 pt-3' : 'mt-4 space-y-3'}
      aria-label="تلقين الاستجابة ودعم مصفوفة المثيرات"
    >
      <dl className="grid grid-cols-1 gap-1 text-sm text-slate-700">
        {summary.responsePromptLabelAr ? (
          <div>
            <dt className="inline font-semibold">تلقين الاستجابة (بشري):</dt>{' '}
            <dd className="inline">{summary.responsePromptLabelAr}</dd>
          </div>
        ) : null}
        {summary.stimulusSupportLabelAr ? (
          <div>
            <dt className="inline font-semibold">دعم المثير (رقمي):</dt>{' '}
            <dd className="inline">{summary.stimulusSupportLabelAr}</dd>
          </div>
        ) : null}
        <div>
          <dt className="inline font-semibold">محاولات صالحة للإتقان:</dt>{' '}
          <dd className="inline">
            {summary.validIndependentTrials} من {summary.totalTrials} (مستقلة على مصفوفة كاملة غير معدّلة)
          </dd>
        </div>
      </dl>
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
                {row.cueLabelAr} (رقمي) ← مصفوفة{' '}
                <strong className="text-slate-900">{row.arrayLabelAr}</strong>
                {row.targetHighlighted ? ' مع إبراز الهدف' : null}
                {compact ? null : (
                  <span className="block text-xs text-slate-500">{row.onScreenAr}</span>
                )}
              </span>
              <span className="font-bold text-slate-900">{row.count}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {summary.rows.length > 0 ? (
        <p className="mt-2 text-xs leading-5 text-slate-600">
          محاولات دعم المثير تُسجَّل منفصلة عن تلقين الاستجابة ولا تُحتسب مستقلة لأغراض الإتقان.
          {summary.pendingSignoff
            ? ` تصنيف المساعدات على مستويات المصفوفة (${DIGITAL_STIMULUS_SUPPORT_SUMMARY_AR}) بانتظار اعتماد الخبير التربوي.`
            : null}
        </p>
      ) : null}
    </div>
  );
}

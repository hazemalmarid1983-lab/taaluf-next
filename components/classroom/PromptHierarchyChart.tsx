'use client';

import {
  PROMPT_HIERARCHY_LEVELS,
  barSegmentColor,
  summarizePromptLevels,
  type PromptBreakdown,
  type PromptHierarchyLevel,
} from '@/lib/promptHierarchy';

/**
 * شريط تطور الاستقلالية عبر المحاولات + ملخص عددي.
 */
export default function PromptHierarchyChart({
  breakdown,
  sequence,
  isAr,
}: {
  breakdown: PromptBreakdown;
  sequence: PromptHierarchyLevel[];
  isAr: boolean;
}) {
  const total = sequence.length;
  if (!total) return null;

  const summaryText = summarizePromptLevels(breakdown, isAr);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <strong className="text-xs font-black text-[#0b1f14]">
          {isAr ? 'تطور استقلالية المحاولات' : 'Trial independence progression'}
        </strong>
        <span className="text-[10px] font-bold text-slate-500">
          {isAr ? `${total} محاولات` : `${total} trials`}
        </span>
      </div>

      <div className="flex h-4 overflow-hidden rounded-full bg-white shadow-inner">
        {sequence.map((level, index) => (
          <div
            key={`${level}-${index}`}
            className={`${barSegmentColor(level)} min-w-[8%] flex-1 transition-all`}
            title={
              PROMPT_HIERARCHY_LEVELS.find((item) => item.level === level)
                ? isAr
                  ? PROMPT_HIERARCHY_LEVELS.find((item) => item.level === level)!
                      .labelAr
                  : PROMPT_HIERARCHY_LEVELS.find((item) => item.level === level)!
                      .labelEn
                : level
            }
          />
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {sequence.map((level, index) => {
          const option = PROMPT_HIERARCHY_LEVELS.find(
            (item) => item.level === level
          );
          return (
            <div
              key={`dot-${index}`}
              className="flex flex-col items-center gap-1"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-lg shadow-sm ${barSegmentColor(level)} bg-opacity-90`}
              >
                {option?.emoji}
              </span>
              <span className="text-[9px] font-bold text-slate-500">
                {index + 1}
              </span>
            </div>
          );
        })}
      </div>

      <p className="rounded-xl border border-white bg-white/80 px-3 py-2.5 text-center text-[11px] font-bold leading-6 text-slate-700">
        {summaryText}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {PROMPT_HIERARCHY_LEVELS.filter(
          (item) => breakdown[item.level] > 0
        ).map((item) => (
          <span
            key={item.level}
            className="inline-flex items-center gap-1 rounded-full border border-white bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600"
          >
            <span>{item.emoji}</span>
            <span>{breakdown[item.level]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

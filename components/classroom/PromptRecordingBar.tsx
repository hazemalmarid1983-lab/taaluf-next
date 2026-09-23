'use client';

import { useEffect, useState } from 'react';
import {
  PROMPT_HIERARCHY_LEVELS,
  type PromptHierarchyLevel,
} from '@/lib/promptHierarchy';

/**
 * رصيف جانبي لتسجيل المساعدة.
 * لا يحجب مركز النشاط، ولا يفترض استقلالية قبل نقرة الملاحظ.
 */
export default function PromptRecordingBar({
  isAr,
  visible,
  onRecord,
}: {
  isAr: boolean;
  visible: boolean;
  /** مقبول للتوافق فقط — لا يُسجَّل تلقائياً. */
  suggestedLevel?: PromptHierarchyLevel | null;
  onRecord: (level: PromptHierarchyLevel) => void;
}) {
  const [selected, setSelected] = useState<PromptHierarchyLevel | null>(null);

  useEffect(() => {
    if (!visible) setSelected(null);
  }, [visible]);

  if (!visible) return null;

  const pick = (level: PromptHierarchyLevel) => {
    setSelected(level);
    onRecord(level);
  };

  return (
    <aside
      className="fixed bottom-3 left-3 z-[10050] flex max-h-[min(78dvh,34rem)] w-[min(17.5rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-[0_16px_40px_rgba(15,23,42,0.16)] backdrop-blur-md"
      aria-label={isAr ? 'اختيار مستوى الدعم' : 'Choose support level'}
    >
      <div className="border-b border-slate-100 px-3 py-2.5">
        <p className="text-xs font-black text-[#0b1f14]">
          {isAr ? 'مستوى الدعم في هذه المحاولة' : 'Support level for this trial'}
        </p>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">
          {isAr
            ? 'المحاولة التالية متوقفة. الاستقلالية تُحتسب فقط عند «استقلال تام».'
            : 'The next trial stays paused. Independence counts only for full independence.'}
        </p>
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto p-2">
        {PROMPT_HIERARCHY_LEVELS.map((option) => {
          const active = selected === option.level;
          return (
            <button
              key={option.level}
              type="button"
              onClick={() => pick(option.level)}
              className={`flex items-center gap-2 rounded-2xl border px-2.5 py-2 text-start transition active:scale-[0.99] ${option.tone} ${
                active ? 'ring-2 ring-offset-1' : ''
              }`}
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  option.level === 'independent'
                    ? 'bg-emerald-600'
                    : option.level === 'verbal_partial' || option.level === 'verbal'
                      ? 'bg-orange-500'
                      : option.level === 'gestural'
                        ? 'bg-blue-600'
                        : option.level === 'model'
                          ? 'bg-teal-600'
                          : option.level === 'partial_physical'
                            ? 'bg-amber-500'
                            : option.level === 'full_physical'
                              ? 'bg-red-600'
                              : 'bg-red-900'
                }`}
                aria-hidden
              />
              <span className="text-[11px] font-black leading-4">
                {isAr ? option.labelAr : option.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

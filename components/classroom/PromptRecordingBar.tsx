'use client';

import { useEffect, useState } from 'react';
import {
  PROMPT_HIERARCHY_LEVELS,
  PROMPT_QUICK_LEVELS,
  type PromptHierarchyLevel,
} from '@/lib/promptHierarchy';

/**
 * شريط رصد المساعدة بعد تفاعل الطفل.
 * لا يفترض استقلالية ولا يسجّل أي درجة دون نقرة الملاحظ.
 */
export default function PromptRecordingBar({
  isAr,
  visible,
  onRecord,
}: {
  isAr: boolean;
  visible: boolean;
  /** مقبول للتوافق فقط — لا يُستخدم ولا يُسجَّل تلقائياً. */
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

  const extraLevels = PROMPT_HIERARCHY_LEVELS.filter((item) => !item.quick);

  return (
    <div className="space-y-3 rounded-3xl border border-[#2E7D8E]/20 bg-gradient-to-b from-white/95 to-slate-50/90 p-4 shadow-md backdrop-blur-xl">
      <span className="text-xs font-black text-[#0b1f14]">
        {isAr ? 'درجة المساعدة في هذه المحاولة' : 'Prompt level for this trial'}
      </span>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
        {PROMPT_QUICK_LEVELS.map((option) => {
          const active = selected === option.level;
          return (
            <button
              key={option.level}
              type="button"
              onClick={() => pick(option.level)}
              className={`relative flex flex-col items-center rounded-2xl border-2 px-2 py-3 text-center transition active:scale-95 ${
                option.tone
              } ${active ? 'ring-2 ring-offset-1' : 'hover:brightness-[1.02]'}`}
            >
              <span className="text-2xl leading-none">{option.emoji}</span>
              <strong className="mt-1.5 text-[10px] font-black leading-4 sm:text-xs">
                {isAr ? option.labelAr : option.labelEn}
              </strong>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {extraLevels.map((option) => (
          <button
            key={option.level}
            type="button"
            onClick={() => pick(option.level)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold transition active:scale-95 ${option.tone}`}
          >
            <span>{option.emoji}</span>
            <span>{isAr ? option.labelAr : option.labelEn}</span>
          </button>
        ))}
      </div>

      <p className="text-center text-[10px] leading-5 text-slate-400">
        {isAr
          ? 'لا تُسجَّل الاستقلالية تلقائياً. اختاري الدرجة قبل المحاولة التالية.'
          : 'Independence is never assumed. Choose a level before the next trial.'}
      </p>
    </div>
  );
}

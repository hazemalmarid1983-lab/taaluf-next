'use client';

import { useEffect, useRef, useState } from 'react';
import {
  PROMPT_HIERARCHY_LEVELS,
  PROMPT_QUICK_LEVELS,
  type PromptHierarchyLevel,
} from '@/lib/promptHierarchy';

const AUTO_RECORD_MS = 2200;

/**
 * شريط رصد المساعدة بعد تفاعل الطفل: أزرار سريعة + افتراض «مستقل» عند الإجابة الصحيحة.
 */
export default function PromptRecordingBar({
  isAr,
  visible,
  suggestedLevel = null,
  onRecord,
}: {
  isAr: boolean;
  visible: boolean;
  suggestedLevel?: PromptHierarchyLevel | null;
  onRecord: (level: PromptHierarchyLevel) => void;
}) {
  const [selected, setSelected] = useState<PromptHierarchyLevel | null>(null);
  const [autoProgress, setAutoProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const clearAuto = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startRef.current = null;
    setAutoProgress(0);
  };

  useEffect(() => {
    if (!visible) {
      clearAuto();
      setSelected(null);
      return undefined;
    }

    if (suggestedLevel === 'independent') {
      setSelected('independent');
      startRef.current = Date.now();
      const tick = () => {
        if (startRef.current === null) return;
        const elapsed = Date.now() - startRef.current;
        setAutoProgress(Math.min(1, elapsed / AUTO_RECORD_MS));
        if (elapsed >= AUTO_RECORD_MS) {
          clearAuto();
          onRecord('independent');
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setSelected(null);
      clearAuto();
    }

    return clearAuto;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, suggestedLevel]);

  if (!visible) return null;

  const pick = (level: PromptHierarchyLevel) => {
    clearAuto();
    setSelected(level);
    onRecord(level);
  };

  const extraLevels = PROMPT_HIERARCHY_LEVELS.filter(
    (item) => !item.quick
  );

  return (
    <div className="space-y-3 rounded-3xl border border-[#2E7D8E]/20 bg-gradient-to-b from-white/95 to-slate-50/90 p-4 shadow-md backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-black text-[#0b1f14]">
          {isAr ? 'درجة المساعدة في هذه المحاولة' : 'Prompt level for this trial'}
        </span>
        {suggestedLevel === 'independent' && autoProgress > 0 && (
          <span className="text-[10px] font-bold text-emerald-700">
            {isAr
              ? `تسجيل تلقائي مستقل… ${Math.round((1 - autoProgress) * AUTO_RECORD_MS / 1000)}ث`
              : `Auto-recording independent… ${Math.round((1 - autoProgress) * AUTO_RECORD_MS / 1000)}s`}
          </span>
        )}
      </div>

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
              {suggestedLevel === 'independent' &&
                option.level === 'independent' &&
                autoProgress > 0 && (
                  <span
                    className="pointer-events-none absolute inset-x-1 bottom-1 h-1 overflow-hidden rounded-full bg-emerald-200/80"
                    aria-hidden
                  >
                    <span
                      className="block h-full bg-emerald-500 transition-all"
                      style={{ width: `${autoProgress * 100}%` }}
                    />
                  </span>
                )}
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
          ? 'عند الإجابة الصحيحة يُفترض «مستقل» تلقائياً — عدّلي بنقرة واحدة إن لزم.'
          : 'A correct response defaults to independent — tap once to change if needed.'}
      </p>
    </div>
  );
}

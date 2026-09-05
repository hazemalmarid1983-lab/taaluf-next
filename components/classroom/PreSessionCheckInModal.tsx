'use client';

import { useLanguage } from '@/components/LanguageProvider';
import {
  getReadinessPath,
  READINESS_OPTIONS,
  type ReadinessState,
} from '@/lib/adaptiveClinicalFlow';

/**
 * فحص جاهزية سريع قبل بدء الغرفة الصفية — يكيّف بداية الجلسة تلقائياً.
 */
export default function PreSessionCheckInModal({
  open,
  childName,
  onComplete,
}: {
  open: boolean;
  childName?: string;
  onComplete: (state: ReadinessState, path: ReturnType<typeof getReadinessPath>) => void;
}) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  if (!open) return null;

  const pick = (state: ReadinessState) => {
    onComplete(state, getReadinessPath(state));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pre-session-checkin-title"
    >
      <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white p-6 shadow-2xl">
        <h2
          id="pre-session-checkin-title"
          className="text-lg font-black text-[#0b1f14]"
        >
          {isAr ? '🧭 فحص الجاهزية' : '🧭 Readiness check'}
        </h2>
        <p className="mt-1 text-[11px] leading-6 text-slate-500">
          {childName
            ? isAr
              ? `كيف حالة ${childName} الآن قبل بدء التدريب؟`
              : `How is ${childName} feeling before training?`
            : isAr
              ? 'كيف حالة الطفل الآن قبل بدء التدريب؟'
              : 'How is the child feeling before training?'}
        </p>

        <div className="mt-5 grid gap-3">
          {READINESS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => pick(opt.id)}
              className="flex items-center gap-4 rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-4 text-start transition hover:border-[#2E7D8E]/40 hover:bg-white active:scale-[0.99]"
            >
              <span className="text-3xl leading-none">{opt.emoji}</span>
              <span className="min-w-0">
                <strong className="block text-sm font-black text-[#0b1f14]">
                  {isAr ? opt.labelAr : opt.labelEn}
                </strong>
                <span className="mt-0.5 block text-[11px] text-slate-500">
                  {isAr ? opt.hintAr : opt.hintEn}
                </span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-[10px] leading-5 text-slate-400">
          {isAr
            ? 'الاختيار يُوجّه المسار تلقائياً — هادئ للتدريب مباشرة، أو غرفة حسية للتهدئة أولاً.'
            : 'Your choice routes the session — calm starts training, others go to a calming room first.'}
        </p>
      </div>
    </div>
  );
}

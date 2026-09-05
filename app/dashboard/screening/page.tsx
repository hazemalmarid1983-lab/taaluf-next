'use client';

import { useEffect, useRef, useState } from 'react';
import ScreeningResultsHero from '@/components/screening/ScreeningResultsHero';
import { useStepNav } from '@/hooks/useStepNav';
import { unlockFullPath } from '@/lib/parentJourney';
import {
  SCREENING_ITEMS,
  SCREENING_LIKERT,
  calculateScreening,
  normalizeScreeningResult,
  type ScreeningResult,
} from '@/lib/screeningEngine';

type ScreeningItem = (typeof SCREENING_ITEMS)[number] & {
  question?: string;
  options?: Array<{ score: number; label: string; description: string }>;
};

const SCREENING_STORE_KEY = 'taaluf.screening.v1';
const TOTAL = SCREENING_ITEMS.length;

function readActiveChildId() {
  try {
    const active = JSON.parse(
      localStorage.getItem('taaluf.activeStudent') || 'null'
    );
    return active?.id ? String(active.id) : '';
  } catch {
    return '';
  }
}

function screeningMatchesChild(
  payload: { childId?: string; result?: ScreeningResult } | null,
  childId: string
) {
  if (!payload?.result?.domainScores) return false;
  if (!childId || !payload.childId) return true;
  return payload.childId === childId || payload.childId === 'child_local';
}

export default function ScreeningPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const { locked, go } = useStepNav(400);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advancingRef = useRef(false);

  useEffect(() => {
    try {
      const childId = readActiveChildId();
      const payload = JSON.parse(
        localStorage.getItem(SCREENING_STORE_KEY) || 'null'
      ) as { childId?: string; result?: ScreeningResult } | null;
      if (screeningMatchesChild(payload, childId) && payload?.result) {
        setResult(normalizeScreeningResult(payload.result));
      }
    } catch {
      /* ignore */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const item = SCREENING_ITEMS[step] as ScreeningItem | undefined;
  const progress = Math.round(((step + 1) / TOTAL) * 100);
  const selectedScore = item ? answers[item.id] : undefined;
  const answered = selectedScore != null;

  const options =
    item?.options ||
    SCREENING_LIKERT.map((l) => ({
      score: l.value,
      label: l.label,
      description: l.label,
    }));

  const finish = async (nextAnswers = answers) => {
    const missing = SCREENING_ITEMS.filter(
      (i) => nextAnswers[i.id] == null
    ).map((i) => i.id);
    if (missing.length > 0) {
      const first = SCREENING_ITEMS.findIndex((i) => missing.includes(i.id));
      setMsg(`تبقّى ${missing.length} أسئلة — أكملها لعرض النتيجة`);
      if (first >= 0) setStep(first);
      return;
    }

    setBusy(true);
    setMsg('جاري استخراج النتيجة…');
    try {
      const list = SCREENING_ITEMS.map((i) => ({
        id: i.id,
        value: Number(nextAnswers[i.id] ?? 0),
      }));
      const computed = calculateScreening(list);
      const childId = readActiveChildId() || 'child_local';
      const payload = {
        childId,
        answers: list,
        result: computed,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(SCREENING_STORE_KEY, JSON.stringify(payload));
      unlockFullPath();
      setResult(computed);
      setMsg('تم حفظ نتيجة الفرز');

      fetch('/api/screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, answers: list }),
      }).catch(() => {
        setMsg('حُفظت النتيجة محلياً — يمكنك المتابعة للألعاب');
      });
    } catch (err) {
      setMsg(
        err instanceof Error
          ? `تعذر استخراج النتيجة: ${err.message}`
          : 'تعذر استخراج النتيجة'
      );
    } finally {
      setBusy(false);
      advancingRef.current = false;
    }
  };

  const handleSelectOption = (score: number) => {
    if (!item || advancingRef.current || busy) return;
    setMsg('');
    const nextAnswers = { ...answers, [item.id]: score };
    setAnswers(nextAnswers);

    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advancingRef.current = true;
    advanceTimerRef.current = setTimeout(() => {
      if (step < TOTAL - 1) {
        setStep((prev) => prev + 1);
        window.scrollTo(0, 0);
        advancingRef.current = false;
      } else {
        void finish(nextAnswers);
      }
    }, 120);
  };

  if (!ready) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        جاري تحميل الفرز…
      </p>
    );
  }

  if (result?.domainScores) {
    return (
      <ScreeningResultsHero
        result={result}
        msg={msg}
        onRetake={
          busy
            ? undefined
            : () => {
                setResult(null);
                setStep(0);
                setMsg('');
              }
        }
      />
    );
  }

  return (
    <div
      className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-1 py-4 text-slate-900 sm:py-8"
      dir="rtl"
    >
      <div className="pointer-events-none print-glow absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-cyan-400/25 blur-[100px]" />
      <div className="pointer-events-none print-glow absolute -left-20 bottom-1/4 h-96 w-96 rounded-full bg-[#2E7D8E]/30 blur-[100px]" />

      <div className="relative z-10 w-full max-w-3xl space-y-6">
        <div className="space-y-4 rounded-3xl border border-white/90 bg-white/80 p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-md sm:p-10">
          <div className="flex items-center justify-between text-sm font-bold text-[#2E7D8E]">
            <span className="rounded-full bg-[#2E7D8E]/10 px-4 py-1.5">
              الفرز الأولي المجاني
            </span>
            <span className="text-slate-500">
              السؤال {step + 1} من {TOTAL}
            </span>
          </div>

          <h1 className="pt-2 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
            {item?.question || item?.text || 'سؤال الفرز'}
          </h1>
          <p className="text-sm font-medium text-slate-500 sm:text-base">
            اختر الوصف الأقرب لطبيعة طفلك — يتم الانتقال تلقائياً بعد اختيارك
          </p>

          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
            <div
              className="h-full bg-gradient-to-r from-[#2E7D8E] to-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/90 bg-white/80 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-md sm:p-8">
          <span className="mb-2 block text-sm font-bold text-slate-600">
            اختر أحد الخيارات التالية:
          </span>

          <div className="space-y-3">
            {options.map((opt) => {
              const isSelected = selectedScore === opt.score;
              return (
                <button
                  key={opt.score}
                  type="button"
                  onClick={() => handleSelectOption(opt.score)}
                  disabled={busy}
                  className={`flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-right transition-all ${
                    isSelected
                      ? 'scale-[1.01] border-[#2E7D8E] bg-cyan-50/70 shadow-md'
                      : 'border-slate-200/80 bg-white/60 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div
                    className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                      isSelected
                        ? 'border-[#2E7D8E] bg-[#2E7D8E]'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="block h-2.5 w-2.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-base font-semibold text-slate-900 sm:text-lg">
                      {opt.label}
                    </div>
                    <div className="text-xs font-normal leading-relaxed text-slate-600 sm:text-sm">
                      {opt.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {msg && (
            <p className="pt-1 text-center text-sm font-medium text-amber-800">
              {msg}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-4">
            <button
              type="button"
              disabled={step === 0 || locked}
              onClick={() => {
                if (advanceTimerRef.current) {
                  clearTimeout(advanceTimerRef.current);
                }
                advancingRef.current = false;
                go(() => setStep((s) => Math.max(0, s - 1)));
              }}
              className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-500 transition hover:bg-white/70 disabled:opacity-40"
            >
              السابق
            </button>
            <button
              type="button"
              disabled={busy || locked || !answered}
              onClick={() => {
                if (!answered) {
                  setMsg('اختر إجابة لهذا السؤال أولاً');
                  return;
                }
                if (step >= TOTAL - 1) {
                  void finish();
                  return;
                }
                go(() => setStep((s) => Math.min(TOTAL - 1, s + 1)));
              }}
              className={`rounded-2xl px-8 py-3.5 text-base font-bold shadow-lg transition-all ${
                answered && !busy
                  ? 'scale-[1.02] bg-gradient-to-r from-[#2E7D8E] to-teal-600 text-white hover:shadow-cyan-500/20'
                  : 'cursor-not-allowed bg-slate-300 text-slate-500'
              }`}
            >
              {step >= TOTAL - 1
                ? busy
                  ? 'جاري استخراج النتيجة…'
                  : 'إنهاء وعرض النتيجة'
                : 'التالي'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import OptionChoiceCards from '@/components/assessment/OptionChoiceCards';
import ScreeningResultsHero from '@/components/screening/ScreeningResultsHero';
import { useStepNav } from '@/hooks/useStepNav';
import {
  SCREENING_DIMENSIONS,
  SCREENING_ITEMS,
  SCREENING_LIKERT,
  bandLabelAr,
  calculateScreening,
  type ScreeningResult,
} from '@/lib/screeningEngine';

type ScreeningItem = (typeof SCREENING_ITEMS)[number] & {
  question?: string;
  options?: Array<{ score: number; label: string; description: string }>;
};

export default function ScreeningPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const { locked, go } = useStepNav(500);

  const dimension = SCREENING_DIMENSIONS[step];
  const items = useMemo(
    () =>
      (SCREENING_ITEMS as ScreeningItem[]).filter(
        (i) => i.dimension === dimension?.id
      ),
    [dimension]
  );
  const progress = Math.round(((step + 1) / SCREENING_DIMENSIONS.length) * 100);
  const stepComplete = items.every((i) => answers[i.id] != null);

  const finish = async () => {
    const list = SCREENING_ITEMS.map((i) => ({
      id: i.id,
      value: Number(answers[i.id] ?? 0),
    }));
    const computed = calculateScreening(list);
    setResult(computed);
    setBusy(true);
    setMsg('جاري حفظ نتيجة الفرز…');

    try {
      let childId = 'child_local';
      try {
        const active = JSON.parse(
          localStorage.getItem('taaluf.activeStudent') || 'null'
        );
        if (active?.id) childId = active.id;
      } catch {
        /* ignore */
      }

      const payload = {
        childId,
        answers: list,
        result: computed,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('taaluf.screening.v1', JSON.stringify(payload));

      await fetch('/api/screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, answers: list }),
      });

      await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: childId,
          ageBand: '5-6',
          scores: list.map((a) => ({
            criterionId: a.id,
            score: a.value,
          })),
          aiAnalysis: {
            analysis: `فرز أولي: ${computed.overall}% · ${bandLabelAr(computed.band)}`,
            confidence: 0.5,
          },
        }),
      }).catch(() => undefined);

      setMsg('تم حفظ نتيجة الفرز');
    } catch {
      setMsg('حُفظت محلياً — تعذر الحفظ السحابي');
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <ScreeningResultsHero
        result={result}
        msg={msg}
        onRetake={busy ? undefined : () => setResult(null)}
      />
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-3xl border border-emerald-100 bg-white p-6">
        <p className="text-sm font-semibold text-[#2D8B5A]">
          الفرز الأولي · البعد {step + 1} من {SCREENING_DIMENSIONS.length}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#0b1f14]">
          {dimension?.label_ar}
        </h1>
        <p className="mt-2 text-xs leading-6 text-slate-500">
          اختر الوصف الأقرب لطبيعة طفلك في كل سؤال (مستقر ← شديد جداً)
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-50">
          <div
            className="h-full rounded-full bg-[#2D8B5A] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const options =
            item.options ||
            SCREENING_LIKERT.map((l) => ({
              score: l.value,
              label: l.label,
              description: l.label,
            }));
          return (
            <div
              key={item.id}
              className="rounded-3xl border border-emerald-100 bg-white p-5"
            >
              <p className="rounded-xl bg-[#F0F9F4] px-3 py-3 text-sm font-medium leading-7 text-[#0b1f14]">
                {item.question || item.text}
              </p>
              <div className="mt-3">
                <OptionChoiceCards
                  options={options}
                  value={answers[item.id]}
                  onChange={(score) =>
                    setAnswers((prev) => ({ ...prev, [item.id]: score }))
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between gap-3">
        <Button
          variant="ghost"
          disabled={step === 0 || locked}
          onClick={() => go(() => setStep((s) => Math.max(0, s - 1)))}
        >
          السابق
        </Button>
        {step >= SCREENING_DIMENSIONS.length - 1 ? (
          <Button disabled={!stepComplete || busy || locked} onClick={finish}>
            إنهاء وعرض النتيجة
          </Button>
        ) : (
          <Button
            disabled={!stepComplete || locked}
            onClick={() => go(() => setStep((s) => s + 1))}
          >
            التالي
          </Button>
        )}
      </div>
    </section>
  );
}

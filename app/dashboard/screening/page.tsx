'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  SCREENING_DIMENSIONS,
  SCREENING_ITEMS,
  SCREENING_LIKERT,
  bandLabelAr,
  calculateScreening,
  type ScreeningResult,
} from '@/lib/screeningEngine';

export default function ScreeningPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const dimension = SCREENING_DIMENSIONS[step];
  const items = useMemo(
    () => SCREENING_ITEMS.filter((i) => i.dimension === dimension?.id),
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

      // توافق مع مسار التقييم العام
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
      <section className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-3xl bg-[#0b1f14] p-7 text-white">
          <p className="text-sm text-emerald-200">نتيجة الفرز الأولي</p>
          <h1 className="mt-2 text-3xl font-bold">
            {result.overall}% · {bandLabelAr(result.band)}
          </h1>
          <p className="mt-3 text-sm leading-7 text-emerald-100/80">
            {result.band === 'elevated'
              ? 'المؤشر مرتفع — يُوصى بالمتابعة إلى التقييم التربوي الكامل.'
              : result.band === 'moderate'
                ? 'مؤشر متوسط — يمكن المتابعة بالتقييم الكامل عند الحاجة.'
                : 'ملف متوازن نسبياً — المتابعة الروتينية كافية حالياً.'}
          </p>
        </div>

        <ul className="space-y-3 rounded-3xl border border-emerald-100 bg-white p-6">
          {result.domainScores.map((d) => (
            <li
              key={d.dimension}
              className="flex items-center justify-between text-sm"
            >
              <span className="font-semibold text-slate-800">{d.label_ar}</span>
              <span className="text-slate-600">{d.scorePercent}%</span>
            </li>
          ))}
        </ul>

        {result.recommendFullAssessment && (
          <Link
            href="/dashboard/assessments/new"
            className="block rounded-2xl bg-[#2D8B5A] px-5 py-4 text-center font-semibold text-white"
          >
            الانتقال إلى التقييم الكامل
          </Link>
        )}
        <p className="text-center text-sm text-[#2D8B5A]">{msg}</p>
        <Button variant="outline" onClick={() => setResult(null)} disabled={busy}>
          إعادة الفرز
        </Button>
      </section>
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
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-50">
          <div
            className="h-full rounded-full bg-[#2D8B5A] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl border border-emerald-100 bg-white p-5"
          >
            <p className="text-sm font-medium leading-7 text-slate-800">
              {item.text}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SCREENING_LIKERT.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [item.id]: opt.value }))
                  }
                  className={
                    answers[item.id] === opt.value
                      ? 'rounded-xl bg-[#2D8B5A] px-3 py-2 text-sm font-semibold text-white'
                      : 'rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-[#2D8B5A]'
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between gap-3">
        <Button
          variant="ghost"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          السابق
        </Button>
        {step >= SCREENING_DIMENSIONS.length - 1 ? (
          <Button disabled={!stepComplete || busy} onClick={finish}>
            إنهاء وعرض النتيجة
          </Button>
        ) : (
          <Button
            disabled={!stepComplete}
            onClick={() => setStep((s) => s + 1)}
          >
            التالي
          </Button>
        )}
      </div>
    </section>
  );
}

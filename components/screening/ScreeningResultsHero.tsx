'use client';

import Link from 'next/link';
import type { ScreeningResult } from '@/lib/screeningEngine';
import {
  SCREENING_THRESHOLDS,
  bandLabelAr,
  canonicalScreeningDomainLabel,
  getImmediateScreeningTip,
} from '@/lib/screeningEngine';
import { PARENT_ROUTES } from '@/lib/parentJourney';
import PdfExportButton from '@/components/reports/PdfExportButton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Tone = 'green' | 'yellow' | 'red';

function statusFromPercent(scorePercent: number): {
  status: string;
  tone: Tone;
  hint: string;
} {
  if (scorePercent < SCREENING_THRESHOLDS.moderate) {
    return {
      status: 'مستقر',
      tone: 'green',
      hint: 'المؤشرات ضمن المدى المتوازن حالياً',
    };
  }
  if (scorePercent < SCREENING_THRESHOLDS.elevated) {
    return {
      status: 'بحاجة متابعة',
      tone: 'yellow',
      hint: 'يُفضّل المتابعة بدعم تربوي موجّه',
    };
  }
  return {
    status: 'أولوية دعم',
    tone: 'red',
    hint: 'يُوصى بإكمال المسار حتى التقرير التربوي',
  };
}

const TONE_CLASS: Record<Tone, string> = {
  green: 'border-[#2D8B5A]/40 bg-[#F0F9F4]',
  yellow: 'border-amber-200 bg-[#FFFBEB]/70',
  red: 'border-red-200 bg-[#FEF2F2]/70',
};

const TONE_TEXT: Record<Tone, string> = {
  green: 'text-[#2D8B5A]',
  yellow: 'text-[#B45309]',
  red: 'text-[#991B1B]',
};

export default function ScreeningResultsHero({
  result,
  msg,
  onRetake,
}: {
  result: ScreeningResult;
  msg?: string;
  onRetake?: () => void;
}) {
  const activeTip = getImmediateScreeningTip(result);

  return (
    <section className="screening-results-print print-document mx-auto max-w-2xl space-y-5 print:bg-white print:p-0" dir="rtl">
      <div className="sticky top-2 z-50 print:hidden">
        <PdfExportButton
          documentTitle="نتيجة_الفرز_تآلف"
          label="تنزيل التقرير / بطاقة الدعم (PDF) 📥"
          className="h-14 w-full rounded-2xl bg-amber-500 text-base font-black text-slate-900 shadow-lg hover:bg-amber-400 hover:text-slate-900"
        />
      </div>
      <header className="rounded-3xl border border-gray-100 bg-white px-6 py-8 text-center shadow-sm">
        <span className="mb-3 inline-block rounded-full border border-[#2E7D8E]/20 bg-[#FAF7F1] px-3.5 py-1.5 text-xs font-bold text-[#2E7D8E]">
          مجاني • الفرز الأولي اكتمل
        </span>
        <h1 className="mb-2 text-3xl font-bold text-[#1F2A37]">
          نتائج الفرز لطفلك
        </h1>
        <p className="mx-auto max-w-xl text-xs text-gray-500">
          المؤشر العام:{' '}
          <strong className="text-[#1F2A37]">%{result.overall}</strong> •{' '}
          {bandLabelAr(result.band)} • الفرز مجاني. التقييم الكامل والاشتراك
          يتيحان لك باقي المسار.
        </p>
      </header>

      <div className="rounded-2xl border-2 border-[#2E7D8E]/30 bg-gradient-to-l from-[#F0FDFA] to-[#FAF7F1] p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-white p-2 text-2xl shadow-sm" aria-hidden>
            💡
          </span>
          <div>
            <span className="text-xs font-bold tracking-wide text-[#2E7D8E]">
              توصية تآلف الفورية (بناءً على نتائج اليوم)
            </span>
            <h3 className="mb-1.5 mt-0.5 text-base font-bold text-[#1F2A37]">
              {activeTip.title}
            </h3>
            <p className="text-xs leading-relaxed text-gray-700 sm:text-sm">
              {activeTip.tip}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {result.domainScores.map((d) => {
          const mapped = statusFromPercent(d.scorePercent);
          const isHighNeed = d.scorePercent >= 60;
          return (
            <article
              key={d.dimension}
              className={cn(
                'rounded-2xl border p-5 text-center transition',
                isHighNeed ? TONE_CLASS.red : TONE_CLASS[mapped.tone]
              )}
            >
              <span className="mb-1 block text-xs text-gray-500">
                {canonicalScreeningDomainLabel(d.label_ar || d.dimension)}
              </span>
              <h3
                className={cn(
                  'mb-1 text-lg font-bold',
                  isHighNeed ? TONE_TEXT.red : TONE_TEXT[mapped.tone]
                )}
              >
                {mapped.status}
              </h3>
              <span className="block text-[11px] text-gray-400">
                {mapped.hint} • %{d.scorePercent}
              </span>
            </article>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center print:hidden">
        <span className="block text-xs text-gray-400">اختر الخطوة التالية</span>
        <h2 className="mt-1 text-lg font-bold text-[#1F2A37]">
          الألعاب أو إكمال التقييم
        </h2>
        <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={`${PARENT_ROUTES.pay}?plan=assessment`}
            className="rounded-xl bg-[#2E7D8E] px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#256675]"
          >
            إكمال التقييم الشامل وإصدار التقرير
          </Link>
          <Link
            href={PARENT_ROUTES.community}
            className="rounded-xl border border-[#2E7D8E]/30 bg-[#FAF7F1] px-6 py-3 text-sm font-bold text-[#2E7D8E] transition hover:bg-gray-50"
          >
            تصفح أنشطة المجتمع
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          <Link href={PARENT_ROUTES.games} className="block">
            <Button variant="outline" className="h-11 w-full font-bold">
              العب مغامرة البطل الصغير
            </Button>
          </Link>
          <Link href={PARENT_ROUTES.booking} className="block">
            <Button variant="secondary" className="h-11 w-full font-bold">
              حجز موعد للتواصل مع المختص
            </Button>
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
          {onRetake ? (
            <button type="button" onClick={onRetake} className="underline">
              إعادة الفرز
            </button>
          ) : null}
        </div>
        {msg ? (
          <p className="mt-3 text-center text-sm text-[#2D8B5A]">{msg}</p>
        ) : null}
      </div>
    </section>
  );
}

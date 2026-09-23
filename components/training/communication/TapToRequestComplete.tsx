'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { TrainingSessionMetrics } from '@/lib/training/engine/types';
import { resolveTapToRequestSessionDetailHref } from '@/lib/training/tapToRequestCompletion';
import {
  formatResponseTimeMs,
  promptBreakdownEntries,
} from '@/lib/training/trainingResultsPresentation';

type Props = {
  sessionId: string;
  stars: number;
  sessionSaved: boolean;
  metrics: TrainingSessionMetrics;
  onDone: () => void;
};

export default function TapToRequestComplete({
  sessionId,
  stars,
  sessionSaved,
  metrics,
  onDone,
}: Props) {
  const breakdownEntries = promptBreakdownEntries(metrics);
  const detailHref = resolveTapToRequestSessionDetailHref(sessionId);

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-[#F0F7FA] to-[#DCE9EE] px-6 py-10"
      dir="rtl"
    >
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center text-center">
        <p className="text-sm font-bold text-[#2E7D8E]">انتهت الجلسة</p>
        <h2 className="mt-2 text-2xl font-black text-slate-900">أحسنت!</h2>
        <div className="mt-6 flex gap-2 text-3xl" aria-label={`نجوم: ${stars}`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= stars ? 'opacity-100' : 'opacity-25'}>
              ⭐
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-600">
          {sessionSaved
            ? 'تم حفظ نتائج التدريب على هذا الجهاز.'
            : 'تعذر الحفظ — يمكن إعادة المحاولة لاحقاً.'}
        </p>
      </div>

      <section
        className="mx-auto mb-4 w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white/90 p-4 text-right shadow-sm"
        aria-label="ملخص المراقب"
      >
        <h3 className="text-sm font-black text-[#0b1f14]">
          ملخص التدريب — للمراقب
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          أرقام الجلسة الرقمية فقط. لا تُعد إتقاناً للمعيار ولا تشخيصاً.
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-slate-500">المحاولات</dt>
            <dd className="font-bold text-slate-900">{metrics.totalTrials}</dd>
          </div>
          <div>
            <dt className="text-slate-500">الصحيح</dt>
            <dd className="font-bold text-emerald-800">{metrics.correctCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">الخطأ</dt>
            <dd className="font-bold text-slate-800">{metrics.incorrectCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">الدقة</dt>
            <dd className="font-bold text-slate-900">{metrics.accuracy}%</dd>
          </div>
          <div>
            <dt className="text-slate-500">الاستقلالية</dt>
            <dd className="font-bold text-slate-900">{metrics.independence}%</dd>
          </div>
          <div>
            <dt className="text-slate-500">متوسط زمن الاستجابة</dt>
            <dd className="font-bold text-slate-900">
              {formatResponseTimeMs(metrics.averageResponseTimeMs)}
            </dd>
          </div>
        </dl>
        {breakdownEntries.length > 0 ? (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-500">توزيع المساعدة</p>
            <ul className="mt-2 space-y-1 text-sm">
              {breakdownEntries.map((row) => (
                <li key={row.level} className="flex justify-between gap-2">
                  <span className="text-slate-700">{row.labelAr}</span>
                  <span className="font-bold text-slate-900">{row.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <div className="mx-auto mb-3 w-full max-w-lg">
        <Button
          type="button"
          variant="outline"
          className="w-full border-[#2E7D8E]/40 text-[#2E7D8E]"
          size="lg"
          asChild
        >
          <Link href={detailHref}>عرض تفاصيل الجلسة</Link>
        </Button>
      </div>

      <Button type="button" className="mx-auto mb-4 w-full max-w-lg" size="lg" onClick={onDone}>
        تم
      </Button>
    </div>
  );
}

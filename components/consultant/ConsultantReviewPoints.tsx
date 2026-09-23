'use client';

import Link from 'next/link';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { SCIENTIFIC_REVIEW_POINTS } from '@/lib/consultantRoom/reviewPoints';

export default function ConsultantReviewPoints() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">نقاط المراجعة العلمية</h2>
        <p className="mt-1 text-sm text-slate-500">
          استفسارات مفتوحة للنقاش مع المستشار — دون قرارات علمية مسبقة.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SCIENTIFIC_REVIEW_POINTS.map((point) => (
          <Card key={point.id} className="border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D8E]">
              {point.domainAr}
            </p>
            <CardTitle className="mt-2 text-sm font-semibold leading-relaxed text-slate-800">
              {point.questionAr}
            </CardTitle>
            {point.relatedHref ? (
              <CardDescription className="mt-3">
                <Link
                  href={point.relatedHref}
                  className="text-xs font-medium text-[#2E7D8E] hover:underline"
                >
                  معاينة المحتوى ذي الصلة
                </Link>
              </CardDescription>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}

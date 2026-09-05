'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ParentAfterScreeningChoice from '@/components/parent/ParentAfterScreeningChoice';

function PayInner() {
  const params = useSearchParams();
  const plan = params.get('plan');
  const highlight =
    plan === 'monitoring' || plan === 'assessment' ? plan : undefined;

  return (
    <section className="mx-auto max-w-2xl">
      <ParentAfterScreeningChoice highlight={highlight} />
    </section>
  );
}

export default function PayAssessmentPage() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-sm text-slate-500">
          جاري تحميل الخيارات…
        </p>
      }
    >
      <PayInner />
    </Suspense>
  );
}

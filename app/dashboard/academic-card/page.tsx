'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AcademicAccommodationsCard from '@/components/reports/AcademicAccommodationsCard';
import {
  evaluateLearningScreening,
  type LearningScreeningResult,
} from '@/lib/learningScreeningEngine';
import { PARENT_ROUTES, readActiveChild } from '@/lib/parentJourney';

const STORE_KEY = 'taaluf.learningScreening.v1';
const STORE_KEY_ALIAS = 'taaluf_learning_screening_answers';

type StoredPayload = {
  childId?: string;
  answers?: Record<string, number>;
  result?: LearningScreeningResult;
};

function readStoredResult(): LearningScreeningResult | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const payload = JSON.parse(raw) as StoredPayload;
      if (payload?.result?.domainResults) return payload.result;
      if (payload?.answers) return evaluateLearningScreening(payload.answers);
    }
    const alias = localStorage.getItem(STORE_KEY_ALIAS);
    if (alias) {
      const answers = JSON.parse(alias) as Record<string, number>;
      if (answers && typeof answers === 'object') {
        return evaluateLearningScreening(answers);
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export default function AcademicCardPage() {
  const [result, setResult] = useState<LearningScreeningResult | null>(null);
  const [ready, setReady] = useState(false);
  const child = ready ? readActiveChild() : null;

  useEffect(() => {
    setResult(readStoredResult());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        جاري تجهيز البطاقة المدرسية…
      </p>
    );
  }

  if (!result) {
    return (
      <div
        className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 py-8 text-center"
        dir="rtl"
      >
        <div className="pointer-events-none absolute -right-20 top-1/4 h-80 w-80 rounded-full bg-amber-400/20 blur-[110px]" />
        <div className="max-w-md space-y-4 rounded-3xl border border-white/90 bg-white/85 p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
          <span className="text-4xl">📑</span>
          <h2 className="text-lg font-bold text-slate-800">
            لا توجد نتيجة فرز أكاديمي مسجّلة
          </h2>
          <p className="text-xs text-slate-500">
            أكمل الفرز الأكاديمي أولاً لتوليد بطاقة التسهيلات المدرسية.
          </p>
          <Link
            href={PARENT_ROUTES.learningScreening}
            className="block rounded-xl bg-[#2E7D8E] py-3 text-xs font-bold text-white"
          >
            الانتقال للفرز الأكاديمي
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] overflow-hidden px-1 py-4 sm:py-8" dir="rtl">
      <div className="pointer-events-none print-glow absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-teal-400/15 blur-[120px]" />
      <div className="pointer-events-none print-glow absolute -left-24 bottom-1/4 h-96 w-96 rounded-full bg-amber-500/15 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href={PARENT_ROUTES.learningScreening}
            className="text-sm font-bold text-slate-500 transition hover:text-[#2E7D8E]"
          >
            العودة لنتيجة الفرز
          </Link>
          <Link
            href={PARENT_ROUTES.pathways}
            className="text-sm font-bold text-[#2E7D8E]"
          >
            بوابة المسارات
          </Link>
        </div>

        <AcademicAccommodationsCard
          childName={child?.name || 'الطالب / الطالبة'}
          gradeLevel={
            child?.age ? `العمر ${child.age} سنة` : 'المرحلة الابتدائية'
          }
          result={result}
        />
      </div>
    </div>
  );
}

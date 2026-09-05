'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import IepReportSheet from '@/components/reports/IepReportSheet';
import { useLanguage } from '@/components/LanguageProvider';
import type { ComprehensiveAssessmentReport } from '@/lib/academicAssessmentEngine';
import { PARENT_ROUTES } from '@/lib/parentJourney';

export default function AssessmentResultsPage() {
  const { t, dir } = useLanguage();
  const [report, setReport] = useState<ComprehensiveAssessmentReport | null>(
    null
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem('taaluf_comprehensive_academic_report');
      if (raw) setReport(JSON.parse(raw) as ComprehensiveAssessmentReport);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8" dir={dir}>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={PARENT_ROUTES.academicAssessment} className="text-sm text-[#2E7D8E]">
          {t('backHome')}
        </Link>
        <Link href={PARENT_ROUTES.academicCard} className="text-sm font-bold text-[#2E7D8E]">
          {t('viewPrintCard')}
        </Link>
      </div>
      {report ? (
        <IepReportSheet report={report} />
      ) : (
        <div className="space-y-4 rounded-3xl border border-white/90 bg-white/85 p-8 text-center text-sm text-slate-500 print:hidden">
          <p>{t('noSavedAssessment')}</p>
          <Link
            href={PARENT_ROUTES.academicAssessment}
            className="inline-block rounded-2xl bg-[#2E7D8E] px-6 py-3 text-xs font-bold text-white"
          >
            {t('comprehensiveReport')}
          </Link>
        </div>
      )}
    </div>
  );
}

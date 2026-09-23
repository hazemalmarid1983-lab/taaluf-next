'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LdMinistryReportDocument from '@/components/reports/LdMinistryReportDocument';
import { useLanguage } from '@/components/LanguageProvider';
import type { ComprehensiveAssessmentReport } from '@/lib/academicAssessmentEngine';
import {
  buildMoeIepReport,
  buildMoeIntegrationReport,
  buildMoeProgressReport,
  type LdMinistryReport,
} from '@/lib/ldReporting/reportBuilder';
import { getActiveLdIep } from '@/lib/ldIep/store';
import { listResourceRoomSessions } from '@/lib/resourceRoom/store';
import { LD_ROUTES } from '@/lib/parentJourney';
import { getLdStudentProfile } from '@/lib/tracks/studentProfile';
import { readLdActiveStudent } from '@/lib/tracks/trackContext';
import { LD_STORAGE } from '@/lib/tracks/storageKeys';

type ReportKind = 'integration' | 'iep' | 'progress';

export default function LdReportsPage() {
  const { t, dir } = useLanguage();
  const [report, setReport] = useState<LdMinistryReport | null>(null);
  const [kind, setKind] = useState<ReportKind>('progress');

  useEffect(() => {
    generateReport('progress');
  }, []);

  const generateReport = (reportKind: ReportKind) => {
    setKind(reportKind);
    const child = readLdActiveStudent();
    if (!child) return;

    const profile = getLdStudentProfile(child.id) ?? {
      id: child.id,
      name: child.name,
      track: 'learning_disabilities' as const,
      schoolIntegration: {},
      evaluationMetrics: [],
      educationalIndicators: [],
      accommodations: [],
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sessions = listResourceRoomSessions(child.id);
    const iep = getActiveLdIep(child.id);

    let assessment: ComprehensiveAssessmentReport | null = null;
    try {
      const raw =
        localStorage.getItem(LD_STORAGE.assessmentReport) ||
        localStorage.getItem('taaluf_comprehensive_academic_report');
      if (raw) assessment = JSON.parse(raw);
    } catch {
      /* ignore */
    }

    if (reportKind === 'integration') {
      setReport(buildMoeIntegrationReport(profile, iep, sessions));
    } else if (reportKind === 'iep' && iep) {
      setReport(buildMoeIepReport(profile, iep));
    } else {
      setReport(
        buildMoeProgressReport(profile, assessment, iep, sessions)
      );
    }
  };

  return (
    <div dir={dir}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">{t('ldReports')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('ldReportsSubtitle')}</p>
        </div>
        <Link
          href={LD_ROUTES.academicCard}
          className="rounded-xl border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50"
        >
          {t('viewPrintCard')}
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ['progress', t('ldReportProgress')],
            ['integration', t('ldReportIntegration')],
            ['iep', t('ldReportIep')],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => generateReport(k)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              kind === k
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-600 hover:bg-amber-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {report ? (
        <LdMinistryReportDocument report={report} />
      ) : (
        <div className="rounded-2xl border border-dashed border-amber-200 p-8 text-center text-sm text-slate-500">
          {t('ldSelectStudentFirst')}
        </div>
      )}
    </div>
  );
}

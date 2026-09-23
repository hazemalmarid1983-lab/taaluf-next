'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LdIepGoalTracker from '@/components/ld/LdIepGoalTracker';
import { useLanguage } from '@/components/LanguageProvider';
import type { ComprehensiveAssessmentReport } from '@/lib/academicAssessmentEngine';
import { buildIepFromAssessment } from '@/lib/ldIep/engine';
import { getActiveLdIep, saveLdIep } from '@/lib/ldIep/store';
import type { LdIndividualEducationPlan } from '@/lib/ldIep/types';
import { LD_ROUTES } from '@/lib/parentJourney';
import { LD_STORAGE } from '@/lib/tracks/storageKeys';
import { readLdActiveStudent } from '@/lib/tracks/trackContext';

export default function LdIepPage() {
  const { t, dir } = useLanguage();
  const [plan, setPlan] = useState<LdIndividualEducationPlan | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const child = readLdActiveStudent();
    if (!child) return;

    const existing = getActiveLdIep(child.id);
    if (existing) {
      setPlan(existing);
      return;
    }

    try {
      const raw = localStorage.getItem(LD_STORAGE.assessmentReport) ||
        localStorage.getItem('taaluf_comprehensive_academic_report');
      if (!raw) return;
      const report = JSON.parse(raw) as ComprehensiveAssessmentReport;
      const generated = buildIepFromAssessment(report, child.id);
      generated.childName = child.name;
      const saved = saveLdIep(generated);
      setPlan(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const generateFromAssessment = () => {
    const child = readLdActiveStudent();
    if (!child) {
      setMsg(t('ldSelectStudentFirst'));
      return;
    }
    try {
      const raw =
        localStorage.getItem(LD_STORAGE.assessmentReport) ||
        localStorage.getItem('taaluf_comprehensive_academic_report');
      if (!raw) {
        setMsg(t('ldNoAssessmentForIep'));
        return;
      }
      const report = JSON.parse(raw) as ComprehensiveAssessmentReport;
      const generated = buildIepFromAssessment(report, child.id);
      generated.childName = child.name;
      const saved = saveLdIep(generated);
      setPlan(saved);
      setMsg(t('ldIepGenerated'));
    } catch {
      setMsg(t('ldIepGenerateError'));
    }
  };

  return (
    <div dir={dir}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">{t('ldIep')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('ldIepSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          {!plan && (
            <button
              type="button"
              onClick={generateFromAssessment}
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
            >
              {t('ldGenerateIep')}
            </button>
          )}
          <Link
            href={LD_ROUTES.assessment}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white"
          >
            {t('ldAssessment')}
          </Link>
        </div>
      </div>

      {msg && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {msg}
        </p>
      )}

      {plan ? (
        <LdIepGoalTracker plan={plan} onUpdate={setPlan} />
      ) : (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white/60 p-8 text-center">
          <p className="text-sm text-slate-500">{t('ldNoIepYet')}</p>
          <button
            type="button"
            onClick={generateFromAssessment}
            className="mt-4 rounded-xl bg-amber-600 px-6 py-2 text-xs font-bold text-white"
          >
            {t('ldGenerateIep')}
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import type { ComprehensiveAssessmentReport } from '@/lib/academicAssessmentEngine';
import { useLanguage } from '@/components/LanguageProvider';
import PdfExportButton from '@/components/reports/PdfExportButton';

export default function IepReportSheet({
  report,
}: {
  report: ComprehensiveAssessmentReport;
}) {
  const { lang, t } = useLanguage();
  const domains = Object.values(report.domains);
  const plan = report.individualEducationPlan;
  const summary =
    lang === 'en' ? report.primaryDiagnosisEn : report.primaryDiagnosisAr;

  return (
    <article className="print-document space-y-5 rounded-3xl border border-white bg-white p-8 text-start text-slate-900 shadow-xl print:border-none print:bg-white print:p-0 print:shadow-none">
      <div className="sticky top-2 z-50 print:hidden">
        <PdfExportButton
          documentTitle={`تقرير_IEP_${report.studentName || 'تآلف'}`}
          label="تنزيل التقرير / بطاقة الدعم (PDF) 📥"
          className="h-14 w-full rounded-2xl bg-amber-500 text-base font-black text-slate-900 shadow-lg hover:bg-amber-400 hover:text-slate-900"
        />
      </div>
      <div>
        <p className="text-xs font-bold text-[#2E7D8E]">{t('comprehensiveReport')}</p>
        <h2 className="mt-1 text-2xl font-black text-slate-900">
          {report.studentName || t('childFallback')}
        </h2>
      </div>

      <p className="text-sm leading-7 text-slate-600">{summary}</p>
      <p className="text-xs text-slate-400">
        {t('scoreOf', {
          score: report.totalScore,
          max: report.maxTotalScore,
        })}{' '}
        · {report.overallPercentage}%
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {domains.map((d) => (
          <div
            key={d.domain}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <p className="text-sm font-bold text-slate-900">
              {lang === 'en' ? d.labelEn : d.label}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {d.score}/{d.maxScore} ·{' '}
              {lang === 'en' ? d.severityLabelEn : d.severityLabelAr}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900">{t('smartGoals')}</h3>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-slate-700">
          {plan.smartGoalsList.map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900">{t('examAccommodations')}</h3>
        <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-slate-700">
          {plan.examAccommodations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] leading-6 text-slate-400">
        {t('educationalDisclaimer')}
      </p>
    </article>
  );
}

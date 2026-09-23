'use client';

import { useLanguage } from '@/components/LanguageProvider';
import PdfExportButton from '@/components/reports/PdfExportButton';
import type { LdMinistryReport } from '@/lib/ldReporting/reportBuilder';

export default function LdMinistryReportDocument({
  report,
}: {
  report: LdMinistryReport;
}) {
  const { lang, dir, t } = useLanguage();

  return (
    <article
      className="print-document space-y-6 rounded-3xl border border-amber-100 bg-white p-8 text-start text-slate-900 shadow-xl print:border-none print:p-0 print:shadow-none"
      dir={dir}
    >
      <div className="sticky top-2 z-50 print:hidden">
        <PdfExportButton
          documentTitle={`تقرير_${report.student.name}_${report.reportType}`}
          label={t('ldDownloadReport')}
          className="h-12 w-full rounded-2xl bg-amber-600 text-sm font-bold text-white shadow-lg hover:bg-amber-700"
        />
      </div>

      <header className="border-b border-amber-100 pb-4">
        <p className="text-xs font-bold text-amber-700">
          {lang === 'en'
            ? report.regulatoryLabelEn
            : report.regulatoryLabelAr}
        </p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">
          {report.student.name}
        </h1>
        {report.student.schoolName && (
          <p className="mt-1 text-sm text-slate-500">
            {report.student.schoolName}
            {report.student.gradeLevel
              ? ` · ${report.student.gradeLevel}`
              : ''}
          </p>
        )}
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {lang === 'en' ? report.summary.en : report.summary.ar}
        </p>
        <p className="mt-1 text-[10px] text-slate-400">
          {new Date(report.generatedAt).toLocaleDateString('ar-OM')}
        </p>
      </header>

      {report.sections.map((section) => (
        <section key={section.id}>
          <h2 className="text-sm font-bold text-slate-900">
            {lang === 'en' ? section.titleEn : section.titleAr}
          </h2>
          <div className="mt-3 space-y-2">
            {section.items.map((item, idx) => (
              <div
                key={`${section.id}-${idx}`}
                className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <span className="text-xs text-slate-600">
                  {lang === 'en' ? item.labelEn : item.labelAr}
                </span>
                <span className="shrink-0 text-xs font-semibold text-slate-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <footer className="border-t border-slate-100 pt-4">
        <p className="text-[10px] leading-6 text-slate-400">
          {t('ldMoeDisclaimer')}
        </p>
      </footer>
    </article>
  );
}

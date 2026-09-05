'use client';

import type { ClinicalProgressReport } from '@/lib/clinicalReportAggregator';
import { PROMPT_HIERARCHY_LEVELS } from '@/lib/promptHierarchy';

function formatReportDate(iso: string, isAr: boolean) {
  return new Date(iso).toLocaleDateString(isAr ? 'ar-AE' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * وثيقة التقرير السريري التراكمي — A4 جاهزة للطباعة والتحميل PDF.
 */
export default function ClinicalProgressReportDocument({
  report,
  isAr,
  approved = false,
  approverRole,
}: {
  report: ClinicalProgressReport;
  isAr: boolean;
  approved?: boolean;
  approverRole?: string;
}) {
  const { meta, assessment, iepGoals, promptingSummary, sensoryStats, emotionalStability, recommendation } =
    report;

  return (
    <article
      className="clinical-progress-report-sheet print-document mx-auto max-w-[210mm] bg-white font-sans text-[#1F2A37]"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ترويسة مؤسسية */}
      <header className="border-b-2 border-[#2E7D8E] pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E7D8E]">
              {isAr ? meta.centerNameAr : meta.centerNameEn}
            </p>
            <h1 className="mt-2 text-xl font-black text-[#0b1f14] sm:text-2xl">
              {isAr
                ? 'التقرير السريري التراكمي الشامل'
                : 'Comprehensive Clinical Progress Report'}
            </h1>
            <p className="mt-1 text-[11px] text-slate-500">
              {isAr ? 'Clinical Progress Report · Print/PDF Ready' : 'Clinical Progress Report · Print/PDF Ready'}
            </p>
            {approved && (
              <p className="mt-2 inline-block rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-800">
                {isAr ? '🛡️ تقرير معتمد رسمياً' : '🛡️ Officially approved report'}
                {approverRole ? ` · ${approverRole}` : ''}
              </p>
            )}
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#2E7D8E]/30 bg-[#2E7D8E]/10 text-2xl">
            🌿
          </div>
        </div>
      </header>

      {/* بيانات تعريفية */}
      <section className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-[11px] sm:grid-cols-2">
        <InfoRow label={isAr ? 'اسم الطفل' : 'Child name'} value={meta.childName} />
        <InfoRow label={isAr ? 'العمر' : 'Age'} value={meta.ageLabel} />
        <InfoRow label={isAr ? 'ولي الأمر' : 'Parent'} value={meta.parentName} />
        <InfoRow label={isAr ? 'المشرف السريري' : 'Clinical supervisor'} value={meta.specialistName} />
        <InfoRow
          label={isAr ? 'تاريخ إصدار التقرير' : 'Report date'}
          value={formatReportDate(meta.issuedAt, isAr)}
        />
        <InfoRow label={isAr ? 'معرّف الملف' : 'File ID'} value={meta.childId} />
      </section>

      {/* ملخص التقييم وخط الأساس */}
      <SectionTitle>{isAr ? 'ملخص التقييم النمائي وخط الأساس' : 'Developmental assessment & baseline'}</SectionTitle>
      <p className="text-[11px] leading-6 text-slate-700">
        {isAr ? assessment.summaryAr : assessment.summaryEn}
      </p>
      {assessment.hasAssessment && assessment.domainBaselines.length > 0 && (
        <table className="mt-3 w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-[#2E7D8E] text-white">
              <th className="border border-[#236372] px-2 py-2 text-start font-bold">
                {isAr ? 'المجال' : 'Domain'}
              </th>
              <th className="border border-[#236372] px-2 py-2 text-center font-bold">
                {isAr ? 'متوسط خط الأساس' : 'Baseline avg'}
              </th>
            </tr>
          </thead>
          <tbody>
            {assessment.domainBaselines.map((row) => (
              <tr key={row.domain} className="even:bg-slate-50">
                <td className="border border-slate-200 px-2 py-1.5">{row.domain}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-center font-semibold">
                  {row.average} / 3
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* أهداف IEP */}
      <SectionTitle>{isAr ? 'أهداف الخطة التربوية الفردية (IEP)' : 'Individual education plan (IEP) goals'}</SectionTitle>
      {iepGoals.length === 0 ? (
        <EmptyNote isAr={isAr} textAr="لا توجد أهداف نشطة مسجّلة." textEn="No active goals recorded." />
      ) : (
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="border border-slate-700 px-2 py-2 text-start">{isAr ? 'الهدف' : 'Goal'}</th>
              <th className="border border-slate-700 px-2 py-2 text-start">{isAr ? 'المجال' : 'Domain'}</th>
              <th className="border border-slate-700 px-2 py-2 text-center">{isAr ? 'التقدّم' : 'Progress'}</th>
              <th className="border border-slate-700 px-2 py-2 text-center">{isAr ? 'الاستقلالية' : 'Independence'}</th>
              <th className="border border-slate-700 px-2 py-2 text-center">{isAr ? 'جلسات' : 'Sessions'}</th>
            </tr>
          </thead>
          <tbody>
            {iepGoals.map((goal) => (
              <tr key={goal.id} className="even:bg-slate-50">
                <td className="border border-slate-200 px-2 py-1.5 font-semibold">{goal.title}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-slate-600">{goal.domain}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-center">
                  {goal.progressPct}%
                  <span className="block text-[9px] text-slate-400">
                    {goal.baseline}→{goal.target} ({goal.current})
                  </span>
                </td>
                <td className="border border-slate-200 px-2 py-1.5 text-center">
                  {goal.avgIndependence != null ? `${goal.avgIndependence}%` : '—'}
                </td>
                <td className="border border-slate-200 px-2 py-1.5 text-center">{goal.sessionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ملخص المساعدة ABA */}
      <SectionTitle>{isAr ? 'ملخص مستويات المساعدة (ABA Prompting)' : 'ABA prompting summary'}</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatBox
          label={isAr ? 'نسبة الاستقلالية' : 'Independence rate'}
          value={`${promptingSummary.independentPct}%`}
        />
        <StatBox
          label={isAr ? 'جلسات منزلية' : 'Home sessions'}
          value={String(promptingSummary.homeSessionCount)}
        />
      </div>
      <p className="mt-2 text-[11px] leading-6 text-slate-700">
        {isAr ? promptingSummary.summaryAr : promptingSummary.summaryEn}
      </p>
      {promptingSummary.totalTrials > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PROMPT_HIERARCHY_LEVELS.map((level) => (
            <div
              key={level.level}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center"
            >
              <div className="text-lg">{level.emoji}</div>
              <div className="text-[9px] font-bold text-slate-600">
                {isAr ? level.labelAr : level.labelEn}
              </div>
              <div className="text-sm font-black text-[#0b1f14]">
                {promptingSummary.breakdown[level.level]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* الأثر الحسي والاستقرار */}
      <SectionTitle>{isAr ? 'الأثر الحسي والاستقرار الانفعالي' : 'Sensory impact & emotional stability'}</SectionTitle>
      <div className="grid gap-3 rounded-xl border border-violet-200 bg-violet-50/50 p-4 sm:grid-cols-2">
        <div>
          <h4 className="text-[11px] font-black text-violet-900">
            {isAr ? 'إحصائيات الغرف الحسية' : 'Sensory room statistics'}
          </h4>
          {sensoryStats.hasData ? (
            <ul className="mt-2 space-y-1 text-[10px] text-slate-700">
              <li>
                {isAr ? 'جلسات:' : 'Sessions:'} {sensoryStats.totalSessions}
              </li>
              <li>
                {isAr ? 'متوسط الهدوء:' : 'Avg calm:'} {sensoryStats.avgCalmIndex}%
              </li>
              <li>
                {isAr ? 'دقائق:' : 'Minutes:'} {sensoryStats.totalMinutes}
              </li>
              {sensoryStats.topRooms.map((room) => (
                <li key={room.roomId}>
                  {isAr ? room.titleAr : room.titleEn}: {room.count} ({room.avgCalm}%)
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote isAr={isAr} textAr="لا جلسات حسية مسجّلة." textEn="No sensory sessions recorded." />
          )}
        </div>
        <div>
          <h4 className="text-[11px] font-black text-violet-900">
            {isAr ? 'مؤشر الاستقرار الانفعالي' : 'Emotional stability index'}
          </h4>
          <p className="mt-2 text-[10px] leading-6 text-slate-700">
            {isAr ? emotionalStability.summaryAr : emotionalStability.summaryEn}
          </p>
        </div>
      </div>

      {/* توصيات مستقبلية */}
      <SectionTitle>{isAr ? 'التوصيات المستقبلية' : 'Future recommendations'}</SectionTitle>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <p className="flex items-center gap-2 text-sm font-black text-emerald-900">
          <span>{recommendation.emoji}</span>
          <span>{isAr ? recommendation.titleAr : recommendation.titleEn}</span>
        </p>
        <p className="mt-1 text-[11px] leading-6 text-emerald-800/90">
          {isAr ? recommendation.descriptionAr : recommendation.descriptionEn}
        </p>
        <p className="mt-1 text-[10px] text-emerald-700/70">
          {isAr ? recommendation.reasonAr : recommendation.reasonEn}
        </p>
      </div>

      {/* اعتماد */}
      <footer className="mt-10 border-t border-slate-300 pt-6">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold text-slate-500">
              {isAr ? 'توقيع الأخصائي المعالج' : 'Specialist signature'}
            </p>
            <div className="mt-8 border-b border-slate-400" />
            <p className="mt-2 text-[10px] text-slate-600">{meta.specialistName}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500">
              {isAr ? 'ختم الإشراف السريري' : 'Clinical supervision stamp'}
            </p>
            <div className="mt-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-slate-400 text-[9px] text-slate-400">
              {isAr ? 'ختم' : 'STAMP'}
            </div>
          </div>
        </div>
        <p className="mt-6 text-[9px] leading-5 text-slate-400">
          {isAr
            ? 'هذا التقرير أداة توجيهية تأهيلية وتربوية — ليس تشخيصاً طبياً ولا يغني عن التقييم السريري المتخصص.'
            : 'This report is an educational rehabilitation guide — not a medical diagnosis and not a substitute for specialist clinical evaluation.'}
        </p>
      </footer>
    </article>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-6 border-b border-slate-200 pb-1 text-[12px] font-black uppercase tracking-wide text-[#2E7D8E]">
      {children}
    </h2>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-bold text-slate-500">{label}: </span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
      <div className="text-lg font-black text-[#2E7D8E]">{value}</div>
      <div className="text-[9px] font-bold text-slate-500">{label}</div>
    </div>
  );
}

function EmptyNote({
  isAr,
  textAr,
  textEn,
}: {
  isAr: boolean;
  textAr: string;
  textEn: string;
}) {
  return (
    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-500">
      {isAr ? textAr : textEn}
    </p>
  );
}

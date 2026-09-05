'use client';

import PdfExportButton from '@/components/reports/PdfExportButton';
import { LEGAL_DISCLAIMERS } from '@/lib/legalContent';
import type { TrackingPlan } from '@/lib/progressTracker';

export interface PhysicianSummaryData {
  childName: string;
  ageMonths: number;
  birthDate: string;
  doctorName?: string;
  clinicName?: string;
  trackingPlan: TrackingPlan;
  assessmentsHistory: {
    round: string;
    date: string;
    overallNeed: number;
    communicationScore: number;
    socialScore: number;
    cognitiveScore: number;
    sensoryBehaviorScore: number;
  }[];
  redFlagsIdentified: string[];
  masteredGoalsCount: number;
  activeGoalsCount: number;
  reportDate?: string;
}

const PLAN_LABEL: Record<TrackingPlan, string> = {
  single: 'تقييم كشف منفرد',
  half_year: 'سجل متابعة نصف سنوي (تقييمان)',
  annual: 'سجل رعاية نمائي سنوي (4 تقييمات تراكمية)',
};

export default function PhysicianClinicalSummary({
  data,
}: {
  data: PhysicianSummaryData;
}) {
  const planLabel = PLAN_LABEL[data.trackingPlan];
  const reportDate =
    data.reportDate ||
    new Date().toLocaleDateString('ar-OM', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div
      id="physician-clinical-summary"
      className="physician-summary-sheet print-document mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 font-sans text-[#1F2A37] shadow-sm print:border-none print:bg-white print:p-0 print:shadow-none"
      dir="rtl"
    >
      <div className="mb-6 flex items-start justify-between border-b-2 border-[#2E7D8E] pb-4">
        <div>
          <span className="rounded-md border border-[#2E7D8E]/20 bg-[#F0FDFA] px-3 py-1 text-xs font-bold text-[#2E7D8E]">
            الملخص النمائي للإحالة • Developmental Intake Summary
          </span>
          <h1 className="mt-2 text-2xl font-bold">
            تقرير الإحالة والرصد السلوكي للطبيب
          </h1>
          <p className="text-xs text-gray-500">
            موجّه لعيادات الأطفال والنمو والسلوك كأداة رصد تربوي مساعدة
          </p>
        </div>
        <div className="text-left text-xs text-gray-500">
          <p>
            نوع المسار:{' '}
            <strong className="text-[#2E7D8E]">{planLabel}</strong>
          </p>
          <p className="mt-1">تاريخ التقرير: {reportDate}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl bg-[#FAF7F1] p-4 text-xs sm:grid-cols-3 sm:text-sm">
        <div>
          <span className="mb-1 block text-xs text-gray-500">اسم الحالة:</span>
          <strong className="text-base font-bold text-[#1F2A37]">
            {data.childName}
          </strong>
        </div>
        <div>
          <span className="mb-1 block text-xs text-gray-500">العمر الزمني:</span>
          <strong>
            {data.ageMonths} شهراً ({data.birthDate})
          </strong>
        </div>
        <div>
          <span className="mb-1 block text-xs text-gray-500">
            العيادة / الطبيب المحال إليه:
          </span>
          <strong>
            {data.doctorName || data.clinicName || 'العيادة النمائية'}
          </strong>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-red-200 bg-[#FEF2F2]/40 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#991B1B]">
          <span>🚩</span> العلامات النمائية الحرجة المرصودة (Red Flags):
        </h3>
        {data.redFlagsIdentified.length > 0 ? (
          <ul className="list-inside list-disc space-y-1 text-xs text-gray-700 sm:text-sm">
            {data.redFlagsIdentified.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-500">
            لم تُسجَّل مؤشرات سلوكية حادة غير معتادة خلال جلسات الرصد الحالية.
          </p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2E7D8E]">
          <span>📈</span> المسار التراكمي وتطور الاستجابة عبر مراحل التقييم:
        </h3>
        {data.assessmentsHistory.length === 0 ? (
          <p className="text-sm text-gray-500">لا تقييمات محفوظة بعد للمقارنة.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full overflow-hidden rounded-xl border border-gray-200 text-right text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 font-bold text-gray-600">
                <tr>
                  <th className="p-3">مرحلة التقييم</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">التواصل</th>
                  <th className="p-3">التفاعل واللعب</th>
                  <th className="p-3">المعرفي</th>
                  <th className="p-3">السلوك والحواس</th>
                  <th className="p-3">المؤشر العام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.assessmentsHistory.map((item, idx) => (
                  <tr
                    key={`${item.round}-${item.date}`}
                    className={
                      idx === data.assessmentsHistory.length - 1
                        ? 'bg-[#F0FDFA]/50 font-bold'
                        : ''
                    }
                  >
                    <td className="p-3">{item.round}</td>
                    <td className="p-3 text-gray-500">{item.date}</td>
                    <td className="p-3">%{item.communicationScore}</td>
                    <td className="p-3">%{item.socialScore}</td>
                    <td className="p-3">%{item.cognitiveScore}</td>
                    <td className="p-3">%{item.sensoryBehaviorScore}</td>
                    <td className="p-3 text-[#2E7D8E]">%{item.overallNeed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-teal-100 bg-[#F0FDFA]/40 p-4 text-center">
          <span className="mb-1 block text-xs text-gray-500">
            الأهداف النمائية المنجزة (Mastered)
          </span>
          <strong className="text-2xl text-teal-700">
            {data.masteredGoalsCount} أهداف
          </strong>
        </div>
        <div className="rounded-xl border border-amber-100 bg-[#FEF3C7]/30 p-4 text-center">
          <span className="mb-1 block text-xs text-gray-500">
            الأهداف قيد التطبيق والمتابعة
          </span>
          <strong className="text-2xl text-amber-700">
            {data.activeGoalsCount} أهداف
          </strong>
        </div>
      </div>

      <footer className="mt-8 border-t border-gray-200 pt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
          <span>منصة تآلف — منظومة التقييم والتمكين النمائي</span>
          <span>سلطنة عُمان • 2026</span>
        </div>
        <p className="text-center text-[10px] leading-relaxed text-gray-400">
          {LEGAL_DISCLAIMERS.pdfFooter} يُقدَّم هذا الملخص كأداة رصد نمائي
          وسلوكي مساعدة للطبيب المعالج لدعم الفحص الإكلينيكي، ولا يُعد بديلاً
          عن التشخيص الطبي المستقل.
        </p>
      </footer>

      <div className="mt-6 print:hidden">
        <PdfExportButton
          documentTitle={`تقرير_الإحالة_الطبيب_${data.childName}`}
          label="تنزيل التقرير / بطاقة الدعم (PDF) 📥"
          className="h-14 w-full rounded-2xl bg-amber-500 text-base font-black text-slate-900 hover:bg-amber-400 hover:text-slate-900"
        />
      </div>
    </div>
  );
}

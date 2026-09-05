'use client';

import PdfExportButton from '@/components/reports/PdfExportButton';
import { DISCLAIMER_AR } from '@/lib/content';
import { LEGAL_DISCLAIMERS } from '@/lib/legalContent';
import type { LearningScreeningResult } from '@/lib/learningScreeningEngine';

export type AcademicAccommodationsCardProps = {
  childName?: string;
  gradeLevel?: string;
  result: LearningScreeningResult;
};

export default function AcademicAccommodationsCard({
  childName = 'الطالب / الطالبة',
  gradeLevel = 'المرحلة الابتدائية',
  result,
}: AcademicAccommodationsCardProps) {

  const domainList = Object.values(result.domainResults);
  const needsSupport = domainList.filter((d) => d.level !== 'low');
  const completedAt = result.completedAt
    ? new Date(result.completedAt).toLocaleDateString('ar-OM')
    : '—';

  return (
    <div className="space-y-6 text-right font-sans text-slate-900" dir="rtl">
      <div className="sticky top-2 z-50 space-y-3 print:hidden">
        <PdfExportButton
          documentTitle={`بطاقة_التسهيلات_${childName}`}
          label="تنزيل التقرير / بطاقة الدعم (PDF) 📥"
          className="h-14 w-full rounded-2xl bg-amber-500 text-base font-black text-slate-900 shadow-lg hover:bg-amber-400 hover:text-slate-900"
        />
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-800">
            بطاقة التسهيلات والتعديلات الصفية
          </h2>
          <p className="text-xs text-slate-500">
            مستند إرشادي للمعلمين ولجان الامتحانات — ليس تشخيصاً طبياً
          </p>
        </div>
      </div>

      <div
        id="academic-accommodations-card"
        className="print-document space-y-6 rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-md print:border-none print:bg-white print:p-0 print:shadow-none sm:p-10"
      >
        <div className="flex items-start justify-between border-b-2 border-slate-200 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D8E]">
              منصة تآلف للتقييم التربوي
            </span>
            <h1 className="text-2xl font-black text-slate-900">
              بطاقة المواءمات والتسهيلات الأكاديمية
            </h1>
            <p className="text-xs text-slate-500">
              خاصة بلجنة الدعم التربوي وغرفة المصادر ومعلمي المواد
            </p>
          </div>
          <div className="space-y-1 rounded-xl border border-slate-200/70 bg-slate-50 p-3 text-left text-xs text-slate-500">
            <div>
              تاريخ الفرز:{' '}
              <strong className="text-slate-800">{completedAt}</strong>
            </div>
            <div>
              المستوى العام:{' '}
              <strong className="text-[#2E7D8E]">{result.overallRiskText}</strong>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200/60 bg-slate-50 p-4 text-xs sm:grid-cols-4">
          <div>
            <span className="block text-slate-400">اسم الطالب:</span>
            <strong className="text-sm text-slate-800">{childName}</strong>
          </div>
          <div>
            <span className="block text-slate-400">المرحلة الدراسية:</span>
            <strong className="text-sm text-slate-800">{gradeLevel}</strong>
          </div>
          <div>
            <span className="block text-slate-400">نوع الفرز:</span>
            <strong className="text-sm text-amber-700">
              أكاديمي (قراءة / كتابة / حساب / انتباه)
            </strong>
          </div>
          <div>
            <span className="block text-slate-400">المجموع الكلي:</span>
            <strong className="text-sm text-slate-800">
              {result.totalScore} من {result.maxTotalScore}
            </strong>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2E7D8E]" />
            خلاصة الاحتياجات الأكاديمية:
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {domainList.map((d) => (
              <div
                key={d.domain}
                className={`space-y-1.5 rounded-2xl border p-4 text-xs ${
                  d.level === 'high'
                    ? 'border-amber-300 bg-amber-50/60'
                    : d.level === 'moderate'
                      ? 'border-teal-200 bg-teal-50/50'
                      : 'border-slate-200 bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900">{d.label}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] ${
                      d.level === 'high'
                        ? 'bg-amber-200 text-amber-900'
                        : d.level === 'moderate'
                          ? 'bg-teal-200 text-teal-900'
                          : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {d.score} / {d.maxScore} ({d.levelText})
                  </span>
                </div>
                <p className="leading-relaxed text-slate-600">{d.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            التسهيلات الموصى بها في البيئة الصفية والاختبارات:
          </h3>
          <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/30 p-5 text-xs leading-relaxed">
            {needsSupport.length > 0 ? (
              needsSupport.map((d) => (
                <div key={d.domain} className="space-y-1.5">
                  <span className="block font-bold text-amber-900">
                    تعديلات خاصة بـ ({d.label}):
                  </span>
                  <ul className="list-inside list-disc space-y-1 pr-2 text-slate-700">
                    {d.initialRecommendations.map((rec) => (
                      <li key={rec}>{rec}</li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-slate-600">
                لا توجد توصيات لتسهيلات استثنائية؛ يُتابع البرنامج الصفي المعتاد
                مع التعزيز المستمر.
              </p>
            )}

            {result.classroomAccommodations.length > 0 && (
              <div className="space-y-1.5 border-t border-amber-200/70 pt-3">
                <span className="block font-bold text-amber-900">
                  تسهيلات صفية مجمّعة للتنفيذ السريع:
                </span>
                <ul className="list-inside list-disc space-y-1 pr-2 text-slate-700">
                  {result.classroomAccommodations.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t border-slate-200 pt-8 text-center text-xs text-slate-600">
          <div className="space-y-8">
            <span>معلم التربية الخاصة / غرفة المصادر</span>
            <div className="mx-auto w-32 border-b border-dashed border-slate-400" />
          </div>
          <div className="space-y-8">
            <span>المرشد الطلابي</span>
            <div className="mx-auto w-32 border-b border-dashed border-slate-400" />
          </div>
          <div className="space-y-8">
            <span>مدير / مديرة المدرسة</span>
            <div className="mx-auto w-32 border-b border-dashed border-slate-400" />
          </div>
        </div>

        <footer className="space-y-2 border-t border-slate-200 pt-4 text-center">
          <p className="text-[11px] leading-6 text-slate-500">{DISCLAIMER_AR}</p>
          <p className="text-[10px] leading-tight text-slate-400">
            {LEGAL_DISCLAIMERS.pdfFooter}
          </p>
        </footer>
      </div>
    </div>
  );
}

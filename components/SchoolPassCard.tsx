'use client';

import PdfExportButton from '@/components/reports/PdfExportButton';
import { DISCLAIMER_AR } from '@/lib/content';
import { LEGAL_DISCLAIMERS } from '@/lib/legalContent';
import type { SchoolPassData } from '@/lib/schoolPass';

export type { SchoolPassData };

interface SchoolPassProps {
  data: SchoolPassData;
}

export default function SchoolPassCard({ data }: SchoolPassProps) {
  return (
    <div
      id="school-pass-card"
      className="school-pass-sheet mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 font-sans shadow-lg print:max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none"
      dir="rtl"
    >
      <header className="mb-6 flex items-center justify-between border-b-2 border-[#2E7D8E] pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1F2A37]">
            بطاقة التسهيلات والدعم الصفي
          </h1>
          <p className="text-xs text-gray-500">
            دليل مختصر للبيئة المدرسية والمعلمين — منصة تآلف
          </p>
        </div>
        <div className="text-left">
          <span className="inline-block rounded-full border border-[#2E7D8E]/30 bg-[#FAF7F1] px-3 py-1 text-xs font-bold text-[#2E7D8E]">
            نسخة المعلم / الروضة
          </span>
          <p className="mt-1 text-[11px] text-gray-400">{data.date}</p>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-[#FAF7F1] p-4 text-sm">
        <div>
          <span className="block text-xs text-gray-500">اسم الطالب:</span>
          <strong className="text-base text-[#1F2A37]">{data.childName}</strong>
        </div>
        <div>
          <span className="block text-xs text-gray-500">
            المرحلة / الفئة العمرية:
          </span>
          <strong className="text-[#2E7D8E]">{data.ageBand}</strong>
        </div>
      </section>

      <div className="space-y-4 text-sm">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-[#2E7D8E]">
            <span aria-hidden>🗣️</span> أسلوب التواصل والتوجيه الفعّال:
          </h3>
          <p className="text-xs leading-relaxed text-gray-700 sm:text-sm">
            {data.communicationStyle}
          </p>
        </div>

        <div className="rounded-xl border border-red-100 bg-[#FEF2F2]/40 p-4">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-[#991B1B]">
            <span aria-hidden>⚠️</span> مثيرات يُرجى تجنبها أو تقليلها:
          </h3>
          <ul className="list-inside list-disc space-y-1 text-xs text-gray-700 sm:text-sm">
            {(data.sensoryTriggers.length
              ? data.sensoryTriggers
              : ['لا توجد ملاحظات حسية مسجّلة في هذا التقييم.']
            ).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-teal-100 bg-[#F0FDFA]/50 p-4">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-[#0D9488]">
            <span aria-hidden>🌿</span> عند شعور الطالب بالتوتر (ما يساعده على
            الاستقرار):
          </h3>
          <ul className="list-inside list-disc space-y-1 text-xs text-gray-700 sm:text-sm">
            {(data.calmingStrategies.length
              ? data.calmingStrategies
              : ['هدوء صوتي، خياران واضحان، ووقت قصير لإعادة التنظيم.']
            ).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-100 bg-[#FEF3C7]/30 p-4">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-[#B45309]">
            <span aria-hidden>💡</span> 3 استراتيجيات لتعزيز انتباه الطالب أثناء
            الشرح:
          </h3>
          <ol className="list-inside list-decimal space-y-1 text-xs text-gray-700 sm:text-sm">
            {data.academicSupportTips.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </div>

      <footer className="mt-6 border-t border-gray-200 pt-4">
        <div className="mb-3 flex items-center justify-between text-xs text-gray-600">
          <span>
            جهة الاتصال للطوارئ: <strong>{data.emergencyContact}</strong>
          </span>
          <span className="text-[11px] text-gray-400">منصة تآلف © 2026</span>
        </div>
        <p className="text-center text-[11px] leading-6 text-gray-500">
          {DISCLAIMER_AR}
        </p>
        <p className="mt-2 text-center text-[10px] leading-tight text-gray-400">
          {LEGAL_DISCLAIMERS.pdfFooter}
        </p>
      </footer>

      <div className="mt-6 print:hidden">
        <PdfExportButton
          documentTitle={`بطاقة_الدعم_${data.childName}`}
          isolateClass="printing-school-pass"
          label="تنزيل التقرير / بطاقة الدعم (PDF) 📥"
          className="h-14 w-full rounded-2xl bg-amber-500 text-base font-black text-slate-900 hover:bg-amber-400 hover:text-slate-900"
        />
      </div>
    </div>
  );
}

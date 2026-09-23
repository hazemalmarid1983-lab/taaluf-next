'use client';

import { useLanguage } from '@/components/LanguageProvider';
import ConsultantIntroTour from '@/components/consultant/ConsultantIntroTour';
import ConsultantPlatformStatus from '@/components/consultant/ConsultantPlatformStatus';
import ConsultantReviewPoints from '@/components/consultant/ConsultantReviewPoints';
import ConsultantSectionCard from '@/components/consultant/ConsultantSectionCard';
import { getConsultantSections } from '@/lib/consultantRoom/sections';

export default function ConsultantRoomDashboard() {
  const { dir } = useLanguage();
  const sections = getConsultantSections();

  return (
    <div dir={dir} className="space-y-10">
      <ConsultantIntroTour />
      <div
        data-tour-id="intro-hero"
        className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8"
      >
        <p className="text-xs font-bold text-[#2E7D8E]">غرفة المستشار العلمي</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
          الدكتور سامر
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          مساحة مخصصة لمراجعة وتطوير المنهج العلمي والتربوي لمنصة تآلف.
        </p>
        <p className="mt-4 text-xs text-slate-400">
          رئيس المجلس الاستشاري والسريري العام · نقطة الدخول الرسمية للمراجعة
          العلمية
        </p>
      </div>

      <section data-tour-id="intro-sections" className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">أقسام الغرفة</h2>
          <p className="mt-1 text-sm text-slate-500">
            المحتوى العلمي هو محور الصفحة — الأقسام الجاهزة مرتبطة بمحتوى
            موجود، والباقي placeholders واضحة.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <div
              key={section.id}
              data-tour-id={
                section.id === 'training-system' ? 'intro-journey' : undefined
              }
            >
              <ConsultantSectionCard section={section} />
            </div>
          ))}
        </div>
      </section>

      <div data-tour-id="intro-platform-status">
        <ConsultantPlatformStatus />
      </div>
      <ConsultantReviewPoints />
    </div>
  );
}

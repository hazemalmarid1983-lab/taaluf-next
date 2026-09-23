'use client';

import Link from 'next/link';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { HUB_PATH } from '@/lib/clinicalHub';

const PLACEHOLDER_SECTIONS = [
  {
    id: 'upcoming',
    titleAr: 'الاجتماعات القادمة',
    descriptionAr: 'جدولة الاجتماعات ودعوات المشاركين — قيد الإعداد.',
  },
  {
    id: 'minutes',
    titleAr: 'محاضر الجلسات',
    descriptionAr: 'توثيق مخرجات كل جلسة وقراراتها — قيد الإعداد.',
  },
  {
    id: 'notes',
    titleAr: 'ملاحظات الجلسة',
    descriptionAr: 'ملاحظات المستشار والإدارة أثناء الاجتماع — قيد الإعداد.',
  },
  {
    id: 'tasks',
    titleAr: 'مهام المتابعة',
    descriptionAr: 'مهام ناتجة عن الاجتماعات — قيد الإعداد.',
  },
] as const;

export default function ConsultantMeetingHall() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8">
        <p className="text-xs font-bold text-[#2E7D8E]">قاعة الاجتماعات</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
          مساحة الاجتماعات والملاحظات
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          واجهة أولية مهيأة للاجتماعات ومحاضر الجلسات والملاحظات. لا يوجد
          حالياً نظام فيديو أو دردشة مدمج — التعاون الحالي يتم عبر المركز
          السريري والبحثي.
        </p>
        <Link
          href={`${HUB_PATH}?focus=meeting`}
          className="mt-4 inline-flex rounded-xl bg-[#2E7D8E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#256b7a]"
        >
          الانتقال إلى غرفة الاجتماعات في Hub
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLACEHOLDER_SECTIONS.map((section) => (
          <Card
            key={section.id}
            className="border-dashed border-slate-200 bg-slate-50/30"
          >
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm font-bold text-slate-800">
                {section.titleAr}
              </CardTitle>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                قيد الإعداد
              </span>
            </div>
            <CardDescription className="mt-2 leading-relaxed">
              {section.descriptionAr}
            </CardDescription>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 bg-slate-50/50">
        <CardTitle className="text-sm font-bold text-slate-800">
          البنية المستقبلية
        </CardTitle>
        <CardDescription className="mt-2 leading-relaxed">
          هذه المساحة مصممة للتوسع لاحقاً بإضافة: جدولة اجتماعات، محاضر
          موثّقة، ملاحظات المستشار، ومهام المتابعة — دون إعادة بناء الغرفة.
        </CardDescription>
      </Card>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import type { ConsultantSection } from '@/lib/consultantRoom/types';

const STATUS_LABELS: Record<
  ConsultantSection['status'],
  { ar: string; className: string }
> = {
  ready: {
    ar: 'متاح',
    className: 'bg-emerald-100 text-emerald-800',
  },
  partial: {
    ar: 'جزئي',
    className: 'bg-amber-100 text-amber-800',
  },
  preparing: {
    ar: 'قيد الإعداد',
    className: 'bg-slate-100 text-slate-600',
  },
};

export default function ConsultantSectionCard({
  section,
}: {
  section: ConsultantSection;
}) {
  const status = STATUS_LABELS[section.status];
  const showPrimaryLink =
    section.href && section.status !== 'preparing';

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <CardTitle className="text-base font-bold text-slate-900">
          {section.titleAr}
        </CardTitle>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${status.className}`}
        >
          {status.ar}
        </span>
      </div>
      <CardDescription className="mt-2 flex-1 leading-relaxed">
        {section.descriptionAr}
      </CardDescription>
      {section.sourceNote ? (
        <p className="mt-3 text-[11px] text-slate-400">{section.sourceNote}</p>
      ) : null}
      {showPrimaryLink ? (
        <Link
          href={section.href!}
          className="mt-3 inline-flex text-xs font-semibold text-[#2E7D8E] hover:underline"
        >
          عرض المحتوى
        </Link>
      ) : null}
      {section.explore && section.explore.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {section.explore.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-[#2E7D8E]/40 hover:text-[#2E7D8E]"
            >
              {link.labelAr}
            </Link>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

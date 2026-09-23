'use client';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  getPlatformStatusItems,
  PLATFORM_STATUS_LABELS,
} from '@/lib/consultantRoom/platformStatus';

export default function ConsultantPlatformStatus() {
  const items = getPlatformStatusItems();

  const grouped = {
    implemented: items.filter((i) => i.level === 'implemented'),
    partial: items.filter((i) => i.level === 'partial'),
    in_progress: items.filter((i) => i.level === 'in_progress'),
    needs_review: items.filter((i) => i.level === 'needs_review'),
  };

  const columns = [
    { key: 'implemented' as const, title: 'مطبّق' },
    { key: 'partial' as const, title: 'مطبّق جزئياً' },
    { key: 'in_progress' as const, title: 'قيد التطوير' },
    { key: 'needs_review' as const, title: 'يحتاج مراجعة علمية' },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">حالة المنصة</h2>
        <p className="mt-1 text-sm text-slate-500">
          ملخص واقعي لما هو مطبّق في المنصة — يُحدَّث مع تطور المشروع.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => (
          <Card key={col.key} className="border-slate-200">
            <CardTitle className="text-sm font-bold text-slate-800">
              {col.title}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              {grouped[col.key].length} عنصر
            </CardDescription>
            <ul className="mt-4 space-y-3">
              {grouped[col.key].map((item) => {
                const badge = PLATFORM_STATUS_LABELS[item.level];
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800">
                        {item.labelAr}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${badge.className}`}
                      >
                        {badge.ar}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                      {item.noteAr}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
}

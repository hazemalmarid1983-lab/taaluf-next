'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { recommendSensoryRoomsForGoals } from '@/lib/sensoryHubRecommendations';
import type { TrackedGoal } from '@/lib/goalsEngine';

export default function SensoryHubRecommendationsCard({
  goals,
  isAr,
  className,
}: {
  goals: TrackedGoal[];
  isAr: boolean;
  className?: string;
}) {
  const recommendations = useMemo(
    () => recommendSensoryRoomsForGoals(goals, 2),
    [goals]
  );

  return (
    <aside
      className={`rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-fuchsia-50/70 p-5 shadow-sm ${className || ''}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none">🌈</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-[#0b1f14]">
            {isAr
              ? 'أنشطة الدعم والتنظيم الحسي الموصى بها'
              : 'Recommended sensory support activities'}
          </h3>
          <p className="mt-1 text-[11px] leading-6 text-slate-500">
            {isAr
              ? 'اقتراح تلقائي بناءً على أهداف الخطة الفردية الحالية.'
              : 'Auto-suggested from current IEP goals.'}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {recommendations.map((room) => (
          <li key={room.id}>
            <Link
              href={room.href}
              className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white/80 p-3 transition hover:border-violet-300 hover:bg-white active:scale-[0.99]"
            >
              <span className="text-3xl leading-none">{room.emoji}</span>
              <div className="min-w-0">
                <strong className="block text-xs font-black text-[#0b1f14]">
                  {isAr ? room.titleAr : room.titleEn}
                </strong>
                <span className="mt-0.5 block text-[10px] leading-5 text-violet-700/80">
                  {isAr ? room.reasonAr : room.reasonEn}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/sensory-rooms"
        className="mt-4 inline-block text-[11px] font-black text-violet-600 hover:underline"
      >
        {isAr ? 'عرض كل الغرف الحسية ←' : 'View all sensory rooms →'}
      </Link>
    </aside>
  );
}

'use client';

import { useState } from 'react';
import ImitationGame from '@/components/games/ImitationGame';
import VisualTracking from '@/components/games/VisualTracking';

type ActiveGame = 'hub' | 'imitation' | 'visual_tracking';

export default function GamesHubPage() {
  const [active, setActive] = useState<ActiveGame>('hub');

  if (active === 'imitation') {
    return (
      <section className="mx-auto max-w-3xl space-y-4">
        <button
          type="button"
          className="text-sm text-[#2D8B5A]"
          onClick={() => setActive('hub')}
        >
          ← العودة للألعاب
        </button>
        <ImitationGame />
      </section>
    );
  }

  if (active === 'visual_tracking') {
    return (
      <section className="mx-auto max-w-3xl space-y-4">
        <button
          type="button"
          className="text-sm text-[#2D8B5A]"
          onClick={() => setActive('hub')}
        >
          ← العودة للألعاب
        </button>
        <VisualTracking />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0b1f14]">ألعاب التقييم</h1>
        <p className="mt-2 text-sm text-slate-600">
          ألعاب تفاعلية قصيرة بتسجيل يدوي من الأخصائي/ولي الأمر — دون تقدير آلي
          للنظر.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <svg viewBox="0 0 64 64" className="h-14 w-14 text-[#2D8B5A]">
            <rect width="64" height="64" rx="16" fill="#F0F9F4" />
            <path
              d="M20 40c0-10 8-16 12-16s12 6 12 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <circle cx="26" cy="28" r="3" fill="currentColor" />
            <circle cx="38" cy="28" r="3" fill="currentColor" />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-[#0b1f14]">التقليد</h2>
          <p className="mt-1 text-xs font-semibold text-[#2D8B5A]">
            تواصل اجتماعي · لعب تخيلي
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            5 حركات للتقليد مع تسجيل نجاح/فشل يدوياً (C3 · C4 · C11).
          </p>
          <button
            type="button"
            onClick={() => setActive('imitation')}
            className="mt-5 rounded-xl bg-[#2D8B5A] px-4 py-2 text-sm font-semibold text-white"
          >
            العب الآن
          </button>
        </article>

        <article className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <svg viewBox="0 0 64 64" className="h-14 w-14 text-amber-500">
            <rect width="64" height="64" rx="16" fill="#FFFBEB" />
            <circle cx="32" cy="32" r="10" fill="currentColor" />
            <path
              d="M12 20h8M44 44h8M18 48l6-6M40 22l6-6"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-[#0b1f14]">
            التتبع البصري
          </h2>
          <p className="mt-1 text-xs font-semibold text-amber-700">
            تواصل بصري · انتباه
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            نقطة ذهبية عبر 5 مستويات — تسجيل يدوي للتتبع (C15 · C9).
          </p>
          <button
            type="button"
            onClick={() => setActive('visual_tracking')}
            className="mt-5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
          >
            العب الآن
          </button>
        </article>
      </div>
    </section>
  );
}

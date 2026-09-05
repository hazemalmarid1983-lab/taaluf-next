'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { SENSORY_ROOMS } from '@/lib/sensoryHub';
import { readActiveChild } from '@/lib/parentJourney';
import { useEffect, useState } from 'react';

/**
 * الصفحة الرئيسية لجناح الغرف الحسية والتنظيم الانفعالي.
 */
export default function SensoryRoomsHubPage() {
  const { lang, dir } = useLanguage();
  const isAr = lang === 'ar';
  const [childName, setChildName] = useState<string | null>(null);

  useEffect(() => {
    setChildName(readActiveChild()?.name ?? null);
  }, []);

  return (
    <div
      dir={dir}
      className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0b1f14] to-slate-900 text-white"
    >
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header className="mb-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/80">
            {isAr ? 'تآلف · جناح حسي' : 'Taaluf · Sensory wing'}
          </p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">
            {isAr
              ? 'جناح الغرف الحسية والتنظيم الانفعالي'
              : 'Sensory integration & regulation hub'}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
            {isAr
              ? 'بيئات ملء الشاشة هادئة — Canvas وWeb Audio — مع حدود آمنة للصوت والإضاءة وتسجيل مقاييس الجلسة.'
              : 'Calm full-screen environments — Canvas & Web Audio — with safe sensory caps and session metrics.'}
          </p>
          {childName ? (
            <span className="mt-3 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-cyan-200">
              {isAr ? `الطفل: ${childName}` : `Child: ${childName}`}
            </span>
          ) : null}
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SENSORY_ROOMS.map((room) => (
            <Link
              key={room.id}
              href={room.href}
              className={`group flex flex-col rounded-3xl border border-white/10 bg-gradient-to-br ${room.tone} p-6 shadow-xl transition hover:scale-[1.02] hover:border-white/25 active:scale-[0.98]`}
            >
              <span className="text-4xl leading-none">{room.emoji}</span>
              <h2 className="mt-4 text-base font-black">
                {isAr ? room.titleAr : room.titleEn}
              </h2>
              <p className="mt-2 flex-1 text-[11px] leading-6 text-slate-300/90">
                {isAr ? room.descAr : room.descEn}
              </p>
              <span className="mt-4 text-xs font-black text-cyan-300 group-hover:underline">
                {isAr ? 'دخول الغرفة ←' : 'Enter room →'}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 text-[11px] leading-6 text-slate-400">
          <strong className="block text-xs font-black text-slate-200">
            {isAr ? 'حماية حسية مدمجة' : 'Built-in sensory protection'}
          </strong>
          {isAr
            ? 'كل غرفة تُقيّد الصوت والسطوع تلقائياً. الخروج يتطلب ضغطاً مطولاً أو نقرتين من ولي الأمر/الأخصائي.'
            : 'Each room caps volume and brightness automatically. Exit requires a parent/specialist long-press or double-tap.'}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard/games"
            className="rounded-2xl border border-white/15 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"
          >
            {isAr ? '← مركز الألعاب' : '← Games hub'}
          </Link>
          <Link
            href="/sensory-room"
            className="rounded-2xl border border-white/15 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"
          >
            {isAr ? 'الغرفة الحسية الكلاسيكية' : 'Classic sensory room'}
          </Link>
        </div>
      </div>
    </div>
  );
}

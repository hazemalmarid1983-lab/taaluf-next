'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { PARENT_ROUTES } from '@/lib/parentJourney';

export default function AssessmentPathwaysPage() {
  const { t, dir } = useLanguage();
  return (
    <div
      className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-1 py-4 text-slate-900 sm:py-8"
      dir={dir}
    >
      <div className="pointer-events-none absolute -right-24 top-[10%] h-96 w-96 rounded-full bg-teal-400/20 blur-[120px]" />
      <div className="pointer-events-none absolute -left-24 bottom-[10%] h-96 w-96 rounded-full bg-amber-500/20 blur-[120px]" />

      <div className="relative z-10 w-full max-w-4xl space-y-8">
        <div className="space-y-3 text-center">
          <span className="inline-block rounded-full border border-[#2E7D8E]/20 bg-[#2E7D8E]/10 px-4 py-1.5 text-xs font-bold text-[#2E7D8E] sm:text-sm">
            {t('screenings')}
          </span>
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-4xl">
            {t('selectPathway')}
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {t('pathwayIntro')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
          <article className="group flex flex-col justify-between space-y-6 rounded-3xl border border-white/90 bg-white/80 p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-2xl transition-all duration-300 hover:border-teal-500/30 hover:shadow-[0_16px_50px_rgba(46,125,142,0.12)]">
            <div className="space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-3xl text-teal-700 transition-transform group-hover:scale-110">
                🌱
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {t('developmentalPath')}
                </h2>
                <span className="mt-1 block text-xs font-semibold text-[#2E7D8E]">
                  {t('devAxes')}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                {t('devPathBody')}
              </p>
              <div className="space-y-1.5 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-teal-600">✓</span>
                  <span>{t('devBullet1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-teal-600">✓</span>
                  <span>{t('devBullet2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-teal-600">✓</span>
                  <span>{t('devBullet3')}</span>
                </div>
              </div>
            </div>
            <Link
              href={PARENT_ROUTES.screening}
              className="block w-full rounded-2xl bg-[#2E7D8E] py-3.5 text-center text-sm font-bold text-white shadow-md transition-all hover:bg-[#256675] group-hover:shadow-teal-500/20"
            >
              {t('startScreening')}
            </Link>
          </article>

          <article className="group flex flex-col justify-between space-y-6 rounded-3xl border border-white/90 bg-white/80 p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-2xl transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_16px_50px_rgba(245,158,11,0.12)]">
            <div className="space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-3xl text-amber-700 transition-transform group-hover:scale-110">
                📚
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {t('academicPath')}
                </h2>
                <span className="mt-1 block text-xs font-semibold text-amber-700">
                  {t('acaAxes')}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                {t('acaPathBody')}
              </p>
              <div className="space-y-1.5 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-600">✓</span>
                  <span>{t('acaBullet1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-600">✓</span>
                  <span>{t('acaBullet2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-600">✓</span>
                  <span>{t('acaBullet3')}</span>
                </div>
              </div>
            </div>
            <Link
              href={PARENT_ROUTES.learningScreening}
              className="block w-full rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 py-3.5 text-center text-sm font-bold text-white shadow-md transition-all hover:from-amber-700 hover:to-amber-800 group-hover:shadow-amber-500/20"
            >
              {t('startScreening')}
            </Link>
          </article>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-black/5 p-4 text-center backdrop-blur-sm">
          <p className="text-xs text-slate-500">{t('pathwayDisclaimer')}</p>
        </div>
      </div>
    </div>
  );
}

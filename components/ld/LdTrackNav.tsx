'use client';

import Link from 'next/link';
import TaalufLogo from '@/components/branding/TaalufLogo';
import { LanguageToggleBtn, useLanguage } from '@/components/LanguageProvider';
import { LD_ROUTES } from '@/lib/parentJourney';
import { TRACK_DEFINITIONS } from '@/lib/tracks/types';

export default function LdTrackNav({ name }: { name?: string | null }) {
  const { t, dir } = useLanguage();
  const track = TRACK_DEFINITIONS.learning_disabilities;

  const links = [
    { href: LD_ROUTES.hub, label: t('ldHub') },
    { href: LD_ROUTES.screening, label: t('ldScreening') },
    { href: LD_ROUTES.assessment, label: t('ldAssessment') },
    { href: LD_ROUTES.iep, label: t('ldIep') },
    { href: LD_ROUTES.resourceRoom, label: t('ldResourceRoom') },
    { href: LD_ROUTES.reports, label: t('ldReports') },
  ];

  return (
    <header
      dir={dir}
      className={`mb-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-white/90 px-4 py-3 shadow-[0_12px_40px_rgba(245,158,11,0.08)] backdrop-blur-xl print:hidden sm:px-6 ${
        dir === 'rtl' ? 'text-right' : 'text-left'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <TaalufLogo href={LD_ROUTES.hub} size="md" showSubtitle={false} />
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-xs font-bold text-amber-800">
            {track.labelAr}
          </p>
          <p className="truncate text-[10px] text-amber-600/80">
            {track.regulatoryLabelAr}
            {name ? ` · ${name}` : ''}
          </p>
        </div>
      </div>

      <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-amber-100/60 hover:text-amber-900"
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/dashboard"
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500 transition hover:bg-white"
        >
          {t('developmentalPath')}
        </Link>
        <LanguageToggleBtn className="ms-1 shrink-0" />
        <Link
          href="/api/auth/signout"
          className="rounded-xl px-3 py-2 text-slate-400 transition hover:text-rose-600"
        >
          {t('logout')}
        </Link>
      </nav>
    </header>
  );
}

'use client';

import Link from 'next/link';
import TaalufLogo from '@/components/branding/TaalufLogo';
import { LanguageToggleBtn, useLanguage } from '@/components/LanguageProvider';
import {
  advisorClinicalNavHref,
  CONSULTANT_MEETINGS_PATH,
  CONSULTANT_REVIEW_PATH,
  CONSULTANT_ROOM_PATH,
} from '@/lib/consultantRoom/access';

export default function ConsultantTrackNav({ name }: { name?: string | null }) {
  const { t, dir } = useLanguage();

  const links: readonly {
    href: string;
    label: string;
    tourId?: 'intro-review';
  }[] = [
    { href: CONSULTANT_ROOM_PATH, label: 'الغرفة' },
    {
      href: CONSULTANT_REVIEW_PATH,
      label: 'نموذج المراجعة',
      tourId: 'intro-review',
    },
    { href: CONSULTANT_MEETINGS_PATH, label: 'قاعة الاجتماعات' },
    { href: advisorClinicalNavHref(), label: 'المركز السريري' },
  ];

  return (
    <header
      dir={dir}
      className={`mb-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-50/90 to-white/90 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl print:hidden sm:px-6 ${
        dir === 'rtl' ? 'text-right' : 'text-left'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <TaalufLogo href={CONSULTANT_ROOM_PATH} size="md" showSubtitle={false} />
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-xs font-bold text-slate-700">
            غرفة المستشار العلمي
          </p>
          <p className="truncate text-[10px] text-slate-500">
            الدكتور سامر
            {name ? ` · ${name}` : ''}
          </p>
        </div>
      </div>

      <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
        {links.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            data-tour-id={item.tourId}
            className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {item.label}
          </Link>
        ))}
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

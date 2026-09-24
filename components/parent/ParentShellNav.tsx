'use client';

import Link from 'next/link';
import TaalufLogo from '@/components/branding/TaalufLogo';
import PermissionGate from '@/components/access/PermissionGate';
import { LanguageToggleBtn, useLanguage } from '@/components/LanguageProvider';
import { CHILD_ROOM_PATH } from '@/lib/childRoom/gate';
import { PARENT_ROUTES } from '@/lib/parentJourney';
import { PRICING_PATH } from '@/lib/subscriptionTiers';

export default function ParentShellNav({
  name,
  isAdmin,
}: {
  name?: string | null;
  isAdmin?: boolean;
}) {
  const { t, dir } = useLanguage();

  const links = [
    { href: PARENT_ROUTES.home, label: t('home') },
    { href: PARENT_ROUTES.screening, label: 'الفرز السريع' },
    { href: CHILD_ROOM_PATH, label: 'غرفة الطفل' },
    { href: PRICING_PATH, label: 'الباقات والاشتراكات' },
    { href: PARENT_ROUTES.community, label: t('community') },
    { href: `${CHILD_ROOM_PATH}?book=1`, label: t('appointments') },
  ];

  return (
    <header
      dir={dir}
      className={`mb-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/90 bg-white/80 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl print:hidden sm:px-6 ${
        dir === 'rtl' ? 'text-right' : 'text-left'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <TaalufLogo href={PARENT_ROUTES.home} size="md" showSubtitle={false} />
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-xs font-semibold text-slate-500">
            {t('parentPortal')}
            {name ? ` · ${name}` : ''}
            {isAdmin ? ` · ${t('adminPanel')}` : ''}
          </p>
        </div>
      </div>

      <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
        <PermissionGate permission="access_admin_panel">
          <Link
            href="/admin"
            className="rounded-xl bg-[#2E7D8E] px-3 py-2 font-semibold text-white backdrop-blur-xl"
          >
            {t('adminPanel')}
          </Link>
        </PermissionGate>
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-white hover:text-[#2E7D8E]"
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

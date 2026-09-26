'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TaalufLogo from '@/components/branding/TaalufLogo';
import PermissionGate from '@/components/access/PermissionGate';
import { LanguageToggleBtn, useLanguage } from '@/components/LanguageProvider';
import { JOURNEY_HYDRATED_EVENT } from '@/lib/childRoom/journeyClient';
import {
  PARENT_ROUTES,
  readActiveChild,
  resolveParentNavLinks,
  type ParentNavLinkId,
} from '@/lib/parentJourney';

export default function ParentShellNav({
  name,
  isAdmin,
}: {
  name?: string | null;
  isAdmin?: boolean;
}) {
  const { t, dir } = useLanguage();
  const [hasRegisteredChild, setHasRegisteredChild] = useState(false);

  useEffect(() => {
    const refresh = () => setHasRegisteredChild(Boolean(readActiveChild()?.id));
    refresh();
    window.addEventListener(JOURNEY_HYDRATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(JOURNEY_HYDRATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const labels: Record<ParentNavLinkId, string> = {
    home: t('home'),
    screening: 'الفرز السريع',
    childRoom: 'غرفة الطفل',
    pricing: 'الباقات والاشتراكات',
    community: t('community'),
    appointments: t('appointments'),
    progressReports: 'التقارير والمتابعة',
    teacherMessaging: 'التواصل مع المعلم',
  };

  const links = resolveParentNavLinks(hasRegisteredChild).map((link) => ({
    href: link.href,
    label: labels[link.id],
  }));

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

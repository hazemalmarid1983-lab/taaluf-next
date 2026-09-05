'use client';

import Link from 'next/link';
import TaalufLogo from '@/components/branding/TaalufLogo';
import { LanguageToggleBtn, useLanguage } from '@/components/LanguageProvider';
import PermissionGate from '@/components/access/PermissionGate';
import { usePermissionsOptional } from '@/components/access/PermissionsProvider';

export default function SpecialistShellNav({
  name,
  isAdmin,
}: {
  name?: string | null;
  isAdmin?: boolean;
}) {
  const { t, dir } = useLanguage();
  const perms = usePermissionsOptional();
  const showAdmin =
    perms?.has('access_admin_panel') ?? isAdmin ?? false;

  return (
    <header
      dir={dir}
      className={`mb-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/90 bg-white/80 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl print:hidden sm:px-6 ${
        dir === 'rtl' ? 'text-right' : 'text-left'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <TaalufLogo href="/dashboard" size="md" showSubtitle={false} />
        <p className="hidden truncate text-xs font-semibold text-slate-500 sm:block">
          {t('specialistPortal')}
          {name ? ` · ${name}` : ''}
          {showAdmin ? ` · ${t('adminPanel')}` : ''}
        </p>
      </div>

      <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
        <PermissionGate permission="access_clinical_hub">
          <Link
            href="/hub"
            className="rounded-xl bg-[#0b1f14] px-3 py-2 font-semibold text-white"
          >
            {t('clinicalHub')}
          </Link>
        </PermissionGate>
        <PermissionGate permission="access_admin_panel">
          <Link
            href="/admin"
            className="rounded-xl bg-[#2E7D8E] px-3 py-2 font-semibold text-white backdrop-blur-xl"
          >
            {t('adminPanel')}
          </Link>
        </PermissionGate>
        <PermissionGate
          permissions={['manage_all_cases', 'manage_assigned_cases']}
          match="any"
        >
          <Link
            href="/dashboard"
            className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-white hover:text-[#2E7D8E]"
          >
            {t('caseload')}
          </Link>
          <Link
            href="/dashboard/students/new"
            className="rounded-xl bg-[#2E7D8E] px-4 py-2 font-semibold text-white backdrop-blur-xl transition hover:bg-[#256675]"
          >
            {t('newCase')}
          </Link>
        </PermissionGate>
        <Link
          href="/dashboard/tools-bank"
          className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-white hover:text-[#2E7D8E]"
        >
          {t('toolsBank')}
        </Link>
        <Link
          href="/dashboard/messages"
          className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-white hover:text-[#2E7D8E]"
        >
          {t('messages')}
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

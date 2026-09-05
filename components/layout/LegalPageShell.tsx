'use client';

import TaalufLogo from '@/components/branding/TaalufLogo';
import { LanguageToggleBtn, useLanguage } from '@/components/LanguageProvider';
import Link from 'next/link';

export default function LegalPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { t, dir } = useLanguage();
  return (
    <main className="min-h-screen bg-[#FAF7F1] px-4 py-10" dir={dir}>
      <article className="mx-auto max-w-3xl rounded-3xl border border-[#2E7D8E]/20 bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <TaalufLogo href="/" size="sm" />
          <LanguageToggleBtn />
        </div>
        <Link href="/" className="text-sm font-semibold text-[#2E7D8E]">
          {t('backToTaaluf')}
        </Link>
        <h1 className="font-heading mt-4 text-3xl font-bold text-[#1F2A37]">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-[#6B7280]">{subtitle}</p> : null}
        <div className="mt-8 space-y-8">{children}</div>
      </article>
    </main>
  );
}

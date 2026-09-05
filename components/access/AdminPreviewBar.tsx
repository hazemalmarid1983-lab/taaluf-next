'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

export default function AdminPreviewBar({ portalLabel }: { portalLabel?: string }) {
  const { t, dir } = useLanguage();
  return (
    <div
      dir={dir}
      className={`sticky top-0 z-50 border-b border-amber-200 bg-amber-50/90 px-4 py-2.5 text-sm text-amber-950 shadow-sm backdrop-blur-xl print:hidden ${
        dir === 'rtl' ? 'text-right' : 'text-left'
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p>{t('adminPreview', { portal: portalLabel || t('specialistPortal') })}</p>
        <Link
          href="/admin"
          className="rounded-xl bg-[#2E7D8E] px-4 py-1.5 font-semibold text-white backdrop-blur-xl hover:bg-[#256675]"
        >
          {t('backToAdmin')}
        </Link>
      </div>
    </div>
  );
}

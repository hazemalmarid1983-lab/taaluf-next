'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

export default function LegalBanner() {
  const { t, dir } = useLanguage();
  return (
    <div
      role="note"
      data-taaluf-legal-banner
      dir={dir}
      className="border-b border-[#E5B86E]/50 bg-[#FAF7F1] px-4 py-2 text-center text-xs leading-6 text-[#1F2A37] print:hidden"
    >
      {t('disclaimerShort')}{' '}
      <Link href="/legal" className="font-semibold text-[#2E7D8E] underline">
        {t('legalHub')}
      </Link>
    </div>
  );
}

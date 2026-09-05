'use client';

import TaalufLogo from '@/components/branding/TaalufLogo';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { LEGAL_ISSUED_AT, LEGAL_VERSION } from '@/lib/legalContent';
import type { TranslationKey } from '@/lib/i18n/translations';

const LINKS: { href: string; label: TranslationKey }[] = [
  { href: '/legal', label: 'legalHub' },
  { href: '/terms', label: 'terms' },
  { href: '/privacy', label: 'privacy' },
  { href: '/scientific-basis', label: 'scientificBasis' },
  { href: '/consent', label: 'consentPage' },
  { href: '/faq', label: 'faqPage' },
];

export default function SiteFooter() {
  const { t, dir } = useLanguage();
  return (
    <footer className="border-t border-[#1F2A37]/10 bg-[#1F2A37] px-4 py-8 text-[#FAF7F1] print:hidden" dir={dir}>
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <TaalufLogo href="/" size="sm" tone="dark" showSubtitle={false} />
          <p className="mt-1 text-xs leading-6 text-white/70">
            {t('countryOman')} · {t('versionLabel', { version: LEGAL_VERSION })} · {LEGAL_ISSUED_AT}
            <br />
            {t('jurisdiction')}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-[#E5B86E] hover:underline">
              {t(l.label)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

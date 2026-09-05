'use client';

import LegalPageShell from '@/components/layout/LegalPageShell';
import { useLanguage } from '@/components/LanguageProvider';
import { legalSections } from '@/lib/i18n/legalI18n';
import { LEGAL_ISSUED_AT, LEGAL_VERSION } from '@/lib/legalContent';
import type { TranslationKey } from '@/lib/i18n/translations';

type DocKind = 'faq' | 'terms' | 'privacy' | 'science';

const META: Record<
  DocKind,
  { title: TranslationKey; subtitle?: (t: (k: TranslationKey, v?: Record<string, string | number>) => string) => string }
> = {
  faq: { title: 'faqPage' },
  terms: {
    title: 'terms',
    subtitle: (t) =>
      `${t('countryOman')} · ${LEGAL_ISSUED_AT} · ${t('jurisdiction')} · ${t('versionLabel', { version: LEGAL_VERSION })}`,
  },
  privacy: {
    title: 'privacy',
    subtitle: (t) => `${t('countryOman')} · ${LEGAL_ISSUED_AT}`,
  },
  science: {
    title: 'scientificBasis',
    subtitle: () => 'DSM-5 · ICD-11 · Taaluf 40',
  },
};

export default function LegalDocPage({ kind }: { kind: DocKind }) {
  const { lang, t } = useLanguage();
  const sections = legalSections(lang);
  const meta = META[kind];
  const items =
    kind === 'faq'
      ? sections.faq.map((item) => ({ heading: item.q, body: item.a }))
      : kind === 'terms'
        ? sections.terms
        : kind === 'privacy'
          ? sections.privacy
          : sections.science;

  return (
    <LegalPageShell title={t(meta.title)} subtitle={meta.subtitle?.(t)}>
      {items.map((section) => (
        <section key={section.heading}>
          <h2 className="font-heading text-xl font-bold text-[#1F2A37]">{section.heading}</h2>
          <p className="mt-3 text-sm leading-8 text-[#6B7280]">{section.body}</p>
        </section>
      ))}
    </LegalPageShell>
  );
}

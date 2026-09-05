'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { legalSections } from '@/lib/i18n/legalI18n';
import {
  AI_OUTPUT_PREFIX_AR,
  ASSESSMENT_CONSENT_AR,
  LEGAL_HUB_VERSION,
  LEGAL_ISSUED_AT,
  LEGAL_VERSION,
} from '@/lib/legalContent';
import type { TranslationKey } from '@/lib/i18n/translations';

const AI_PREFIX_EN =
  'Notice: this text is AI-generated for educational purposes only and is not a medical diagnosis. Content is guidance and subject to educational review.';

const ASSESSMENT_EN =
  'I agree to an educational assessment for my child. I understand it may include questionnaires, educational criteria, and interactive games, and that the report is an educational support tool, not a medical diagnosis.';

const DOC_LINKS: { href: string; label: TranslationKey }[] = [
  { href: '/terms', label: 'terms' },
  { href: '/privacy', label: 'privacy' },
  { href: '/scientific-basis', label: 'scientificBasis' },
  { href: '/consent', label: 'consentPage' },
];

export default function LegalHubPage() {
  const { lang, t, dir } = useLanguage();
  const sections = legalSections(lang);

  return (
    <div className="min-h-screen bg-[#FAF7F1] text-[#1F2A37]" dir={dir}>
      <header className="bg-[#2E7D8E] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold tracking-wide text-white/80">{t('legalEyebrow')}</p>
          <h1 className="font-heading mt-3 text-3xl font-bold sm:text-4xl">{t('legalTitle')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-white/90">{t('legalLead')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white/15 px-3 py-1">
              {t('hubDoc', { version: LEGAL_HUB_VERSION })}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1">
              {t('legalVersion', { version: LEGAL_VERSION })}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1">{LEGAL_ISSUED_AT}</span>
            <span className="rounded-full bg-white/15 px-3 py-1">{t('countryOman')}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <section className="rounded-2xl border-2 border-[#E5B86E] bg-[#FBF6EA] p-6 text-[#1F2A37]">
          <h2 className="font-heading text-lg font-bold">{t('legalNoticeTitle')}</h2>
          <p className="mt-2 text-sm leading-8">
            {t('disclaimerShort')} {t('legalNoticeBody')}
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-[#2E7D8E]/15 bg-white p-8">
          <h2 className="font-heading border-b border-[#2E7D8E]/10 pb-3 text-2xl font-bold text-[#2E7D8E]">
            {t('legalSec1')}
          </h2>
          <p className="text-justify text-sm leading-8 text-[#6B7280]">
            <strong className="text-[#1F2A37]">{t('brandName')} (Taaluf)</strong>{' '}
            {lang === 'en'
              ? 'is an online educational support assessment platform operated from the Sultanate of Oman, for children aged 3 to 12 in development, autism spectrum, and learning support. It combines described educational assessment, parent notes, and interactive behavioral games, with guidance AI that is not diagnostic.'
              : 'منصة تقييم تربوي مساعدة عبر الإنترنت، بلد تشغيلها سلطنة عمان، موجّهة للأطفال من عمر 3 إلى 12 سنة في مجالات النمو واضطرابات طيف التوحد وصعوبات التعلم. تجمع المنصة بين التقييم التربوي الموصوف، ملاحظات أولياء الأمور، والألعاب السلوكية التفاعلية لصورة تربوية أدق، بدعم من ذكاء اصطناعي توجيهي وليس تشخيصياً.'}
          </p>
          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            <div className="rounded-xl border-r-4 border-[#2E7D8E] bg-[#F8FAFC] p-4">
              <h3 className="font-bold text-[#1F2A37]">{t('legalProvides')}</h3>
              <ul className="mt-2 list-disc space-y-1 pr-5 text-sm leading-7 text-[#6B7280]">
                {sections.provides.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border-r-4 border-[#C45C7A] bg-[#FDF6F4] p-4">
              <h3 className="font-bold text-[#7A2E3A]">{t('legalDoesNot')}</h3>
              <ul className="mt-2 list-disc space-y-1 pr-5 text-sm leading-7 text-[#7A2E3A]/90">
                {sections.doesNot.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-sm leading-8 text-[#6B7280]">
            {t('legalGoverning', {
              country: t('countryOman'),
              jurisdiction: t('jurisdiction'),
            })}
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-[#2E7D8E]/15 bg-white p-8">
          <h2 className="font-heading border-b border-[#2E7D8E]/10 pb-3 text-2xl font-bold text-[#2E7D8E]">
            {t('legalSec2')}
          </h2>
          {sections.science.map((section) => (
            <div key={section.heading}>
              <h3 className="font-heading text-base font-bold text-[#1F2A37]">{section.heading}</h3>
              <p className="mt-1 text-sm leading-8 text-[#6B7280]">{section.body}</p>
            </div>
          ))}
          <div className="rounded-xl border border-[#2E7D8E]/15 bg-[#F8FAFC] p-5">
            <h3 className="font-bold text-[#2E7D8E]">{t('legalOriginalityTitle')}</h3>
            <p className="mt-2 text-sm leading-8 text-[#6B7280]">{sections.originality}</p>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-[#2E7D8E]/15 bg-white p-8">
          <h2 className="font-heading border-b border-[#2E7D8E]/10 pb-3 text-2xl font-bold text-[#2E7D8E]">
            {t('legalSec3')}
          </h2>
          <p className="text-sm leading-8 text-[#6B7280]">
            {t('legalPrivacyLead', { country: t('countryOman') })}
          </p>
          <ul className="list-disc space-y-2 pr-5 text-sm leading-7 text-[#6B7280]">
            <li>
              <strong className="text-[#1F2A37]">{t('fourConsents')}</strong>
              {t('termsCheckboxTitle')}
            </li>
            <li>
              <strong className="text-[#1F2A37]">{t('noBiometric')}</strong>
              {t('noBiometricBody')}
            </li>
          </ul>
          {sections.privacy.map((section) => (
            <div key={section.heading}>
              <h3 className="font-heading text-base font-bold text-[#1F2A37]">{section.heading}</h3>
              <p className="mt-1 text-sm leading-8 text-[#6B7280]">{section.body}</p>
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-2xl border border-[#2E7D8E]/15 bg-white p-8">
          <h2 className="font-heading border-b border-[#2E7D8E]/10 pb-3 text-2xl font-bold text-[#2E7D8E]">
            {t('legalSec4')}
          </h2>
          <p className="text-sm leading-8 text-[#6B7280]">{t('legalAiLead')}</p>
          <p className="rounded-xl bg-[#F8FAFC] p-4 text-sm leading-8 text-[#6B7280]">
            {lang === 'en' ? AI_PREFIX_EN : AI_OUTPUT_PREFIX_AR}
          </p>
          <p className="text-sm leading-8 text-[#6B7280]">
            {lang === 'en' ? ASSESSMENT_EN : ASSESSMENT_CONSENT_AR.assessment}
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-[#2E7D8E]/15 bg-white p-8">
          <h2 className="font-heading border-b border-[#2E7D8E]/10 pb-3 text-2xl font-bold text-[#2E7D8E]">
            {t('legalSec5')}
          </h2>
          <ol className="list-decimal space-y-2 pr-5 text-sm leading-7 text-[#6B7280]">
            {sections.disclaimerLocs.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <nav className="grid gap-3 sm:grid-cols-2">
          {DOC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-[#2E7D8E]/20 bg-white px-5 py-4 text-sm font-semibold text-[#2E7D8E] hover:border-[#2E7D8E]"
            >
              {t(link.label)}
            </Link>
          ))}
        </nav>

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="inline-flex items-center bg-[#2E7D8E] px-8 py-3 text-sm font-bold text-white hover:bg-[#256675]"
          >
            {t('backHome')}
          </Link>
        </div>
      </main>
    </div>
  );
}

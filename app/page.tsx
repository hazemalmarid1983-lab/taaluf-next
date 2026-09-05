'use client';

import { useState } from 'react';
import Link from 'next/link';
import PricingCatalog from '@/components/access/PricingCatalog';
import SubscriberGate from '@/components/access/SubscriberGate';
import { Button } from '@/components/ui/button';
import TaalufLogo from '@/components/branding/TaalufLogo';
import { LanguageToggleBtn, useLanguage } from '@/components/LanguageProvider';
import { BRAND } from '@/lib/content';
import type { TranslationKey } from '@/lib/i18n/translations';

const TRUST: TranslationKey[] = ['trust1', 'trust2', 'trust3', 'trust4'];
const FEATURES: TranslationKey[] = [
  'feat1',
  'feat2',
  'feat3',
  'feat4',
  'feat5',
  'feat6',
];
const STEPS: { n: string; title: TranslationKey; body: TranslationKey }[] = [
  { n: '1', title: 'step1Title', body: 'step1Body' },
  { n: '2', title: 'step2Title', body: 'step2Body' },
  { n: '3', title: 'step3Title', body: 'step3Body' },
  { n: '4', title: 'step4Title', body: 'step4Body' },
];
const FAQ: { q: TranslationKey; a: TranslationKey }[] = [
  { q: 'homeFaq1q', a: 'homeFaq1a' },
  { q: 'homeFaq2q', a: 'homeFaq2a' },
  { q: 'homeFaq3q', a: 'homeFaq3a' },
  { q: 'homeFaq4q', a: 'homeFaq4a' },
  { q: 'homeFaq5q', a: 'homeFaq5a' },
  { q: 'homeFaq6q', a: 'homeFaq6a' },
];

export default function HomePage() {
  const { t, dir } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="overflow-x-hidden bg-[#f7fbf8]" dir={dir}>
      <SubscriberGate />

      <section className="relative min-h-[100svh] overflow-hidden bg-[#0b1f14] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,139,90,0.35),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(240,249,244,0.12),transparent_40%)]" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-6 py-8 sm:px-8">
          <header className="flex items-center justify-between gap-4">
            <TaalufLogo href="/" size="md" tone="dark" showSubtitle={false} />
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <a href="#how" className="rounded-xl px-3 py-2 text-emerald-100/80 hover:text-white">
                {t('navHow')}
              </a>
              <a href="#pricing" className="rounded-xl px-3 py-2 text-emerald-100/80 hover:text-white">
                {t('navPricing')}
              </a>
              <Link href="/scientific-basis" className="rounded-xl px-3 py-2 text-emerald-100/80 hover:text-white">
                {t('navScience')}
              </Link>
              <Link href="/login?portal=specialist" className="rounded-xl px-3 py-2 text-emerald-100/80 hover:text-white">
                {t('navSpecialists')}
              </Link>
              <LanguageToggleBtn className="border-white/20 bg-white/10 text-white hover:bg-white/20" />
              <Link
                href="/login?portal=parent"
                className="rounded-xl bg-white px-4 py-2 font-semibold text-[#1f6b44]"
              >
                {t('navLogin')}
              </Link>
            </nav>
          </header>

          <div className="flex flex-1 flex-col justify-center py-16">
            <div className="mb-6">
              <TaalufLogo href="/" size="lg" tone="dark" clickable={false} />
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              {t('heroHeadline')}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50/90 sm:text-xl sm:leading-9">
              {t('heroSub')}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="min-h-11 bg-[#2E7D8E] px-6 text-white backdrop-blur-xl hover:bg-[#256675]"
              >
                <Link href="/login?portal=parent">{t('ctaStartFree')}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-11 border-white/40 bg-transparent px-6 text-white hover:bg-white/10"
              >
                <a href="#how">{t('navHow')}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-emerald-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {TRUST.map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-[#2D8B5A]">
                ✓
              </span>
              {t(item)}
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
        <h2 className="text-3xl font-bold text-[#0b1f14]">{t('navHow')}</h2>
        <p className="mt-3 max-w-xl text-base leading-8 text-slate-600">{t('howLead')}</p>
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-3xl border border-emerald-100 bg-white p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2D8B5A] text-lg font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{t(s.title)}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{t(s.body)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-emerald-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
          <h2 className="text-3xl font-bold text-[#0b1f14]">{t('whyTitle')}</h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f} className="rounded-3xl border border-emerald-100 bg-[#f7fbf8] p-6">
                <svg viewBox="0 0 40 40" className="h-10 w-10 text-[#2D8B5A]">
                  <rect width="40" height="40" rx="12" fill="currentColor" opacity="0.12" />
                  <path
                    d="M12 21l5 5 11-12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-bold text-[#0b1f14]">{t(f)}</h3>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
        <PricingCatalog />
      </section>

      <section className="border-t border-emerald-100 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:px-8">
          <h2 className="text-3xl font-bold text-[#0b1f14]">{t('faqTitle')}</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className="rounded-2xl border border-emerald-100 bg-[#f7fbf8]">
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center justify-between gap-3 px-5 py-4 text-start text-sm font-bold text-[#0b1f14]"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                  >
                    {t(item.q)}
                    <span className="text-[#2D8B5A]">{open ? '−' : '+'}</span>
                  </button>
                  {open ? (
                    <p className="px-5 pb-4 text-sm leading-7 text-slate-600">{t(item.a)}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="bg-[#0b1f14] px-6 py-14 text-emerald-100/75 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_1fr_0.8fr]">
          <div>
            <TaalufLogo href="/" size="lg" tone="dark" clickable={false} />
            <p className="mt-3 max-w-md text-sm leading-7">{t('footerBlurb')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <a href="#how">{t('navHow')}</a>
            <a href="#pricing">{t('navPricing')}</a>
            <Link href="/login?portal=specialist">{t('navSpecialists')}</Link>
            <Link href="/legal">{t('legalHub')}</Link>
            <Link href="/scientific-basis">{t('scientificBasis')}</Link>
            <Link href="/terms">{t('terms')}</Link>
            <Link href="/privacy">{t('privacy')}</Link>
            <Link href="/faq">{t('faqPage')}</Link>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{t('footerContact')}</p>
            <div className="mt-3 flex gap-3">
              {['X', 'in', 'web'].map((s) => (
                <span
                  key={s}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-xs"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-xs leading-6">
          <p>{t('footerDisclaimer')}</p>
          <p className="mt-2">
            {t('footerCopyright', { year: new Date().getFullYear(), version: BRAND.version })}
          </p>
        </div>
      </footer>
    </main>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { localizePlanName, PERIOD_KEY } from '@/lib/i18n/pricingI18n';
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  TAALUF_PRICING,
  getPrice,
} from '@/lib/pricing';

const paymentsOff =
  process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === 'true' ||
  process.env.NEXT_PUBLIC_TAALUF_PILOT_MODE === 'true';

export default function ParentPricingCards() {
  const { lang, t } = useLanguage();
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  const priced = useMemo(
    () =>
      TAALUF_PRICING.parents.map((plan) => ({
        plan,
        price: getPrice(plan.id, currency),
      })),
    [currency]
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0b1f14]">{t('parentPlans')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('parentPlansLead')}</p>
        </div>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#0b1f14]"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {paymentsOff && (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t('pilotOpen')}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {priced.map(({ plan, price }) => (
          <article
            key={plan.id}
            className={`relative flex h-full flex-col rounded-2xl border bg-white p-6 ${
              plan.recommended
                ? 'border-[#2D8B5A]/40 shadow-sm'
                : 'border-slate-100'
            }`}
          >
            {plan.recommended ? (
              <span className="absolute -top-2 left-4 rounded-full bg-[#2D8B5A] px-3 py-1 text-[11px] font-bold text-white">
                {t('mostComplete')}
              </span>
            ) : null}
            <p className="text-xs font-bold text-[#2D8B5A]">{t(PERIOD_KEY[plan.period])}</p>
            <h3 className="mt-1 text-xl font-bold text-[#0b1f14]">
              {localizePlanName(plan.name, lang)}
            </h3>
            <p className="mt-2 text-3xl font-bold text-[#2D8B5A]">
              {paymentsOff ? t('freeTrial') : `${price} ${currency}`}
            </p>
            <ul className="mt-4 flex-1 space-y-1 text-sm text-slate-600">
              {plan.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <Link
              href="/login?portal=parent"
              className="mt-5 inline-block rounded-xl bg-[#2D8B5A] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#247a4d]"
            >
              {t('startParentPortal')}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

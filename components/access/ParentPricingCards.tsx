'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PRICING_TIERS,
  SUPPORTED_CURRENCIES,
  getPrice,
} from '@/lib/pricing';

const CARDS = [
  { tier: PRICING_TIERS.free, href: '/dashboard/screening', cta: 'ابدأ مجاناً' },
  {
    tier: PRICING_TIERS.assessment,
    href: '/parent/pay-assessment',
    cta: 'ادفع وابدأ',
  },
  {
    tier: PRICING_TIERS.monitoring,
    href: '/parent/pay-assessment',
    cta: 'اشترك شهرياً',
  },
] as const;

export default function ParentPricingCards() {
  const [currency, setCurrency] = useState('SAR');

  const priced = useMemo(
    () =>
      CARDS.map((c) => ({
        ...c,
        price: getPrice(c.tier.id, currency),
      })),
    [currency]
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#0b1f14]">باقات تآلف</h2>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {priced.map(({ tier, href, cta, price }) => (
          <article
            key={tier.id}
            className={
              tier.id === 'assessment'
                ? 'rounded-3xl bg-[#2D8B5A] p-6 text-white'
                : 'rounded-3xl border border-emerald-100 bg-white p-6'
            }
          >
            <h3
              className={
                tier.id === 'assessment'
                  ? 'text-xl font-bold'
                  : 'text-xl font-bold text-[#0b1f14]'
              }
            >
              {tier.name_ar}
            </h3>
            <p
              className={
                tier.id === 'assessment'
                  ? 'mt-2 text-3xl font-bold'
                  : 'mt-2 text-3xl font-bold text-[#2D8B5A]'
              }
            >
              {price === 0 ? 'مجاني' : `${price} ${currency}`}
              {tier.id === 'monitoring' && price > 0 ? (
                <span className="text-sm font-normal opacity-80"> /شهر</span>
              ) : null}
            </p>
            <ul
              className={
                tier.id === 'assessment'
                  ? 'mt-4 space-y-1 text-sm text-emerald-50'
                  : 'mt-4 space-y-1 text-sm text-slate-600'
              }
            >
              {tier.features_ar.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <Link
              href={href}
              className={
                tier.id === 'assessment'
                  ? 'mt-5 inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#2D8B5A]'
                  : 'mt-5 inline-block rounded-xl bg-[#2D8B5A] px-4 py-2 text-sm font-semibold text-white'
              }
            >
              {cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

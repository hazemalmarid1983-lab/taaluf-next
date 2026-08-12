'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PRICING_TIERS,
  SUPPORTED_CURRENCIES,
  getPrice,
} from '@/lib/pricing';

const paymentsOff =
  process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === 'true' ||
  process.env.NEXT_PUBLIC_TAALUF_PILOT_MODE === 'true';

const CARDS = [
  {
    tier: PRICING_TIERS.free,
    href: '/dashboard/screening',
    cta: 'ابدأ مجاناً',
    popular: false,
  },
  {
    tier: PRICING_TIERS.assessment,
    href: paymentsOff
      ? '/dashboard/parent-assessment'
      : '/parent/pay-assessment',
    cta: paymentsOff ? 'ابدأ التقييم' : 'ادفع وابدأ',
    popular: true,
  },
  {
    tier: PRICING_TIERS.monitoring,
    href: paymentsOff ? '/dashboard/goals' : '/parent/pay-assessment',
    cta: paymentsOff ? 'افتح المتابعة' : 'اشترك شهرياً',
    popular: false,
  },
] as const;

export default function ParentPricingCards() {
  const [currency, setCurrency] = useState('USD');

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
          الوضع التجريبي: كل الباقات مفتوحة بدون دفع.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {priced.map(({ tier, href, cta, price, popular }) => (
          <article
            key={tier.id}
            className="relative flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            {popular ? (
              <span className="absolute -top-2 left-4 rounded-full bg-[#2D8B5A] px-3 py-1 text-[11px] font-bold text-white">
                الأكثر شيوعاً
              </span>
            ) : null}
            <h3 className="text-xl font-bold text-[#0b1f14]">{tier.name_ar}</h3>
            <p className="mt-2 text-3xl font-bold text-[#2D8B5A]">
              {paymentsOff || price === 0
                ? 'مجاناً للتجربة'
                : `${price} ${currency}`}
              {!paymentsOff && tier.id === 'monitoring' && price > 0 ? (
                <span className="text-sm font-normal text-slate-400"> /شهر</span>
              ) : null}
            </p>
            <ul className="mt-4 flex-1 space-y-1 text-sm text-slate-600">
              {tier.features_ar.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <Link
              href={href}
              className="mt-5 inline-block rounded-xl bg-[#2D8B5A] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#247a4d]"
            >
              {cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

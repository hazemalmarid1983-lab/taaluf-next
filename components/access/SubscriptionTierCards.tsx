'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { publishChildJourney } from '@/lib/childRoom/journeyClient';
import { CHILD_ROOM_PATH } from '@/lib/childRoom/gate';
import { PARENT_ROUTES, readActiveChild } from '@/lib/parentJourney';
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '@/lib/pricing';
import {
  SUBSCRIPTION_TIERS,
  saveSelectedTier,
  subscriptionPrice,
  type SubscriptionTierId,
} from '@/lib/subscriptionTiers';

const paymentsOff =
  process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === 'true' ||
  process.env.NEXT_PUBLIC_TAALUF_PILOT_MODE === 'true';

export default function SubscriptionTierCards({
  fromScreening = false,
}: {
  fromScreening?: boolean;
}) {
  const router = useRouter();
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const priced = useMemo(
    () =>
      SUBSCRIPTION_TIERS.map((tier) => ({
        tier,
        price: subscriptionPrice(tier.id, currency),
      })),
    [currency]
  );

  const choose = (id: SubscriptionTierId) => {
    saveSelectedTier(id);
    const child = readActiveChild();
    if (child?.id && id !== 'free_screening') {
      void publishChildJourney({
        childId: child.id,
        childName: child.name,
        planId: id,
      });
    }
    if (id === 'free_screening') {
      router.push(PARENT_ROUTES.community);
      return;
    }
    router.push(child?.id ? CHILD_ROOM_PATH : PARENT_ROUTES.register);
  };

  return (
    <section className="mx-auto max-w-5xl space-y-5 text-right" dir="rtl">
      <header className="rounded-3xl border border-slate-200 bg-white px-6 py-7">
        <p className="text-sm font-semibold text-[#2D8B5A]">باقات تآلف</p>
        <h1 className="mt-2 text-2xl font-bold text-[#0b1f14]">اختيار مسار الطفل</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          الفرز المجاني يعرض مؤشر الجاهزية والتقرير الأولي. غرفة الطفل تُفتح بعد
          التسجيل والتقييمات الأربعة. حجز المختص السريري ضمن الباقة المتقدمة.
        </p>
        {fromScreening ? (
          <p className="mt-3 text-sm font-semibold text-[#2E7D8E]">
            اكتمل الفرز المجاني. التقرير الأولي محفوظ.{' '}
            <Link href={PARENT_ROUTES.screening} className="underline">
              عرض النتيجة
            </Link>
          </p>
        ) : null}
      </header>

      <div className="flex justify-end">
        <select
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          aria-label="العملة"
        >
          {SUPPORTED_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {priced.map(({ tier, price }) => (
          <article
            key={tier.id}
            className={`flex flex-col rounded-3xl border bg-white p-6 ${
              tier.emphasized ? 'border-[#2E7D8E] shadow-sm' : 'border-slate-200'
            }`}
          >
            <p className="text-xs font-bold text-[#2E7D8E]">{tier.badge}</p>
            <h2 className="mt-1 text-xl font-bold text-[#0b1f14]">{tier.name}</h2>
            <p className="mt-2 text-3xl font-bold text-[#2D8B5A]">
              {price === 0 ? 'مجاني' : `${price} ${currency}`}
            </p>
            {price > 0 ? (
              <p className="mt-1 text-xs leading-5 text-slate-500">
                مرجع الكتالوج. المسار التجريبي يُفعَّل الآن دون فاتورة فورية.
              </p>
            ) : null}
            <ul className="mt-4 flex-1 space-y-2 text-sm leading-6 text-slate-600">
              {tier.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => choose(tier.id)}
              className={`mt-5 rounded-xl px-4 py-3 text-sm font-bold text-white ${
                tier.emphasized ? 'bg-[#2E7D8E]' : 'bg-slate-900'
              }`}
            >
              {tier.cta}
            </button>
          </article>
        ))}
      </div>

      <p className="text-center text-[11px] leading-6 text-slate-400">
        المبالغ المدفوعة من الكتالوج الرسمي بالريال العُماني عند اختيار عملة أخرى
        تُحوَّل من السعر المعتمد. إكمال جلسة رقمية لا يعني إتقان معيار.
        {paymentsOff ? ' الوضع التجريبي يتابع التسجيل دون خصم فوري.' : ''}
      </p>
    </section>
  );
}

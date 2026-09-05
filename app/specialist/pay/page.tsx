'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import TaalufLogo from '@/components/branding/TaalufLogo';
import { LanguageToggleBtn, useLanguage } from '@/components/LanguageProvider';
import PaymentPanel from '@/components/access/PaymentPanel';
import SubscriberGate from '@/components/access/SubscriberGate';
import { TAALUF_PRICING } from '@/lib/pricingConfig';

export default function SpecialistPayPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [selected, setSelected] = useState(
    TAALUF_PRICING.specialistBundles.find((p) => p.recommended)?.id || 'spec_5'
  );
  const bundle =
    TAALUF_PRICING.specialistBundles.find((p) => p.id === selected) ||
    TAALUF_PRICING.specialistBundles[1];

  const afterPay = async () => {
    const res = await signIn('credentials', {
      email: 'guest-specialist@taaluf.local',
      password: 'paid-access',
      portal: 'specialist',
      redirect: false,
    });
    if (res?.error) {
      router.push('/login?portal=specialist');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10">
      <div className="mb-2 flex items-center justify-between gap-3">
        <TaalufLogo href="/" size="md" />
        <LanguageToggleBtn />
      </div>
      <h1 className="mt-4 text-3xl font-bold text-[#0b1f14]">
        {t('specialistPayTitle')}
      </h1>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        ادفع حسب عدد الحالات. إن كان لديك حساب:{' '}
        <Link href="/login?portal=specialist" className="font-semibold text-[#2D8B5A]">
          سجّل الدخول مباشرة
        </Link>
        .
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {TAALUF_PRICING.specialistBundles.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelected(plan.id)}
            className={`rounded-2xl border p-4 text-start ${
              selected === plan.id
                ? 'border-[#2E7D8E] bg-[#F0FDFA]'
                : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-sm font-bold text-[#0b1f14]">{plan.name}</p>
            <p className="mt-1 text-lg font-bold text-[#2E7D8E]">
              {plan.priceOMR} ر.ع.
            </p>
            <p className="text-xs text-slate-400">
              {plan.casesCount} حالات · {plan.costPerCaseOMR} ر.ع./حالة
            </p>
          </button>
        ))}
      </div>
      <div className="mt-6">
        <PaymentPanel
          product="specialistAccess"
          title={bundle.name}
          amount={bundle.priceOMR}
          currency="OMR"
          onPaid={afterPay}
        />
      </div>
      <SubscriberGate />
    </main>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import PaymentPanel from '@/components/access/PaymentPanel';
import SubscriberGate from '@/components/access/SubscriberGate';
import { BRAND } from '@/lib/content';

export default function SpecialistPayPage() {
  const router = useRouter();

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
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <Link href="/" className="text-2xl font-bold text-[#2D8B5A]">
        {BRAND.name}
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-[#0b1f14]">
        دخول المختص عبر الدفع
      </h1>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        إن لم يكن لديك حساب مختص، ادفع رسوم الدخول أولاً ثم تُفتح بوابة التقييم.
        إن كان لديك حساب:{' '}
        <Link href="/login?portal=specialist" className="font-semibold text-[#2D8B5A]">
          سجّل الدخول مباشرة
        </Link>
        . المشتركون يستخدمون زر «مشترك».
      </p>
      <div className="mt-6">
        <PaymentPanel product="specialistAccess" onPaid={afterPay} />
      </div>
      <SubscriberGate />
    </main>
  );
}

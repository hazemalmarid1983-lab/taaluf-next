'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ok' | 'fail'>('loading');
  const [msg, setMsg] = useState('جاري التحقق من الدفع…');

  useEffect(() => {
    const chargeId =
      params.get('tap_id') ||
      params.get('charge_id') ||
      params.get('chargeId') ||
      '';

    const run = async () => {
      if (!chargeId) {
        setStatus('fail');
        setMsg('لم يُعثر على معرف عملية الدفع');
        return;
      }
      try {
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chargeId }),
        });
        const data = await res.json();
        if (!res.ok || !data.captured) {
          setStatus('fail');
          setMsg(data.message || 'فشل الدفع');
          return;
        }
        setStatus('ok');
        setMsg('تم الدفع بنجاح');
        setTimeout(() => router.push('/parent/assessment'), 1200);
      } catch {
        setStatus('fail');
        setMsg('تعذر التحقق من الدفع');
      }
    };
    void run();
  }, [params, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f0f9f4_0%,#f8fafc_100%)] px-4">
      <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-[#0b1f14]">
          {status === 'ok'
            ? 'تم الدفع بنجاح'
            : status === 'fail'
              ? 'فشل الدفع'
              : 'التحقق من الدفع'}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">{msg}</p>
        {status === 'fail' && (
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/parent/pay-assessment">
              <Button className="w-full">إعادة المحاولة</Button>
            </Link>
            <Link href="/parent">
              <Button variant="outline" className="w-full">
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        )}
        {status === 'ok' && (
          <p className="mt-4 text-xs text-slate-400">
            جاري التحويل إلى التقييم…
          </p>
        )}
      </div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          جاري التحميل…
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}

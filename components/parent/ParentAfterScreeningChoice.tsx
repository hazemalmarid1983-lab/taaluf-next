'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  PARENT_ROUTES,
  rememberLastPurchase,
  setJourneyMode,
  unlockFullPath,
  unlockStaffFollowup,
} from '@/lib/parentJourney';
import {
  DEFAULT_CURRENCY,
  PERIOD_LABEL_AR,
  SUPPORTED_CURRENCIES,
  TAALUF_PRICING,
  getPrice,
} from '@/lib/pricing';

const paymentsOff =
  process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === 'true' ||
  process.env.NEXT_PUBLIC_TAALUF_PILOT_MODE === 'true';

export default function ParentAfterScreeningChoice({
  highlight,
}: {
  highlight?: 'assessment' | 'monitoring';
}) {
  const router = useRouter();
  const [studentName, setStudentName] = useState('');
  const [childId, setChildId] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('taaluf.activeStudent');
      if (raw) {
        const s = JSON.parse(raw);
        setStudentName(s.name || '');
        setChildId(s.id || '');
      }
    } catch {
      /* ignore */
    }
  }, []);

  const startParentPlan = (planId: string) => {
    rememberLastPurchase(planId);
    setJourneyMode('independent_parent');
    unlockFullPath();
    router.push(PARENT_ROUTES.questionnaire);
  };

  const startStaffFollowup = () => {
    setJourneyMode('specialist_guided');
    unlockStaffFollowup();
    router.push(PARENT_ROUTES.booking);
  };

  const startTapCheckout = async (planId: string) => {
    if (!childId) {
      setMsg('سجّل الطفل أولاً قبل الدفع');
      return;
    }
    setBusy(true);
    setMsg('');
    rememberLastPurchase(planId);
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          assessmentType: planId,
          amount: getPrice(planId, currency),
          currency,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.message || data.error || 'تعذر بدء الدفع');
      }
      setJourneyMode('independent_parent');
      unlockFullPath();
      if (data.devMode) {
        setMsg('وضع تطوير — التحويل لصفحة التأكيد…');
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'تعذر الدفع');
      setBusy(false);
    }
  };

  const applyCode = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/access/entitlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'رمز غير صالح');
      setMsg(data.message);
      setJourneyMode('independent_parent');
      unlockFullPath();
      setTimeout(() => router.push(PARENT_ROUTES.questionnaire), 500);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'فشل التفعيل');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-slate-200 bg-white px-6 py-7">
        <p className="text-sm font-semibold text-[#2D8B5A]">
          بعد النتيجة · اختر الباقة
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#0b1f14]">
          {studentName
            ? `كيف تود متابعة تقييم ${studentName}؟`
            : 'اختر باقة التقييم المناسبة لطفلك'}
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          الفرز المجاني اكتمل. اختر تقييماً منفرداً أو متابعة نصف سنوية أو رعاية
          سنوية تراكمية. حجز موعد الأخصائي متاح كمسار مدمج مستقل.
        </p>
      </header>

      {!studentName && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          لم يُسجَّل طفل بعد.{' '}
          <Link href={PARENT_ROUTES.register} className="font-semibold underline">
            سجّل الطفل أولاً
          </Link>
        </p>
      )}

      <div className="flex justify-end">
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
        {TAALUF_PRICING.parents.map((plan) => {
          const emphasized =
            (highlight === 'monitoring' && plan.id === 'parent_annual') ||
            (highlight !== 'monitoring' && plan.id === 'parent_single');
          return (
            <article
              key={plan.id}
              className={`flex flex-col rounded-3xl border bg-white p-6 ${
                plan.recommended || emphasized
                  ? 'border-[#2D8B5A]/30'
                  : 'border-slate-200'
              }`}
            >
              <p className="text-xs font-bold text-[#2D8B5A]">
                {PERIOD_LABEL_AR[plan.period]}
                {plan.recommended ? ' · موصى بها' : ''}
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#0b1f14]">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold text-[#2D8B5A]">
                {paymentsOff
                  ? 'مجاناً للتجربة'
                  : `${getPrice(plan.id, currency)} ${currency}`}
              </p>
              <ul className="mt-4 flex-1 space-y-1 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Button
                className="mt-5 w-full"
                disabled={busy || !childId}
                onClick={() =>
                  paymentsOff
                    ? startParentPlan(plan.id)
                    : startTapCheckout(plan.id)
                }
              >
                {paymentsOff ? 'ابدأ هذه الباقة' : 'ادفع وابدأ هذه الباقة'}
              </Button>
            </article>
          );
        })}
      </div>

      <div className="rounded-3xl border border-[#2E7D8E]/20 bg-[#F0FDFA] p-5 text-center">
        <p className="text-sm font-semibold text-[#1F2A37]">
          تفضّل مساراً مدمجاً مع أخصائي؟
        </p>
        <p className="mt-1 text-xs leading-6 text-slate-500">
          حجز الموعد وجلسة المعايير الأربعين ضمن مسار العيادة/الأخصائي.
        </p>
        <Button
          variant="outline"
          className="mt-3"
          disabled={busy || !childId}
          onClick={startStaffFollowup}
        >
          احجز موعد وابدأ التقييم المدمج
        </Button>
      </div>

      {paymentsOff && (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
          الوضع التجريبي: الباقات معروضة بالأسعار الرسمية، والمسار مفتوح بدون دفع.
        </p>
      )}

      {!paymentsOff && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-[#0b1f14]">رمز مشترك</p>
          <div className="mt-3 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="رمز الاشتراك"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <Button variant="outline" disabled={busy} onClick={applyCode}>
              تفعيل
            </Button>
          </div>
        </div>
      )}

      {msg && <p className="text-sm font-medium text-[#2D8B5A]">{msg}</p>}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { canAccessAssessment, type Entitlements } from '@/lib/access';
import {
  PRICING_TIERS,
  SUPPORTED_CURRENCIES,
  getPrice,
} from '@/lib/pricing';

export default function PayAssessmentPage() {
  const router = useRouter();
  const [ent, setEnt] = useState<Entitlements | null>(null);
  const [studentName, setStudentName] = useState('');
  const [childId, setChildId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [code, setCode] = useState('');

  const price = useMemo(
    () => getPrice('assessment', currency),
    [currency]
  );

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
    fetch('/api/access/entitlements')
      .then((r) => r.json())
      .then((d) => setEnt(d.entitlements))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (ent && canAccessAssessment(ent)) {
      router.replace('/parent/assessment');
    }
  }, [ent, router]);

  const startTapCheckout = async () => {
    if (!childId) {
      setMsg('سجّل الطفل أولاً قبل الدفع');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          assessmentType: 'assessment',
          amount: price,
          currency,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.message || data.error || 'تعذر بدء الدفع');
      }
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
      setEnt(data.entitlements);
      setTimeout(() => router.push('/parent/assessment'), 600);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'فشل التفعيل');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#0b1f14]">دفع رسوم التقييم</h1>
        <p className="mt-2 text-sm text-slate-500">
          الخطوة 2 — الدفع عبر Tap ثم فتح الاستبيان
          {studentName ? ` لـ ${studentName}` : ''}.
        </p>
      </div>

      {!studentName && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          لم يُسجَّل طفل بعد.{' '}
          <Link href="/parent/register-child" className="font-semibold underline">
            سجّل الطفل أولاً
          </Link>
        </p>
      )}

      <div className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#0b1f14]">
              {PRICING_TIERS.assessment.name_ar}
            </h2>
            <p className="mt-2 text-3xl font-bold text-[#2D8B5A]">
              {price} {currency}
            </p>
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <ul className="space-y-1 text-sm text-slate-600">
          {PRICING_TIERS.assessment.features_ar.map((f) => (
            <li key={f}>• {f}</li>
          ))}
        </ul>
        <Button
          className="w-full"
          disabled={busy || !childId}
          onClick={startTapCheckout}
        >
          {busy ? 'جاري التحويل لـ Tap…' : 'ادفع عبر Tap'}
        </Button>
        <p className="text-xs text-slate-400">
          بوابة Tap (السعودية، الإمارات، مصر، الخليج). بدون مفتاح يعمل وضع
          التطوير المحلي.
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-5">
        <p className="text-sm font-semibold text-[#0b1f14]">رمز مشترك</p>
        <div className="mt-3 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="TAALUF-VIP"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <Button variant="outline" disabled={busy} onClick={applyCode}>
            تفعيل
          </Button>
        </div>
      </div>

      {msg && <p className="text-sm font-medium text-[#2D8B5A]">{msg}</p>}
    </section>
  );
}

'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PRICES } from '@/lib/access';

type Product = keyof typeof PRICES;

export default function PaymentPanel({
  product,
  slotId,
  studentName,
  onPaid,
  title,
  amount,
  currency,
}: {
  product: Product;
  slotId?: string;
  studentName?: string;
  title?: string;
  amount?: number;
  currency?: string;
  onPaid: () => void;
}) {
  const price = PRICES[product];
  const displayAmount = amount ?? price.amount;
  const displayCurrency = currency ?? price.currency;
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const pay = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/access/entitlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          product,
          slotId,
          studentName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل الدفع');

      await fetch('/api/platform/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment',
          product,
          studentName,
        }),
      }).catch(() => undefined);

      if (product === 'booking' && slotId) {
        await fetch('/api/platform/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'booking',
            slotId,
            studentName,
          }),
        }).catch(() => undefined);
      }

      setMsg(data.message);
      setTimeout(onPaid, 500);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'تعذر الدفع');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={pay}
      className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-xl font-bold text-[#0b1f14]">
          {title || price.label}
        </h2>
        <p className="mt-2 text-3xl font-bold text-[#2D8B5A]">
          {displayAmount} {displayCurrency}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          دفع تجريبي للتطوير — لا يُخصم مبلغ حقيقي
        </p>
      </div>
      <div className="space-y-2">
        <Label>اسم حامل البطاقة</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="كما يظهر على البطاقة"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>رقم البطاقة (تجريبي)</Label>
        <Input value={card} onChange={(e) => setCard(e.target.value)} required />
      </div>
      {msg && <p className="text-sm font-medium text-[#2D8B5A]">{msg}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? 'جاري التأكيد…' : 'ادفع الآن'}
      </Button>
    </form>
  );
}

'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function computeAge(dob: string) {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? age : 0;
}

export default function ParentRegisterChildPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [msg, setMsg] = useState('');
  const age = useMemo(() => computeAge(dob), [dob]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const row = { id: `child_${Date.now()}`, name, age, dob };
    localStorage.setItem('taaluf.activeStudent', JSON.stringify(row));
    await fetch('/api/access/entitlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setStudent', studentName: name }),
    });
    await fetch('/api/platform/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'student',
        id: row.id,
        name,
        age,
        dob,
      }),
    }).catch(() => undefined);
    setMsg('تم تسجيل الطفل — انتقل لدفع التقييم');
    setTimeout(() => router.push('/parent/pay-assessment'), 500);
  };

  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
      <h1 className="text-2xl font-bold text-[#0b1f14]">تسجيل الطفل</h1>
      <p className="mt-2 text-sm text-slate-500">
        الخطوة 1 — بعد التسجيل ستنتقل لشاشة الدفع ثم يُفتح التقييم
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label>اسم الطفل</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>تاريخ الميلاد</Label>
          <Input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
          {dob && (
            <p className="text-sm text-[#2D8B5A]">العمر المحسوب: {age} سنة</p>
          )}
        </div>
        {msg && <p className="text-sm text-[#2D8B5A]">{msg}</p>}
        <Button type="submit" className="w-full" disabled={!name || !dob}>
          حفظ والمتابعة للدفع
        </Button>
      </form>
    </section>
  );
}

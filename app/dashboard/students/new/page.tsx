'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STUDENT_COPY } from '@/lib/content';

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

export default function NewStudentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const age = useMemo(() => computeAge(dob), [dob]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          dob,
          parent_phone: parentPhone,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'فشل الحفظ');

      const student = data.record;
      const localKey = 'taaluf.students.v1';
      const prev = JSON.parse(localStorage.getItem(localKey) || '[]');
      const row = {
        id: student.id,
        ...student.fields,
      };
      localStorage.setItem(localKey, JSON.stringify([row, ...prev]));
      localStorage.setItem('taaluf.activeStudent', JSON.stringify(row));
      await fetch('/api/platform/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'student',
          id: row.id,
          name: row.name,
          age: row.age,
          dob,
        }),
      }).catch(() => undefined);

      setMsg(`تم حفظ ${row.name} (${row.age} سنة)`);
      setTimeout(() => router.push('/dashboard/assessments/new'), 700);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl">
      <div className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold text-[#2D8B5A]">الخطوة 1 من 2</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0b1f14]">
          {STUDENT_COPY.title}
        </h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          {STUDENT_COPY.subtitle}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الطفل</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="الاسم الكامل"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">تاريخ الميلاد</Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
            {dob && (
              <p className="text-sm font-medium text-[#2D8B5A]">
                العمر المحسوب: {age} سنة
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">هاتف ولي الأمر</Label>
            <Input
              id="phone"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              placeholder="05xxxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اختياري — سياق أسري أو مدرسي"
            />
          </div>

          {msg && <p className="text-sm font-medium text-[#2D8B5A]">{msg}</p>}

          <Button
            type="submit"
            disabled={loading || !name || !dob}
            className="w-full"
          >
            {loading ? 'جاري الحفظ…' : STUDENT_COPY.submit}
          </Button>
        </form>
      </div>
    </section>
  );
}

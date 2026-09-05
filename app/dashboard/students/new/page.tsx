'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STUDENT_COPY } from '@/lib/content';
import { useLanguage } from '@/components/LanguageProvider';
import { saveActiveChild } from '@/lib/parentJourney';
import {
  addToCaseload,
  upsertLocalStudent,
} from '@/lib/specialistCaseload';

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
  const { t } = useLanguage();
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const age = useMemo(() => computeAge(dob), [dob]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dob) return;
    setLoading(true);
    setMsg('');

    const row = {
      id: `child_${Date.now()}`,
      name: name.trim(),
      dob,
      age,
      parent_name: parentName.trim(),
      parent_phone: parentPhone.trim(),
      notes: notes.trim(),
      status: 'نشط',
      specialist_email: String(session?.user?.email || ''),
      specialist_name: String(session?.user?.name || ''),
    };

    try {
      upsertLocalStudent(row);
      if (session?.user?.email) addToCaseload(session.user.email, row.id);
      saveActiveChild({
        id: row.id,
        name: row.name,
        age: row.age,
        dob: row.dob,
      });

      fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: row.name,
          dob: row.dob,
          parent_name: row.parent_name,
          parent_phone: row.parent_phone,
          notes: row.notes,
        }),
      }).catch(() => undefined);

      fetch('/api/airtable/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'child',
          childId: row.id,
          name: row.name,
          birthDate: row.dob,
          dob: row.dob,
          guardianName: row.parent_name,
          guardianPhone: row.parent_phone,
        }),
      }).catch(() => undefined);

      fetch('/api/platform/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'student',
          id: row.id,
          name: row.name,
          age: row.age,
          dob: row.dob,
        }),
      }).catch(() => undefined);

      router.push(`/dashboard/students/${row.id}`);
    } catch (err) {
      setMsg(
        err instanceof Error ? err.message : 'تعذر حفظ الحالة محلياً'
      );
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl">
      <div className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold text-[#2D8B5A]">حالة جديدة</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0b1f14]">
          {t('newCaseTitle')}
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
            <Label htmlFor="parent">اسم ولي الأمر</Label>
            <Input
              id="parent"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="اختياري"
            />
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
            <Label htmlFor="notes">ملاحظات الحالة</Label>
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

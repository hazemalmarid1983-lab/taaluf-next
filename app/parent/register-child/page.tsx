'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/LanguageProvider';
import { saveActiveChild, parentScreeningEntryHref } from '@/lib/parentJourney';

function toWesternDigits(value: string) {
  const map: Record<string, string> = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
  };
  return value.replace(/[٠-٩۰-۹]/g, (digit) => map[digit] || digit);
}

function parseDob(raw: string) {
  const value = toWesternDigits(String(raw || '').trim());
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const slash = value.match(/^(\d{1,2})[/.\\-](\d{1,2})[/.\\-](\d{4})$/);
  if (slash) {
    const day = slash[1].padStart(2, '0');
    const month = slash[2].padStart(2, '0');
    const year = slash[3];
    return `${year}-${month}-${day}`;
  }
  const birth = new Date(value);
  if (!Number.isNaN(birth.getTime())) {
    return birth.toISOString().slice(0, 10);
  }
  return '';
}

function computeAge(dob: string) {
  const iso = parseDob(dob);
  if (!iso) return 0;
  const birth = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? age : 0;
}

export default function ParentRegisterChildPage() {
  const router = useRouter();
  const { t, dir } = useLanguage();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const age = useMemo(() => computeAge(dob), [dob]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const childName = String(form.get('name') || name).trim();
    const childDob = parseDob(String(form.get('dob') || dob));
    if (!childName) {
      setError(t('enterChildName'));
      return;
    }
    if (!childDob) {
      setError(t('chooseDob'));
      return;
    }
    setError('');
    setSaving(true);
    const childAge = computeAge(childDob);
    let id = `child_${Date.now()}`;
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: childName, dob: childDob }),
      });
      const data = await res.json();
      if (res.ok && data.record?.id) id = data.record.id;
    } catch {
      /* يبقى المعرف المحلي */
    }
    const row = { id, name: childName, age: childAge, dob: childDob };
    saveActiveChild(row);
    await fetch('/api/access/entitlements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setStudent', studentName: childName }),
    });
    await fetch('/api/platform/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'student',
        id: row.id,
        name: childName,
        age: childAge,
        dob: childDob,
      }),
    }).catch(() => undefined);
    setMsg(t('childSaved'));
    setTimeout(() => router.push(parentScreeningEntryHref()), 400);
  };

  return (
    <section
      className="mx-auto max-w-lg rounded-3xl border border-white/90 bg-white/80 p-7 shadow-xl backdrop-blur-2xl"
      dir={dir}
    >
      <h1 className="text-2xl font-bold text-[#0b1f14]">
        {t('registerChildTitle')}
      </h1>
      <p className="mt-2 text-sm text-slate-500">{t('registerChildBody')}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="child-name">{t('childName')}</Label>
          <Input
            id="child-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="child-dob">{t('childDob')}</Label>
          <Input
            id="child-dob"
            name="dob"
            type="date"
            dir="ltr"
            lang="en"
            value={dob}
            onChange={(e) => setDob(parseDob(e.target.value) || e.target.value)}
            required
          />
          {dob && age > 0 && (
            <p className="text-sm text-[#2D8B5A]">
              {t('computedAge', { age })}
            </p>
          )}
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {msg && <p className="text-sm text-[#2D8B5A]">{msg}</p>}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? t('consentSaving') : t('saveContinueScreening')}
        </Button>
      </form>
    </section>
  );
}

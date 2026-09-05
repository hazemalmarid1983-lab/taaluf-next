'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PARENT_ROUTES } from '@/lib/parentJourney';
import { useLanguage } from '@/components/LanguageProvider';

export default function ParentFollowUpPage() {
  const { t, dir } = useLanguage();
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('taaluf.activeStudent');
      if (raw) setStudentName(JSON.parse(raw).name || '');
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <section className="mx-auto max-w-xl space-y-5" dir={dir}>
      <header className="rounded-3xl border border-slate-200 bg-white px-6 py-7">
        <p className="text-sm font-semibold text-[#2D8B5A]">{t('followupEyebrow')}</p>
        <h1 className="mt-2 text-2xl font-bold text-[#0b1f14]">
          {t('followupTitle')}
          {studentName ? ` — ${studentName}` : ''}
        </h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">{t('followupLead')}</p>
      </header>

      <Link href={PARENT_ROUTES.messages} className="block">
        <Button className="h-12 w-full text-base font-bold">{t('messageStaff')}</Button>
      </Link>
      <Link href={PARENT_ROUTES.booking} className="block">
        <Button variant="secondary" className="h-12 w-full text-base font-bold">
          {t('bookSpecialist')}
        </Button>
      </Link>
      <Link href={`${PARENT_ROUTES.pay}?plan=assessment`} className="block">
        <Button variant="outline" className="h-11 w-full">
          {t('registerFullInstead')}
        </Button>
      </Link>
    </section>
  );
}

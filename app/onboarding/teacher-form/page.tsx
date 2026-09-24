'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TeacherAssessmentForm from '@/components/child-room/TeacherAssessmentForm';
import { CHILD_ROOM_PATH } from '@/lib/childRoom/gate';
import { readActiveChild, type ParentChild } from '@/lib/parentJourney';

export default function ParentTeacherFormPage() {
  const router = useRouter();
  const [child, setChild] = useState<ParentChild | null>(null);

  useEffect(() => {
    setChild(readActiveChild());
  }, []);

  if (!child) {
    return (
      <p className="px-4 py-16 text-center text-sm text-slate-600">
        سجّل الطفل أولاً ثم عد إلى هذا النموذج.
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-10" dir="rtl">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">نموذج المدرس</h1>
      <TeacherAssessmentForm
        childId={child.id}
        filler="parent"
        onSaved={() => router.push(CHILD_ROOM_PATH)}
      />
    </section>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TEACHER_FORM_PATH, createTeacherInvite } from '@/lib/childRoom/gate';
import { readActiveChild, setJourneyMode } from '@/lib/parentJourney';

export default function TeacherChoicePage() {
  const router = useRouter();
  const [invitePath, setInvitePath] = useState('');

  const choose = (hasTeacher: boolean) => {
    const child = readActiveChild();
    if (!child) {
      router.push('/parent/register-child');
      return;
    }
    if (!hasTeacher) {
      setJourneyMode('independent_parent');
      router.push(TEACHER_FORM_PATH);
      return;
    }
    setJourneyMode('specialist_guided');
    const invite = createTeacherInvite(child.id, child.name);
    setInvitePath(`/invite/teacher/${invite.token}`);
  };

  return (
    <section className="mx-auto max-w-lg px-4 py-10 text-right" dir="rtl">
      <h1 className="text-2xl font-bold text-slate-900">ربط غرفة الطفل</h1>
      <p className="mt-3 text-base font-semibold text-slate-800">
        هل لدى الطفل مدرس خصوصي / أخصائي تابع له؟
      </p>
      <div className="mt-6 grid gap-3">
        <button
          type="button"
          onClick={() => choose(true)}
          className="rounded-2xl bg-[#2E7D8E] px-4 py-3 text-sm font-bold text-white"
        >
          نعم، لدى الطفل مدرس
        </button>
        <button
          type="button"
          onClick={() => choose(false)}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800"
        >
          لا، سأعبئ نموذج المدرس بنفسي
        </button>
      </div>
      {invitePath ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-900">
            أرسل هذا الرابط للمدرس. عند فتحه يسجّل اسمه وكلمة المرور ويُربَط بالغرفة.
          </p>
          <p className="mt-2 break-all text-sm font-semibold text-slate-800" dir="ltr">
            {invitePath}
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-bold text-[#2E7D8E] underline"
            onClick={() => navigator.clipboard.writeText(window.location.origin + invitePath)}
          >
            نسخ الرابط
          </button>
        </div>
      ) : null}
    </section>
  );
}

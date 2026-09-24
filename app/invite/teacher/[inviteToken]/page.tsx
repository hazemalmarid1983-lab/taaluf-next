'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TeacherAssessmentForm from '@/components/child-room/TeacherAssessmentForm';
import {
  CHILD_ROOM_PATH,
  acceptTeacherInvite,
  readTeacherInvite,
  type TeacherInvite,
} from '@/lib/childRoom/gate';
import { saveActiveChild } from '@/lib/parentJourney';

export default function TeacherInvitePage() {
  const params = useParams<{ inviteToken: string }>();
  const token = String(params.inviteToken || '');
  const [invite, setInvite] = useState<TeacherInvite | null>(null);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [linked, setLinked] = useState(false);
  const [formSaved, setFormSaved] = useState(false);

  useEffect(() => {
    const found = readTeacherInvite(token);
    setInvite(found);
    setLinked(Boolean(found?.acceptedAt));
    setReady(true);
  }, [token]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const accepted = acceptTeacherInvite(token, name, password);
    if (!accepted) {
      setError('تعذر الربط. تحقق من الاسم وكلمة المرور (4 أحرف على الأقل).');
      return;
    }
    saveActiveChild({ id: accepted.childId, name: accepted.childName });
    setInvite(accepted);
    setLinked(true);
  };

  if (!ready) return null;

  if (!invite) {
    return (
      <p className="px-4 py-16 text-center text-sm text-slate-600">
        رابط الدعوة غير موجود على هذا الجهاز.
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-10" dir="rtl">
      <h1 className="text-2xl font-bold text-slate-900">دعوة مدرس</h1>
      <p className="mt-2 text-sm text-slate-600">غرفة {invite.childName}</p>
      {!linked ? (
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="اسم المدرس"
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
            required
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="كلمة المرور"
            type="password"
            minLength={4}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
            required
          />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-[#2E7D8E] px-4 py-3 text-sm font-bold text-white"
          >
            ربط بالغرفة
          </button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          {formSaved ? (
            <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
              تم الربط وحفظ النموذج. غرفة الطفل:{' '}
              <a className="underline" href={CHILD_ROOM_PATH}>
                {CHILD_ROOM_PATH}
              </a>
            </p>
          ) : (
            <TeacherAssessmentForm
              childId={invite.childId}
              filler="teacher"
              teacherName={invite.teacherName}
              onSaved={() => setFormSaved(true)}
            />
          )}
        </div>
      )}
    </section>
  );
}

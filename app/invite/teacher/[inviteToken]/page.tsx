'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import TeacherAssessmentForm from '@/components/child-room/TeacherAssessmentForm';
import { CHILD_ROOM_PATH } from '@/lib/childRoom/gate';
import { saveActiveChild } from '@/lib/parentJourney';

type PublicInvite = {
  token: string;
  childId: string;
  childName: string;
  teacherName?: string;
  accepted: boolean;
  loginEmail?: string;
};

async function openTeacherSession(email: string, password: string) {
  const result = await signIn('credentials', {
    email,
    password,
    portal: 'specialist',
    redirect: false,
    callbackUrl: CHILD_ROOM_PATH,
  });
  return !result?.error;
}

export default function TeacherInvitePage() {
  const params = useParams<{ inviteToken: string }>();
  const token = String(params.inviteToken || '');
  const [invite, setInvite] = useState<PublicInvite | null>(null);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [linked, setLinked] = useState(false);
  const [formSaved, setFormSaved] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch(`/api/teacher-invites/${encodeURIComponent(token)}`);
      const data = (await response.json().catch(() => null)) as {
        invite?: PublicInvite;
      } | null;
      if (cancelled) return;
      const inviteRow = response.ok && data?.invite ? data.invite : null;
      setInvite(
        inviteRow
          ? { ...inviteRow, loginEmail: (data as { loginEmail?: string } | null)?.loginEmail }
          : null
      );
      setLinked(Boolean(inviteRow?.accepted));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const response = await fetch(`/api/teacher-invites/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherName: name, password }),
    });
    const data = (await response.json().catch(() => null)) as {
      invite?: PublicInvite;
      loginEmail?: string;
    } | null;
    if (!response.ok || !data?.invite) {
      setError('تعذر الربط. تحقق من الاسم وكلمة المرور (4 أحرف على الأقل).');
      return;
    }
    saveActiveChild({ id: data.invite.childId, name: data.invite.childName });
    const email = data.loginEmail || '';
    const sessionOk = email ? await openTeacherSession(email, password) : false;
    setSignedIn(sessionOk);
    setInvite({ ...data.invite, loginEmail: email });
    setLinked(true);
    if (!sessionOk) {
      setError('تم إنشاء الحساب. أعد إدخال كلمة المرور لفتح الجلسة على هذا الهاتف.');
    }
  };

  const onLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const email = invite?.loginEmail || '';
    if (!email) return;
    const sessionOk = await openTeacherSession(email, password);
    if (sessionOk && invite) {
      saveActiveChild({ id: invite.childId, name: invite.childName });
    }
    setSignedIn(sessionOk);
    if (!sessionOk) {
      setError('كلمة المرور لا تطابق حساب هذه الغرفة.');
    }
  };

  if (!ready) return null;

  if (!invite) {
    return (
      <p className="px-4 py-16 text-center text-sm text-slate-600">
        رابط الدعوة غير موجود على الخادم.
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
          {!signedIn ? (
            <form onSubmit={onLogin} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">
                ادخل كلمة مرور هذه الغرفة لفتح جلسة المدرس على هذا الهاتف.
              </p>
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
                دخول غرفة {invite.childName}
              </button>
            </form>
          ) : (
            <p className="rounded-2xl bg-sky-50 p-4 text-sm font-semibold text-sky-950">
              الجلسة مفتوحة لهذه الغرفة فقط.{' '}
              <a className="underline" href={CHILD_ROOM_PATH}>
                المحادثة والملاحظات
              </a>
            </p>
          )}
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
              inviteToken={token}
              onSaved={() => setFormSaved(true)}
            />
          )}
        </div>
      )}
    </section>
  );
}

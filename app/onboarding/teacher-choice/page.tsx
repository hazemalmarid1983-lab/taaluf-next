'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CHILD_ROOM_PATH, TEACHER_FORM_PATH } from '@/lib/childRoom/gate';
import { readActiveChild, setJourneyMode } from '@/lib/parentJourney';

export default function TeacherChoicePage() {
  const router = useRouter();
  const [invitePath, setInvitePath] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!invitePath || typeof window === 'undefined') {
      setInviteUrl('');
      return;
    }
    setInviteUrl(`${window.location.origin}${invitePath}`);
  }, [invitePath]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const choose = async (hasTeacher: boolean) => {
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
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const response = await fetch('/api/teacher-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: child.id, childName: child.name }),
      });
      const data = (await response.json()) as {
        invite?: { path?: string };
        error?: string;
      };
      if (!response.ok || !data.invite?.path) {
        throw new Error(data.error || 'INVITE_FAILED');
      }
      setInvitePath(data.invite.path);
    } catch {
      setError(
        'تعذر حفظ الدعوة على الخادم. تأكد من تسجيل الدخول ثم أعد المحاولة.'
      );
    } finally {
      setBusy(false);
    }
  };

  const copyInvite = async () => {
    const text = inviteUrl || invitePath;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setError('تعذر نسخ الرابط. انسخه يدوياً من المربع أعلاه.');
    }
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
          onClick={() => void choose(true)}
          disabled={busy}
          className="rounded-2xl bg-[#2E7D8E] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? 'جاري إنشاء الرابط…' : 'نعم، لدى الطفل مدرس'}
        </button>
        <button
          type="button"
          onClick={() => void choose(false)}
          disabled={busy}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 disabled:opacity-60"
        >
          لا، سأعبئ نموذج المدرس بنفسي
        </button>
      </div>
      {invitePath ? (
        <div className="mt-6 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-900">
            أرسل هذا الرابط للمدرس. يُفتح من أي جهاز ويُربط بغرفة الطفل على
            الخادم.
          </p>
          <p
            className="break-all rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-800"
            dir="ltr"
          >
            {inviteUrl || invitePath}
          </p>
          <button
            type="button"
            className="w-full rounded-xl border border-[#2E7D8E]/30 bg-white px-4 py-2.5 text-sm font-bold text-[#2E7D8E]"
            onClick={() => void copyInvite()}
          >
            نسخ الرابط
          </button>
          <button
            type="button"
            className="w-full rounded-xl bg-[#2E7D8E] px-4 py-3 text-sm font-bold text-white"
            onClick={() => router.push(CHILD_ROOM_PATH)}
          >
            تم، الانتقال للتالي
          </button>
          <p className="text-xs leading-5 text-emerald-800">
            يمكنك متابعة بقية خطوات الإعداد الآن. عندما يفتح المدرس الرابط
            ويكمل النموذج تُحدَّث غرفة الطفل تلقائياً.
          </p>
        </div>
      ) : null}
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {copied ? (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          تم النسخ بنجاح
        </div>
      ) : null}
    </section>
  );
}

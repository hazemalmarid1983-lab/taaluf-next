'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { RoomMessage } from '@/lib/childRoom/roomMessages';

const ROLE_LABEL: Record<string, string> = {
  parent: 'ولي الأمر',
  teacher: 'المدرس',
  specialist: 'الأخصائي',
  scientific_advisor: 'المستشار',
  admin: 'الإدارة',
};

export default function RoomConversation({ childId }: { childId: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(
      `/api/child-room/messages?childId=${encodeURIComponent(childId)}`
    );
    const data = (await response.json().catch(() => null)) as {
      messages?: RoomMessage[];
    } | null;
    if (!response.ok) {
      setError('تعذر فتح قناة الغرفة.');
      setReady(true);
      return;
    }
    setMessages(data?.messages || []);
    setError('');
    setReady(true);
  }, [childId]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(timer);
  }, [load]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    const response = await fetch('/api/child-room/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, body }),
    });
    const data = (await response.json().catch(() => null)) as {
      message?: RoomMessage;
    } | null;
    if (!response.ok || !data?.message) {
      setError('تعذر إرسال الرسالة.');
      return;
    }
    setText('');
    setMessages((current) => [...current, data.message as RoomMessage]);
  };

  const myId = session?.user?.id || '';

  return (
    <section className="mx-auto mt-6 max-w-lg rounded-2xl border border-[#2E7D8E]/20 bg-white p-5 text-right">
      <h2 className="text-base font-bold text-slate-900">محادثة الغرفة المغلقة</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        رسائل وملاحظات تربوية بين ولي الأمر والمدرس لهذه الغرفة فقط. لا تظهر في
        مجتمع تآلف العام.
      </p>
      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
        {ready && messages.length === 0 ? (
          <p className="text-sm text-slate-400">لا رسائل بعد. ابدأ الملاحظة الأولى.</p>
        ) : null}
        {messages.map((message) => {
          const mine = message.authorId === myId;
          return (
            <article
              key={message.id}
              className={
                mine
                  ? 'rounded-2xl bg-[#2E7D8E] px-3 py-2 text-white'
                  : 'rounded-2xl bg-slate-100 px-3 py-2 text-slate-800'
              }
            >
              <p className="text-[11px] font-semibold opacity-80">
                {message.authorName} · {ROLE_LABEL[message.authorRole] || 'مشارك'}
              </p>
              <p className="mt-1 text-sm leading-6">{message.body}</p>
            </article>
          );
        })}
      </div>
      <form onSubmit={(event) => void onSubmit(event)} className="mt-3 space-y-2">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="رسالة أو ملاحظة تربوية"
          className="w-full rounded-xl border border-slate-200 p-3 text-sm"
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          className="rounded-xl bg-[#2E7D8E] px-4 py-2 text-sm font-bold text-white"
        >
          إرسال في الغرفة
        </button>
      </form>
    </section>
  );
}

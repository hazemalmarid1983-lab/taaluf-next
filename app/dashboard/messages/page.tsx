'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  loadMessagesLocal,
  saveMessagesLocal,
  type ChatMessage,
} from '@/lib/messagesStore';

export default function MessagesPage() {
  const { data: session } = useSession();
  const [childId, setChildId] = useState('child_local');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = session?.user?.id || '';
  const myRole = session?.user?.role || 'specialist';

  useEffect(() => {
    try {
      const active = JSON.parse(
        localStorage.getItem('taaluf.activeStudent') || 'null'
      );
      if (active?.id) setChildId(active.id);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const local = loadMessagesLocal(childId);
    setMessages(local);
    fetch(`/api/messages?childId=${encodeURIComponent(childId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.messages) && d.messages.length) {
          setMessages(d.messages);
          saveMessagesLocal([
            ...loadMessagesLocal().filter((m) => m.childId !== childId),
            ...d.messages,
          ]);
        }
      })
      .catch(() => undefined);
  }, [childId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId,
          body,
          to: myRole === 'parent' ? 'specialist' : 'parent',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الإرسال');
      const msg = data.message as ChatMessage;
      const next = [...messages, msg];
      setMessages(next);
      saveMessagesLocal([
        ...loadMessagesLocal().filter((m) => m.childId !== childId),
        ...next,
      ]);
      setText('');
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const isMine = (m: ChatMessage) =>
    m.from === myId ||
    (myRole === 'parent' && m.fromRole === 'parent') ||
    (myRole !== 'parent' && m.fromRole === 'specialist');

  return (
    <section className="mx-auto flex h-[70vh] max-w-2xl flex-col rounded-3xl border border-emerald-100 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-emerald-50 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2D8B5A] text-sm font-bold text-white">
          أ
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#0b1f14]">
            {myRole === 'parent' ? 'الأخصائي التربوي' : 'ولي الأمر'}
          </h1>
          <p className="text-xs text-slate-400">محادثة حول الطفل</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400">
            لا رسائل بعد — ابدأ المحادثة.
          </p>
        )}
        {messages.map((m) => {
          const mine = isMine(m);
          return (
            <div
              key={m.id}
              className={mine ? 'flex justify-start' : 'flex justify-end'}
            >
              <div
                className={
                  mine
                    ? 'max-w-[80%] rounded-2xl rounded-br-md bg-[#2D8B5A] px-4 py-2 text-sm text-white'
                    : 'max-w-[80%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2 text-sm text-slate-800'
                }
              >
                <p className="leading-7">{m.body}</p>
                <p
                  className={
                    mine
                      ? 'mt-1 text-[10px] text-emerald-100'
                      : 'mt-1 text-[10px] text-slate-400'
                  }
                >
                  {new Date(m.createdAt).toLocaleString('ar-EG')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-emerald-50 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send();
          }}
          placeholder="اكتب رسالة…"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <Button disabled={busy || !text.trim()} onClick={send}>
          إرسال
        </Button>
      </div>
    </section>
  );
}

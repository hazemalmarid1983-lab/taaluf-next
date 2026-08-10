'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PortalRole } from '@/lib/access';
import { MERHID_NAME } from '@/lib/merhid';
import { MessageCircle } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; text: string };

const SCOPE_HINT: Record<string, string> = {
  admin: 'وضع حر — مساعدة تشغيل وصياغة ودعم المنصة',
  specialist: 'مقيد بمسار التقييم والأهداف والتقارير فقط',
  parent: 'مقيد بشرح النتيجة والأنشطة المنزلية فقط',
};

export default function MerhidChat({
  scope,
  compact = false,
}: {
  scope: PortalRole | 'admin';
  compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      text: `مرحباً، أنا ${MERHID_NAME}. ${SCOPE_HINT[scope] || ''}`,
    },
  ]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setBusy(true);
    try {
      const res = await fetch('/api/ai/merhid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, scope }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: data.reply || data.message || 'تعذر الرد الآن',
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'تعذر الاتصال بالمرشد حالياً.' },
      ]);
    } finally {
      setBusy(false);
    }
  };

  if (compact && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full bg-[#2D8B5A] px-4 py-3 text-sm font-semibold text-white shadow-lg"
      >
        <MessageCircle className="h-4 w-4" />
        {MERHID_NAME}
      </button>
    );
  }

  return (
    <div
      className={
        compact
          ? 'fixed bottom-5 left-5 z-40 flex h-[420px] w-[min(100%-2rem,360px)] flex-col rounded-3xl border border-emerald-100 bg-white shadow-2xl'
          : 'flex h-[420px] flex-col rounded-3xl border border-emerald-100 bg-white'
      }
    >
      <div className="flex items-center justify-between border-b border-emerald-50 px-4 py-3">
        <div>
          <p className="font-bold text-[#2D8B5A]">{MERHID_NAME}</p>
          <p className="text-[11px] text-slate-400">{SCOPE_HINT[scope]}</p>
        </div>
        {compact && (
          <button
            type="button"
            className="text-xs text-slate-400"
            onClick={() => setOpen(false)}
          >
            إغلاق
          </button>
        )}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={
              m.role === 'user'
                ? 'mr-6 rounded-2xl bg-[#2D8B5A] px-3 py-2 text-white'
                : 'ml-4 rounded-2xl bg-[#F0F9F4] px-3 py-2 text-slate-700'
            }
          >
            {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-emerald-50 p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب سؤالك…"
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          إرسال
        </Button>
      </form>
    </div>
  );
}

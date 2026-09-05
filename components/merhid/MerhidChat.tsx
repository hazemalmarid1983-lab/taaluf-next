'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PortalRole } from '@/lib/access';
import { useLanguage } from '@/components/LanguageProvider';
import { MessageCircle } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; text: string };

export default function MerhidChat({
  scope,
  compact = false,
  embedded = false,
  hubDirectives,
}: {
  scope: PortalRole | 'admin';
  compact?: boolean;
  embedded?: boolean;
  hubDirectives?: string;
}) {
  const { t, dir } = useLanguage();
  const merhidName = t('merhidName');
  const hint =
    scope === 'admin'
      ? t('merhidHintAdmin')
      : scope === 'scientific_advisor'
        ? t('merhidHintAdvisor')
        : scope === 'specialist'
          ? t('merhidHintSpecialist')
          : t('merhidHintParent');
  const [open, setOpen] = useState(!compact || embedded);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      text: t('merhidHello', { name: merhidName, hint }),
    },
  ]);

  useEffect(() => {
    setMessages((current) => {
      if (current.length === 1 && current[0].role === 'assistant') {
        return [{ role: 'assistant', text: t('merhidHello', { name: merhidName, hint }) }];
      }
      return current;
    });
  }, [merhidName, hint, t]);

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
        body: JSON.stringify({ message: text, scope, hubDirectives }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: data.reply || data.message || t('loading'),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: t('loading') },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const align = dir === 'rtl' ? 'text-right' : 'text-left';

  if (compact && !embedded && !open) {
    return (
      <button
        type="button"
        dir={dir}
        onClick={() => setOpen(true)}
        className="fixed bottom-5 start-5 z-40 flex items-center gap-2 rounded-full bg-[#2E7D8E] px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-xl print:hidden"
      >
        <MessageCircle className="h-4 w-4" />
        {merhidName}
      </button>
    );
  }

  return (
    <div
      dir={dir}
      className={
        embedded
          ? `flex h-[380px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm ${align}`
          : compact
          ? `fixed bottom-5 start-5 z-40 flex h-[420px] w-[min(100%-2rem,360px)] flex-col rounded-3xl border border-white/90 bg-white/85 shadow-2xl backdrop-blur-xl print:hidden ${align}`
          : `flex h-[420px] flex-col rounded-3xl border border-white/90 bg-white/85 backdrop-blur-xl ${align}`
      }
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="font-bold text-[#2E7D8E]">{merhidName}</p>
          <p className="text-[11px] text-slate-400">{hint}</p>
        </div>
        {compact && !embedded && (
          <button
            type="button"
            className="text-xs text-slate-400"
            onClick={() => setOpen(false)}
          >
            {t('merhidClose')}
          </button>
        )}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            dir={dir}
            className={
              m.role === 'user'
                ? `rounded-2xl bg-[#2E7D8E] px-3 py-2 text-white ${align}`
                : `rounded-2xl bg-amber-50 px-3 py-2 text-slate-700 ${align}`
            }
          >
            {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('merhidPlaceholder')}
          disabled={busy}
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          {t('merhidSend')}
        </Button>
      </form>
    </div>
  );
}

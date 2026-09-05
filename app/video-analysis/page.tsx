'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AI_OUTPUT_PREFIX_AR } from '@/lib/legalContent';
import { useLanguage } from '@/components/LanguageProvider';

export default function VideoAnalysisPage() {
  const { t } = useLanguage();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [analysis, setAnalysis] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    setAnalysis('');
    try {
      const res = await fetch('/api/video/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر التحليل');
      setAnalysis(data.analysis || '');
      setMsg(data.source === 'gemini' ? 'تحليل عبر Gemini' : 'تحليل توجيهي محلي');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'تعذر التحليل');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-sm font-semibold text-[#2E7D8E]">المرحلة الثانية</p>
      <h1 className="font-heading mt-1 text-2xl font-bold text-[#1F2A37]">
        {t('videoAnalysis')}
      </h1>
      <p className="mt-2 text-sm leading-7 text-[#6B7280]">
        {AI_OUTPUT_PREFIX_AR} ارفع ملاحظاتك عن مقطع قصير في المنزل. رفع الملف
        الكامل يُفعَّل بعد ضبط التخزين. يلزم موافقة تحليل الفيديو.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <textarea
          required
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="w-full rounded-2xl border border-[#2E7D8E]/20 p-3 text-sm"
          placeholder="صف ما يظهر في المقطع: اللعب، التواصل، الحركة…"
        />
        <Button type="submit" disabled={busy}>
          {busy ? 'جاري التحليل…' : 'تحليل تربوي'}
        </Button>
      </form>
      {msg && <p className="mt-3 text-sm text-[#2E7D8E]">{msg}</p>}
      {analysis && (
        <article className="mt-5 rounded-3xl border border-[#E5B86E]/40 bg-white p-5 text-sm leading-8 text-[#1F2A37]">
          {analysis}
        </article>
      )}
    </main>
  );
}

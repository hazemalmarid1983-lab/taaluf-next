'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  PARENT_ITEMS,
  PARENT_SCALE,
  mapParentToCriteria,
} from '@/lib/parentAssessment';

const PAGE_SIZE = 4;

export default function ParentAssessmentPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const totalPages = Math.ceil(PARENT_ITEMS.length / PAGE_SIZE);
  const pageItems = useMemo(
    () => PARENT_ITEMS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [page]
  );
  const answeredCount = PARENT_ITEMS.filter((i) => answers[i.id] != null).length;
  const progress = Math.round((answeredCount / PARENT_ITEMS.length) * 100);
  const pageComplete = pageItems.every((i) => answers[i.id] != null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('taaluf.parentAssessment.draft');
      if (raw) setAnswers(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'taaluf.parentAssessment.draft',
      JSON.stringify(answers)
    );
  }, [answers]);

  const finish = async () => {
    setBusy(true);
    setMsg('تم! جاري التحليل...');
    try {
      let childId = 'child_local';
      try {
        const active = JSON.parse(
          localStorage.getItem('taaluf.activeStudent') || 'null'
        );
        if (active?.id) childId = active.id;
      } catch {
        /* ignore */
      }

      const list = PARENT_ITEMS.map((i) => ({
        id: i.id,
        value: Number(answers[i.id] ?? 0),
      }));
      const mappedScores = mapParentToCriteria(list);

      const res = await fetch('/api/parent-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, answers: list }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحفظ');

      const storeKey = 'taaluf.parentAssessment.v1';
      const prev = JSON.parse(localStorage.getItem(storeKey) || '[]');
      localStorage.setItem(
        storeKey,
        JSON.stringify(
          [
            {
              id: data.id,
              childId,
              answers: list,
              mappedScores: data.mappedScores || mappedScores,
              savedAt: data.savedAt,
            },
            ...prev,
          ].slice(0, 40)
        )
      );
      localStorage.removeItem('taaluf.parentAssessment.draft');

      setTimeout(() => {
        router.push('/dashboard/assessments/new');
      }, 900);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'تعذر الحفظ');
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <div
        role="alert"
        className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold leading-7 text-amber-950"
      >
        هذا الاستبيان تقييم تربوي مساعد وليس تشخيصاً طبياً
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-white p-6">
        <p className="text-sm font-semibold text-[#2D8B5A]">
          استبيان الأهل · صفحة {page + 1} من {totalPages}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#0b1f14]">
          ملاحظات يومية عن الطفل
        </h1>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-50">
          <div
            className="h-full rounded-full bg-[#2D8B5A] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">{progress}% مكتمل</p>
      </div>

      <div className="space-y-4">
        {pageItems.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl border border-emerald-100 bg-white p-5"
          >
            <p className="text-sm font-medium leading-7 text-slate-800">
              {item.text}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {PARENT_SCALE.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [item.id]: opt.value }))
                  }
                  className={
                    answers[item.id] === opt.value
                      ? 'rounded-xl bg-[#2D8B5A] px-2 py-2 text-xs font-semibold text-white'
                      : 'rounded-xl border border-slate-200 px-2 py-2 text-xs text-slate-600 hover:border-[#2D8B5A]'
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between gap-3">
        <Button
          variant="ghost"
          disabled={page === 0 || busy}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          السابق
        </Button>
        {page >= totalPages - 1 ? (
          <Button
            disabled={!pageComplete || answeredCount < PARENT_ITEMS.length || busy}
            onClick={finish}
          >
            {busy ? 'جاري التحليل…' : 'إنهاء وحفظ'}
          </Button>
        ) : (
          <Button disabled={!pageComplete || busy} onClick={() => setPage((p) => p + 1)}>
            التالي
          </Button>
        )}
      </div>
      {msg && <p className="text-center text-sm text-[#2D8B5A]">{msg}</p>}
    </section>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { hasActiveParentQuestionnaire } from '@/lib/assessmentGate';
import {
  PARENT_ITEMS,
  PARENT_SCALE,
  mapParentToCriteria,
} from '@/lib/parentAssessment';
import { localizeParentItem } from '@/lib/i18n/parentAssessmentI18n';
import { PARENT_ROUTES } from '@/lib/parentJourney';

export default function ParentAssessmentPage() {
  const { lang, dir, t } = useLanguage();
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [toast, setToast] = useState('');
  const advancing = useRef(false);

  const item = PARENT_ITEMS[currentIdx] || PARENT_ITEMS[0];
  const localized = localizeParentItem(item, lang);
  const options =
    localized.options.length > 0
      ? localized.options
      : PARENT_SCALE.map((l) => ({
          score: l.value,
          label: l.label,
          description: l.label,
        }));

  useEffect(() => {
    try {
      let childId = '';
      const active = JSON.parse(
        localStorage.getItem('taaluf.activeStudent') || 'null'
      );
      if (active?.id) childId = active.id;

      const gate = hasActiveParentQuestionnaire(childId);
      if (gate.active && gate.reason === 'completed') {
        setToast(gate.message);
        window.setTimeout(() => {
          router.replace('/parent');
        }, 1200);
        return;
      }

      const raw = localStorage.getItem('taaluf.parentAssessment.draft');
      if (raw) {
        const draft = JSON.parse(raw) as Record<string, number>;
        setAnswers(draft);
        const firstOpen = PARENT_ITEMS.findIndex((q) => draft[q.id] == null);
        setCurrentIdx(firstOpen === -1 ? PARENT_ITEMS.length - 1 : firstOpen);
      }
      if (gate.active && gate.reason === 'draft') {
        setToast(gate.message);
      }
    } catch {
      /* ignore */
    }
  }, [router]);

  useEffect(() => {
    localStorage.setItem(
      'taaluf.parentAssessment.draft',
      JSON.stringify(answers)
    );
    localStorage.setItem(
      'taaluf_parent_assessment_answers',
      JSON.stringify(answers)
    );
  }, [answers]);

  const finish = async (finalAnswers: Record<string, number>) => {
    setBusy(true);
    setMsg(t('savingAnalysis'));
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
        value: Number(finalAnswers[i.id] ?? 0),
      }));
      const mappedScores = mapParentToCriteria(list);

      const res = await fetch('/api/parent-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, answers: list }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('saveConsentError'));

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
      router.push(PARENT_ROUTES.games);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('saveConsentError'));
      setBusy(false);
      advancing.current = false;
    }
  };

  const handleSelect = (score: number) => {
    if (busy || advancing.current) return;
    setSelectedScore(score);
    const updated = { ...answers, [item.id]: score };
    setAnswers(updated);

    advancing.current = true;
    window.setTimeout(() => {
      if (currentIdx < PARENT_ITEMS.length - 1) {
        setCurrentIdx((prev) => prev + 1);
        setSelectedScore(null);
        advancing.current = false;
        window.scrollTo(0, 0);
      } else {
        void finish(updated);
        window.scrollTo(0, 0);
      }
    }, 120);
  };

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F5F9] font-bold text-slate-500">
        {t('loadingAssessment')}
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-[#F1F5F9] px-4 py-8 text-slate-900 ${
        dir === 'rtl' ? 'text-right' : 'text-left'
      }`}
      dir={dir}
    >
      <div className="pointer-events-none absolute right-10 top-16 h-96 w-96 rounded-full bg-teal-400/20 blur-[60px]" />
      <div className="pointer-events-none absolute bottom-16 left-10 h-96 w-96 rounded-full bg-amber-500/20 blur-[60px]" />

      {toast && (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-[60] w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-950 shadow-lg"
        >
          {toast}
        </div>
      )}

      <div className="relative z-10 my-4 w-full max-w-3xl space-y-5">
        <div className="space-y-3 rounded-3xl border border-white/90 bg-white/85 p-6 text-center shadow-xl backdrop-blur-md sm:p-8">
          <div className="flex items-center justify-between text-xs font-bold sm:text-sm">
            <span className="rounded-full border border-[#2E7D8E]/20 bg-[#2E7D8E]/10 px-4 py-1.5 text-[#2E7D8E]">
              {localized.domain}
            </span>
            <span className="text-slate-500">
              {t('itemProgress', {
                current: currentIdx + 1,
                total: PARENT_ITEMS.length,
              })}
            </span>
          </div>

          <h1 className="pt-2 text-2xl font-black leading-snug text-slate-900 sm:text-3xl">
            {localized.question}
          </h1>

          <p className="text-xs text-slate-500 sm:text-sm">{t('chooseChildDesc')}</p>
          <p className="text-[11px] leading-6 text-slate-400">
            {t('educationalDisclaimer')}
          </p>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-[#2E7D8E] transition-all duration-500"
              style={{
                width: `${((currentIdx + 1) / PARENT_ITEMS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-white/90 bg-white/85 p-5 shadow-xl backdrop-blur-md sm:p-6">
          {options.map((opt) => {
            const isSelected =
              selectedScore === opt.score ||
              (selectedScore == null && answers[item.id] === opt.score);
            return (
              <button
                key={opt.score}
                type="button"
                onClick={() => handleSelect(opt.score)}
                disabled={busy}
                className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-start transition-all sm:p-5 ${
                  isSelected
                    ? 'scale-[1.01] border-amber-500 bg-amber-50/90 shadow-md'
                    : 'border-slate-200/80 bg-white/70 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500'
                      : 'border-slate-300'
                  }`}
                >
                  {isSelected && (
                    <span className="block h-2 w-2 rounded-full bg-white" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="text-base font-bold text-slate-900 sm:text-lg">
                    {opt.score} • {opt.label}
                  </div>
                  <div className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {opt.description}
                  </div>
                </div>
              </button>
            );
          })}

          <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs">
            <button
              type="button"
              onClick={() => {
                if (currentIdx > 0) {
                  advancing.current = false;
                  setCurrentIdx((i) => i - 1);
                  setSelectedScore(null);
                  window.scrollTo(0, 0);
                }
              }}
              disabled={currentIdx === 0 || busy}
              className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-30"
            >
              {t('prev')}
            </button>
            <span className="font-bold text-slate-400">
              {t('percentDone', {
                n: Math.round(((currentIdx + 1) / PARENT_ITEMS.length) * 100),
              })}
            </span>
          </div>
        </div>

        {msg ? (
          <p className="text-center text-sm font-bold text-[#2E7D8E]">{msg}</p>
        ) : null}
      </div>
    </div>
  );
}

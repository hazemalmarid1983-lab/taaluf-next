'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { saveGameSession, starsFromRate } from '@/lib/gameSession';

const PROMPTS = [
  { id: 'hands_up', label: 'ارفع يديك للأعلى' },
  { id: 'clap', label: 'صفّق مرتين' },
  { id: 'touch_nose', label: 'المس أنفك' },
  { id: 'wave', label: 'لوّح باليد' },
  { id: 'smile', label: 'ابتسم' },
] as const;

type Trial = {
  promptId: string;
  success: boolean;
  at: string;
};

function PromptIllustration({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 120 120" className="mx-auto h-36 w-36 text-[#2D8B5A]">
      <circle cx="60" cy="60" r="54" fill="#F0F9F4" stroke="currentColor" strokeWidth="2" />
      {id === 'hands_up' && (
        <>
          <path d="M40 70 L40 30 M80 70 L80 30" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <circle cx="40" cy="24" r="6" fill="currentColor" />
          <circle cx="80" cy="24" r="6" fill="currentColor" />
        </>
      )}
      {id === 'clap' && (
        <>
          <path d="M35 55 Q50 35 65 55" fill="none" stroke="currentColor" strokeWidth="6" />
          <path d="M55 55 Q70 35 85 55" fill="none" stroke="currentColor" strokeWidth="6" />
        </>
      )}
      {id === 'touch_nose' && (
        <>
          <circle cx="60" cy="48" r="18" fill="none" stroke="currentColor" strokeWidth="4" />
          <circle cx="60" cy="52" r="4" fill="currentColor" />
          <path d="M90 80 L68 56" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {id === 'wave' && (
        <path
          d="M70 80 C78 60 90 55 95 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}
      {id === 'smile' && (
        <>
          <circle cx="45" cy="50" r="4" fill="currentColor" />
          <circle cx="75" cy="50" r="4" fill="currentColor" />
          <path d="M40 70 Q60 88 80 70" fill="none" stroke="currentColor" strokeWidth="5" />
        </>
      )}
    </svg>
  );
}

type Props = {
  childId?: string;
  onComplete?: (result: {
    score: number;
    trials: Trial[];
    imitationRate: number;
  }) => void;
};

export default function ImitationGame({ childId, onComplete }: Props) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [startedAt, setStartedAt] = useState('');
  const [msg, setMsg] = useState('');

  const prompt = PROMPTS[index];
  const imitationRate = useMemo(() => {
    if (!trials.length) return 0;
    return trials.filter((t) => t.success).length / trials.length;
  }, [trials]);
  const stars = starsFromRate(imitationRate);

  const resolveChildId = () => {
    if (childId) return childId;
    try {
      const s = JSON.parse(localStorage.getItem('taaluf.activeStudent') || 'null');
      return s?.id || 'child_local';
    } catch {
      return 'child_local';
    }
  };

  const mark = async (success: boolean) => {
    const entry: Trial = {
      promptId: prompt.id,
      success,
      at: new Date().toISOString(),
    };
    const nextTrials = [...trials, entry];
    const nextScore = score + (success ? 20 : 0);
    setTrials(nextTrials);
    setScore(nextScore);

    if (index >= PROMPTS.length - 1) {
      setRunning(false);
      setDone(true);
      const rate =
        nextTrials.filter((t) => t.success).length / nextTrials.length;
      const result = {
        score: nextScore,
        trials: nextTrials,
        imitationRate: rate,
      };
      try {
        await saveGameSession({
          childId: resolveChildId(),
          gameCode: 'imitation',
          score: nextScore,
          levelReached: PROMPTS.length,
          metrics: {
            imitationRate: rate,
            linkedCriteria: ['C15', 'C16', 'C11'],
          },
          trials: nextTrials,
          startedAt: startedAt || new Date().toISOString(),
          endedAt: new Date().toISOString(),
        });
        setMsg('تم حفظ جلسة التقليد');
      } catch (err) {
        setMsg(err instanceof Error ? err.message : 'تعذر الحفظ');
      }
      onComplete?.(result);
      return;
    }
    setIndex((i) => i + 1);
  };

  if (done) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center">
        <p className="text-4xl tracking-widest text-amber-400">
          {'★'.repeat(stars)}
          {'☆'.repeat(3 - stars)}
        </p>
        <h3 className="mt-3 text-2xl font-bold text-[#0b1f14]">أحسنت!</h3>
        <p className="mt-2 text-sm text-slate-600">
          النتيجة {score} · معدل التقليد {Math.round(imitationRate * 100)}%
        </p>
        <p className="mt-1 text-xs text-slate-400">
          مرتبط بالمعايير: C15 · C16 · C11
        </p>
        {msg && <p className="mt-3 text-sm text-[#2D8B5A]">{msg}</p>}
        <Button
          className="mt-5"
          variant="outline"
          onClick={() => {
            setDone(false);
            setIndex(0);
            setScore(0);
            setTrials([]);
            setMsg('');
          }}
        >
          إعادة اللعب
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-6">
      <h3 className="text-xl font-bold text-[#0b1f14]">لعبة التقليد</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        يعرض النظام حركة بسيطة، ويسجّل الأخصائي/ولي الأمر نجاح التقليد يدوياً.
      </p>

      {!running ? (
        <Button
          className="mt-5"
          onClick={() => {
            setIndex(0);
            setScore(0);
            setTrials([]);
            setStartedAt(new Date().toISOString());
            setRunning(true);
          }}
        >
          ابدأ التقليد
        </Button>
      ) : (
        <div className="mt-6 space-y-4 text-center">
          <PromptIllustration id={prompt.id} />
          <p className="text-xl font-bold text-[#0b1f14]">{prompt.label}</p>
          <p className="text-xs text-slate-400">
            خطوة {index + 1} من {PROMPTS.length} · النقاط {score}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => mark(true)}>نجح ✓</Button>
            <Button variant="outline" onClick={() => mark(false)}>
              لم ينجح ✗
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

/**
 * تتبع بصري يدوي بواسطة الأخصائي — لا يستخدم تقدير آلي للنظر
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { saveGameSession, starsFromRate } from '@/lib/gameSession';

const LEVEL_DURATION_MS = 12000;
const MAX_LEVEL = 5;

function randomPos() {
  return {
    x: 12 + Math.random() * 76,
    y: 12 + Math.random() * 66,
  };
}

type LevelTrial = {
  level: number;
  tracked: boolean;
  at: string;
};

type Props = {
  childId?: string;
  onComplete?: (result: {
    score: number;
    trackingAccuracy: number;
    levelReached: number;
  }) => void;
};

export default function VisualTracking({ childId, onComplete }: Props) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [pos, setPos] = useState(() => randomPos());
  const [trials, setTrials] = useState<LevelTrial[]>([]);
  const [msg, setMsg] = useState('');
  const answeredRef = useRef(false);
  const scoreRef = useRef(0);
  const trialsRef = useRef<LevelTrial[]>([]);
  const levelRef = useRef(1);
  const startedAtRef = useRef('');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const speed = useMemo(() => Math.max(280, 900 - level * 120), [level]);
  const trackingAccuracy = useMemo(() => {
    if (!trials.length) return 0;
    return trials.filter((t) => t.tracked).length / trials.length;
  }, [trials]);
  const stars = starsFromRate(trackingAccuracy);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    trialsRef.current = trials;
  }, [trials]);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => setPos(randomPos()), speed);
    return () => window.clearInterval(id);
  }, [running, speed]);

  const resolveChildId = () => {
    if (childId) return childId;
    try {
      const s = JSON.parse(localStorage.getItem('taaluf.activeStudent') || 'null');
      return s?.id || 'child_local';
    } catch {
      return 'child_local';
    }
  };

  const finishGame = async (nextTrials: LevelTrial[], nextScore: number, levelReached: number) => {
    setRunning(false);
    setDone(true);
    const accuracy =
      nextTrials.filter((t) => t.tracked).length / Math.max(1, nextTrials.length);
    const result = {
      score: nextScore,
      trackingAccuracy: accuracy,
      levelReached,
    };
    try {
      await saveGameSession({
        childId: resolveChildId(),
        gameCode: 'visual_tracking',
        score: nextScore,
        levelReached,
        metrics: {
          trackingAccuracy: accuracy,
          linkedCriteria: ['C11', 'C12'],
          scoring: 'manual_specialist',
        },
        trials: nextTrials,
        startedAt: startedAtRef.current || new Date().toISOString(),
        endedAt: new Date().toISOString(),
      });
      setMsg('تم حفظ جلسة التتبع البصري');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'تعذر الحفظ');
    }
    onCompleteRef.current?.(result);
  };

  const settleLevel = (tracked: boolean) => {
    if (answeredRef.current || !running) return;
    answeredRef.current = true;

    const currentLevel = levelRef.current;
    const entry: LevelTrial = {
      level: currentLevel,
      tracked,
      at: new Date().toISOString(),
    };
    const nextTrials = [...trialsRef.current, entry];
    const nextScore = scoreRef.current + (tracked ? 10 * currentLevel : 0);
    setTrials(nextTrials);
    setScore(nextScore);
    trialsRef.current = nextTrials;
    scoreRef.current = nextScore;

    if (currentLevel < MAX_LEVEL) {
      setLevel((n) => n + 1);
      return;
    }
    void finishGame(nextTrials, nextScore, currentLevel);
  };

  useEffect(() => {
    if (!running) return undefined;
    answeredRef.current = false;
    const id = window.setTimeout(() => {
      if (!answeredRef.current) settleLevel(false);
    }, LEVEL_DURATION_MS);
    return () => window.clearTimeout(id);
    // settleLevel uses refs — safe across level ticks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, level]);

  if (done) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center">
        <p className="text-4xl tracking-widest text-amber-400">
          {'★'.repeat(stars)}
          {'☆'.repeat(3 - stars)}
        </p>
        <h3 className="mt-3 text-2xl font-bold text-[#0b1f14]">أحسنت!</h3>
        <p className="mt-2 text-sm text-slate-600">
          النتيجة {score} · دقة التتبع {Math.round(trackingAccuracy * 100)}% ·
          المستوى {MAX_LEVEL}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          مرتبط بالمعايير: C11 · C12 — تقييم يدوي من الأخصائي
        </p>
        {msg && <p className="mt-3 text-sm text-[#2D8B5A]">{msg}</p>}
        <Button
          className="mt-5"
          variant="outline"
          onClick={() => {
            setDone(false);
            setLevel(1);
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
      <h3 className="text-xl font-bold text-[#0b1f14]">التتبع البصري</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        نقطة ذهبية تتحرك على الشاشة. راقب نظرة الطفل ثم سجّل يدوياً هل تتبّع أم
        لا — بدون تقدير آلي للنظر.
      </p>

      {!running ? (
        <Button
          className="mt-5"
          onClick={() => {
            setLevel(1);
            setScore(0);
            setTrials([]);
            startedAtRef.current = new Date().toISOString();
            setRunning(true);
          }}
        >
          ابدأ التتبع
        </Button>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="relative h-64 overflow-hidden rounded-2xl bg-[#0b1f14]">
            <div
              className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)] transition-all duration-300"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-between p-3 text-xs text-white/80">
              <span>
                المستوى {level}/{MAX_LEVEL}
              </span>
              <span>النقاط {score}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => settleLevel(true)}>تتبع ✓</Button>
            <Button variant="outline" onClick={() => settleLevel(false)}>
              لم يتتبع ✗
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

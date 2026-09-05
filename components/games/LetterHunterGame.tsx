'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

class HunterAudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  playPop() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      /* ignore */
    }
  }

  playMiss() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      /* ignore */
    }
  }
}

type LetterRound = {
  targetLetter: string;
  targetLetterEn: string;
  gridLetters: string[];
  correctCount: number;
};

const ROUNDS_DATA: LetterRound[] = [
  {
    targetLetter: 'ب',
    targetLetterEn: 'B',
    gridLetters: ['ت', 'ب', 'ث', 'ن', 'ت', 'ب', 'ي', 'ث', 'ب', 'ت', 'ن', 'ب'],
    correctCount: 4,
  },
  {
    targetLetter: 'د',
    targetLetterEn: 'D',
    gridLetters: ['ذ', 'ر', 'د', 'ز', 'د', 'ذ', 'د', 'و', 'ر', 'د', 'ذ', 'ز'],
    correctCount: 4,
  },
  {
    targetLetter: 'س',
    targetLetterEn: 'S',
    gridLetters: ['ش', 'س', 'ص', 'س', 'ض', 'ش', 'س', 'ش', 'س', 'ص', 'ش', 'س'],
    correctCount: 5,
  },
  {
    targetLetter: 'ع',
    targetLetterEn: 'A',
    gridLetters: ['غ', 'ع', 'ف', 'ع', 'غ', 'ق', 'ع', 'غ', 'ع', 'غ', 'ع', 'ف'],
    correctCount: 5,
  },
];

export type VisualDiscriminationMetrics = {
  totalRounds: number;
  accuracyRate: number;
  totalHits: number;
  totalMisses: number;
  averageSearchTimeMs: number;
  linkedDomain: 'dyslexia';
};

function emptyMetrics() {
  return {
    hits: 0,
    misses: 0,
    roundStartedAt: Date.now(),
    searchDurations: [] as number[],
  };
}

export default function LetterHunterGame({
  onFinishGame,
}: {
  childId?: string;
  onFinishGame?: (metrics: VisualDiscriminationMetrics) => void;
}) {
  const { lang, dir } = useLanguage();
  const audioRef = useRef<HunterAudioEngine | null>(null);
  const onFinishRef = useRef(onFinishGame);
  const timerRef = useRef<number | null>(null);
  const metricsRef = useRef(emptyMetrics());
  const foundRef = useRef(0);
  const roundRef = useRef(0);

  const [roundIdx, setRoundIdx] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [foundCount, setFoundCount] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentRound = ROUNDS_DATA[roundIdx];

  useEffect(() => {
    onFinishRef.current = onFinishGame;
  }, [onFinishGame]);

  useEffect(() => {
    audioRef.current = new HunterAudioEngine();
    metricsRef.current.roundStartedAt = Date.now();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const finishGame = () => {
    setIsCompleted(true);
    const totalActions =
      metricsRef.current.hits + metricsRef.current.misses || 1;
    const accuracy = Math.round((metricsRef.current.hits / totalActions) * 100);
    const avgTime = metricsRef.current.searchDurations.length
      ? Math.round(
          metricsRef.current.searchDurations.reduce((a, b) => a + b, 0) /
            metricsRef.current.searchDurations.length
        )
      : 0;
    onFinishRef.current?.({
      totalRounds: ROUNDS_DATA.length,
      accuracyRate: accuracy,
      totalHits: metricsRef.current.hits,
      totalMisses: metricsRef.current.misses,
      averageSearchTimeMs: avgTime,
      linkedDomain: 'dyslexia',
    });
  };

  const handleTileClick = (letter: string, index: number) => {
    if (selectedIndices.includes(index) || isCompleted) return;
    setSelectedIndices((prev) => [...prev, index]);

    if (letter === currentRound.targetLetter) {
      audioRef.current?.playPop();
      metricsRef.current.hits += 1;
      setScore((s) => s + 15);
      foundRef.current += 1;
      setFoundCount(foundRef.current);

      if (foundRef.current >= currentRound.correctCount) {
        metricsRef.current.searchDurations.push(
          Date.now() - metricsRef.current.roundStartedAt
        );
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          if (roundRef.current < ROUNDS_DATA.length - 1) {
            roundRef.current += 1;
            foundRef.current = 0;
            setRoundIdx(roundRef.current);
            setSelectedIndices([]);
            setFoundCount(0);
            metricsRef.current.roundStartedAt = Date.now();
          } else {
            finishGame();
          }
        }, 600);
      }
    } else {
      audioRef.current?.playMiss();
      metricsRef.current.misses += 1;
      setScore((s) => Math.max(0, s - 5));
    }
  };

  const restart = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    metricsRef.current = emptyMetrics();
    foundRef.current = 0;
    roundRef.current = 0;
    setRoundIdx(0);
    setSelectedIndices([]);
    setFoundCount(0);
    setScore(0);
    setIsCompleted(false);
  };

  const accuracyNow = Math.round(
    (metricsRef.current.hits /
      (metricsRef.current.hits + metricsRef.current.misses || 1)) *
      100
  );

  return (
    <div
      className="relative flex min-h-[76vh] w-full select-none flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#244657] bg-gradient-to-b from-[#13232C] via-[#1B323E] to-[#0E1A22] p-6 font-sans text-white shadow-2xl sm:p-8"
      dir={dir}
    >
      <div className="pointer-events-none absolute right-1/4 top-0 h-80 w-80 rounded-full bg-amber-400/15 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-teal-400/15 blur-[100px]" />

      <div className="relative z-10 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <h3 className="text-sm font-bold text-amber-300">
              {lang === 'ar' ? 'صائد الحروف المتشابهة' : 'Letter Hunter'}
            </h3>
            <p className="text-xs text-slate-300">
              {lang === 'ar'
                ? 'ميّز الحرف الهدف واضغط عليه بأسرع وقت بين المشتتات'
                : 'Spot and tap the target letter among visual distractors'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5">
            {lang === 'ar'
              ? `المرحلة ${roundIdx + 1} من ${ROUNDS_DATA.length}`
              : `Round ${roundIdx + 1} of ${ROUNDS_DATA.length}`}
          </span>
          <span className="rounded-xl border border-amber-400/40 bg-amber-500/30 px-3 py-1.5 font-bold text-amber-300">
            {score}
          </span>
        </div>
      </div>

      <div className="relative z-10 my-4 flex flex-col items-center justify-center space-y-2 text-center">
        <span className="text-xs font-bold text-slate-300">
          {lang === 'ar'
            ? 'ابحث واصطد الحرف التالي في الشبكة:'
            : 'Find and tap this letter in the grid:'}
        </span>
        <div className="flex h-20 w-20 animate-bounce items-center justify-center rounded-2xl border-2 border-amber-400 bg-amber-500/20 text-5xl font-black text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.35)] backdrop-blur-xl">
          {currentRound.targetLetter}
        </div>
        <span className="text-xs font-semibold text-teal-300">
          {lang === 'ar'
            ? `المتبقي اصطياده: ${currentRound.correctCount - foundCount}`
            : `Remaining: ${currentRound.correctCount - foundCount}`}
        </span>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-black/35 p-6 backdrop-blur-md">
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {currentRound.gridLetters.map((letter, idx) => {
            const isSelected = selectedIndices.includes(idx);
            const isTarget = letter === currentRound.targetLetter;
            let tileStyle =
              'bg-white/10 border-white/20 hover:bg-white/20 hover:border-amber-400';
            if (isSelected && isTarget) {
              tileStyle =
                'bg-emerald-500/50 border-emerald-400 scale-105 shadow-[0_0_15px_rgba(52,211,153,0.5)]';
            } else if (isSelected && !isTarget) {
              tileStyle = 'bg-rose-500/40 border-rose-400 opacity-40';
            }
            return (
              <button
                key={`${roundIdx}-${idx}-${letter}`}
                type="button"
                onClick={() => handleTileClick(letter, idx)}
                disabled={isSelected || isCompleted}
                className={`flex h-16 items-center justify-center rounded-2xl border-2 text-3xl font-black shadow-md transition-all duration-200 sm:h-20 sm:text-4xl ${tileStyle}`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {isCompleted && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-amber-500/40 bg-[#152733] p-8 text-center text-white shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/20 text-3xl text-amber-300">
              🏆
            </div>
            <h2 className="text-2xl font-bold text-amber-200">
              {lang === 'ar'
                ? 'ممتاز! اكتمل تحدي صيد الحروف'
                : 'Well done! Letter challenge completed'}
            </h2>
            <div
              className="space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs"
              dir={dir}
            >
              <span className="mb-1 block font-bold text-amber-400">
                {lang === 'ar'
                  ? 'مؤشرات التمييز البصري وسرعة المعالجة القرائية'
                  : 'Visual discrimination and processing speed'}
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {lang === 'ar' ? 'دقة التمييز البصري:' : 'Visual accuracy:'}
                </span>
                <strong className="text-emerald-400">%{accuracyNow}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {lang === 'ar' ? 'الحروف الصحيحة:' : 'Target hits:'}
                </span>
                <strong className="text-white">{metricsRef.current.hits}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {lang === 'ar' ? 'أخطاء المشتتات:' : 'Distractor errors:'}
                </span>
                <strong className="text-rose-400">
                  {metricsRef.current.misses}
                </strong>
              </div>
            </div>
            <button
              type="button"
              onClick={restart}
              className="w-full rounded-xl bg-amber-500 py-3.5 font-bold text-slate-950 shadow-lg transition hover:bg-amber-400"
            >
              {lang === 'ar' ? 'جولة جديدة' : 'Play again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

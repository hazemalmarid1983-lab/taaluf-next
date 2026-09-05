'use client';

import { useEffect, useRef, useState } from 'react';

class MemoryAudioEngine {
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

  playTone(freq: number, duration = 0.2) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + duration
      );
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      /* ignore */
    }
  }

  playSuccess() {
    this.playTone(523.25, 0.15);
    window.setTimeout(() => this.playTone(659.25, 0.2), 150);
  }

  playError() {
    this.playTone(220, 0.3);
  }
}

type TrainCarItem = {
  id: string;
  name: string;
  icon: string;
  color: string;
  freq: number;
};

const CARGO_ITEMS: TrainCarItem[] = [
  {
    id: 'star',
    name: 'نجمة',
    icon: '⭐',
    color: 'border-amber-400 bg-amber-400/20 text-amber-300',
    freq: 440,
  },
  {
    id: 'heart',
    name: 'قلب',
    icon: '❤️',
    color: 'border-rose-400 bg-rose-400/20 text-rose-300',
    freq: 523.25,
  },
  {
    id: 'diamond',
    name: 'جوهرة',
    icon: '💎',
    color: 'border-cyan-400 bg-cyan-400/20 text-cyan-300',
    freq: 587.33,
  },
  {
    id: 'leaf',
    name: 'ورقة',
    icon: '🍀',
    color: 'border-emerald-400 bg-emerald-400/20 text-emerald-300',
    freq: 659.25,
  },
];

export type WorkingMemoryMetrics = {
  maxMemorySpan: number;
  accuracyRate: number;
  totalAttempts: number;
  averageResponseTimeMs: number;
};

type GameState = 'intro' | 'showing' | 'input' | 'feedback' | 'game_over';

const MAX_LEVEL = 5;
const MIN_LEVEL = 2;

function emptyMetrics() {
  return {
    maxSpan: MIN_LEVEL,
    correctCount: 0,
    totalAttempts: 0,
    responseTimes: [] as number[],
    inputStartTime: 0,
  };
}

export default function WorkingMemoryTrainGame({
  onFinishGame,
}: {
  childId?: string;
  onFinishGame?: (metrics: WorkingMemoryMetrics) => void;
}) {
  const audioRef = useRef<MemoryAudioEngine | null>(null);
  const onFinishRef = useRef(onFinishGame);
  const timersRef = useRef<number[]>([]);
  const levelRef = useRef(MIN_LEVEL);
  const metricsRef = useRef(emptyMetrics());

  const [level, setLevel] = useState(MIN_LEVEL);
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>('intro');
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number | null>(
    null
  );
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => {
    onFinishRef.current = onFinishGame;
  }, [onFinishGame]);

  useEffect(() => {
    audioRef.current = new MemoryAudioEngine();
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const startNewRound = (targetLevel: number) => {
    clearTimers();
    const nextLevel = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, targetLevel));
    levelRef.current = nextLevel;
    setLevel(nextLevel);

    const newSeq = Array.from({ length: nextLevel }, () => {
      const item = CARGO_ITEMS[Math.floor(Math.random() * CARGO_ITEMS.length)];
      return item.id;
    });
    setSequence(newSeq);
    setPlayerInput([]);
    setActiveHighlightIndex(null);
    setGameState('showing');

    newSeq.forEach((itemId, idx) => {
      later(() => {
        const item = CARGO_ITEMS.find((c) => c.id === itemId);
        if (item) {
          audioRef.current?.playTone(item.freq, 0.35);
          setActiveHighlightIndex(idx);
        }
      }, (idx + 1) * 900);

      later(() => {
        setActiveHighlightIndex(null);
        if (idx === newSeq.length - 1) {
          later(() => {
            setGameState('input');
            metricsRef.current.inputStartTime = Date.now();
          }, 400);
        }
      }, (idx + 1) * 900 + 600);
    });
  };

  const finishGameSession = () => {
    setGameState('game_over');
    const total = metricsRef.current.totalAttempts || 1;
    const accuracy = Math.round(
      (metricsRef.current.correctCount / total) * 100
    );
    const avgTime = metricsRef.current.responseTimes.length
      ? Math.round(
          metricsRef.current.responseTimes.reduce((a, b) => a + b, 0) /
            metricsRef.current.responseTimes.length
        )
      : 0;

    onFinishRef.current?.({
      maxMemorySpan: metricsRef.current.maxSpan,
      accuracyRate: accuracy,
      totalAttempts: total,
      averageResponseTimeMs: avgTime,
    });
  };

  const handleItemClick = (itemId: string) => {
    if (gameState !== 'input') return;

    const item = CARGO_ITEMS.find((c) => c.id === itemId);
    if (item) audioRef.current?.playTone(item.freq, 0.15);

    const updatedInput = [...playerInput, itemId];
    setPlayerInput(updatedInput);
    const currentStep = updatedInput.length - 1;

    if (updatedInput[currentStep] !== sequence[currentStep]) {
      audioRef.current?.playError();
      metricsRef.current.totalAttempts += 1;
      setGameState('feedback');
      setFeedbackMessage('حاول مرة أخرى! انتبه لترتيب ظهور الصناديق');
      later(() => {
        startNewRound(levelRef.current - 1);
      }, 1500);
      return;
    }

    if (updatedInput.length === sequence.length) {
      const responseTime = Date.now() - metricsRef.current.inputStartTime;
      metricsRef.current.responseTimes.push(responseTime);
      metricsRef.current.correctCount += 1;
      metricsRef.current.totalAttempts += 1;
      if (levelRef.current > metricsRef.current.maxSpan) {
        metricsRef.current.maxSpan = levelRef.current;
      }

      audioRef.current?.playSuccess();
      setScore((s) => s + levelRef.current * 20);
      setGameState('feedback');
      setFeedbackMessage('رائع جداً! استرجاع متقن');

      later(() => {
        if (levelRef.current < MAX_LEVEL) {
          startNewRound(levelRef.current + 1);
        } else {
          finishGameSession();
        }
      }, 1400);
    }
  };

  const restart = () => {
    clearTimers();
    levelRef.current = MIN_LEVEL;
    metricsRef.current = emptyMetrics();
    setLevel(MIN_LEVEL);
    setScore(0);
    setSequence([]);
    setPlayerInput([]);
    setActiveHighlightIndex(null);
    setFeedbackMessage('');
    setGameState('intro');
  };

  const accuracyNow = Math.round(
    (metricsRef.current.correctCount /
      (metricsRef.current.totalAttempts || 1)) *
      100
  );

  return (
    <div
      className="relative flex min-h-[76vh] w-full select-none flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#233A4A] bg-gradient-to-b from-[#111C24] via-[#1A2C38] to-[#0E171E] p-6 font-sans text-white shadow-2xl"
      dir="rtl"
    >
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-amber-500/10 blur-[90px]" />

      <div className="relative z-10 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚂</span>
          <div>
            <h3 className="text-sm font-bold text-cyan-200">
              قطار الذاكرة العاملة
            </h3>
            <p className="text-xs text-slate-300">
              احفظ ترتيب ظهور الرموز على عربات القطار ثم أعد ترتيبها
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5">
            السعة: <strong className="text-cyan-300">{level} عناصر</strong>
          </span>
          <span className="rounded-xl border border-cyan-400/30 bg-cyan-600/40 px-3 py-1.5">
            النقاط: <strong className="text-yellow-300">{score}</strong>
          </span>
        </div>
      </div>

      <div className="relative z-10 my-6 flex flex-col items-center justify-center space-y-6">
        <div
          className={`rounded-full px-6 py-2 text-sm font-bold tracking-wide shadow-lg transition-all duration-300 ${
            gameState === 'showing'
              ? 'animate-pulse bg-amber-500 text-slate-950'
              : gameState === 'input'
                ? 'scale-105 bg-cyan-500 text-slate-950'
                : 'bg-white/10 text-white'
          }`}
        >
          {gameState === 'intro' && 'اضغط على زر الانطلاق لبدء رحلة القطار'}
          {gameState === 'showing' && 'انتبه جيداً وركز في ترتيب ظهور الرموز'}
          {gameState === 'input' &&
            `دورك الآن: اضغط على الرموز بنفس الترتيب (${playerInput.length}/${sequence.length})`}
          {gameState === 'feedback' && feedbackMessage}
        </div>

        <div className="flex max-w-full items-center justify-center gap-3 overflow-x-auto p-4 min-h-[110px]">
          <div className="text-4xl">🚂</div>
          {sequence.map((itemId, idx) => {
            const isRevealed =
              gameState === 'showing' && activeHighlightIndex === idx;
            const isEntered = playerInput.length > idx;
            const enteredItem = isEntered
              ? CARGO_ITEMS.find((c) => c.id === playerInput[idx])
              : null;

            return (
              <div
                key={`${itemId}-${idx}`}
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-3xl shadow-md transition-all duration-300 sm:h-20 sm:w-20 ${
                  isRevealed
                    ? 'scale-110 border-amber-300 bg-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                    : isEntered
                      ? 'border-cyan-400 bg-cyan-500/20'
                      : 'border-dashed border-white/20 bg-white/5 opacity-50'
                }`}
              >
                {isRevealed && CARGO_ITEMS.find((c) => c.id === itemId)?.icon}
                {!isRevealed && isEntered && enteredItem?.icon}
                {!isRevealed && !isEntered && '?'}
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
        {gameState === 'intro' ? (
          <div className="py-2 text-center">
            <button
              type="button"
              onClick={() => startNewRound(level)}
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-10 py-3.5 text-base font-black text-slate-950 shadow-xl transition-all hover:scale-105 hover:from-cyan-600 hover:to-teal-600 active:scale-95"
            >
              انطلاق القطار
            </button>
          </div>
        ) : (
          <div className="mx-auto grid max-w-md grid-cols-4 gap-3">
            {CARGO_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                disabled={gameState !== 'input'}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 py-3.5 shadow-md transition-all ${
                  gameState === 'input'
                    ? `${item.color} hover:scale-105 active:scale-95`
                    : 'cursor-not-allowed border-transparent bg-white/5 opacity-30'
                }`}
              >
                <span className="text-3xl">{item.icon}</span>
                <span className="text-xs font-bold">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {gameState === 'game_over' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-cyan-500/40 bg-[#16252F] p-8 text-center text-white shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 text-3xl text-cyan-300">
              🧠
            </div>
            <h2 className="text-2xl font-bold text-cyan-200">
              أحسنت! اكتملت جولة الذاكرة
            </h2>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-right text-xs">
              <span className="mb-1 block font-bold text-cyan-400">
                مؤشرات الاسترجاع وسرعة المعالجة:
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400">أطول تسلسل صحيح:</span>
                <strong className="text-white">
                  {metricsRef.current.maxSpan} عناصر متتالية
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">معدل دقة الاسترجاع:</span>
                <strong className="text-emerald-400">%{accuracyNow}</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={restart}
              className="w-full rounded-xl bg-cyan-600 py-3.5 font-bold text-slate-950 shadow-lg transition hover:bg-cyan-500"
            >
              جولة جديدة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  FRIEND_FEEDER_GAME_CODE,
  FRIEND_FEEDER_TOTAL_ROUNDS,
  buildFriendFeederMetrics,
  type FriendFeederMetrics,
} from '@/lib/friendFeeder';
import { saveGameSession, starsFromRate } from '@/lib/gameSession';

class ForestAudioEngine {
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

  playMunch() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        140,
        this.ctx.currentTime + 0.15
      );
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + 0.15
      );
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      /* ignore */
    }
  }

  playTurnTone(isFriendTurn: boolean) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(
        isFriendTurn ? 350 : 587.33,
        this.ctx.currentTime
      );
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      /* ignore */
    }
  }
}

type FoodItem = {
  id: string;
  name: string;
  icon: string;
};

const FOODS: FoodItem[] = [
  { id: 'apple', name: 'تفاحة حمراء', icon: '🍎' },
  { id: 'carrot', name: 'جزرة طازجة', icon: '🥕' },
  { id: 'acorn', name: 'بلوط مقرمش', icon: '🌰' },
  { id: 'berry', name: 'توت أزرق', icon: '🫐' },
];

function pickFood() {
  return FOODS[Math.floor(Math.random() * FOODS.length)];
}

function resolveChildId(childId?: string) {
  if (childId) return childId;
  try {
    const s = JSON.parse(
      localStorage.getItem('taaluf.activeStudent') || 'null'
    );
    return s?.id || 'child_local';
  } catch {
    return 'child_local';
  }
}

export type TurnTakingMetrics = FriendFeederMetrics;

type Props = {
  childId?: string;
  onFinishGame?: (metrics: FriendFeederMetrics) => void;
};

export default function FriendFeederGame({ childId, onFinishGame }: Props) {
  const audioRef = useRef<ForestAudioEngine | null>(null);
  const onFinishRef = useRef(onFinishGame);
  const roundRef = useRef(1);
  const friendImpulseRef = useRef(0);
  const chewTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef(new Date().toISOString());
  const metricsRef = useRef({ impulsiveClicks: 0, successfulWaits: 0 });
  const scoreRef = useRef(0);

  const [currentRound, setCurrentRound] = useState(1);
  const [currentTurn, setCurrentTurn] = useState<'child' | 'friend'>('child');
  const [characterState, setCharacterState] = useState<
    'idle' | 'chewing' | 'happy'
  >('idle');
  const [requestedFood, setRequestedFood] = useState<FoodItem>(FOODS[0]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<FriendFeederMetrics | null>(null);
  const [msg, setMsg] = useState('');
  const [session, setSession] = useState(0);

  useEffect(() => {
    onFinishRef.current = onFinishGame;
  }, [onFinishGame]);

  useEffect(() => {
    audioRef.current = new ForestAudioEngine();
    startedAtRef.current = new Date().toISOString();
    roundRef.current = 1;
    metricsRef.current = { impulsiveClicks: 0, successfulWaits: 0 };
    scoreRef.current = 0;
    setRequestedFood(pickFood());
    return () => {
      if (chewTimerRef.current) window.clearTimeout(chewTimerRef.current);
    };
  }, [session]);

  const finishGame = async () => {
    const built = buildFriendFeederMetrics({
      successfulWaits: metricsRef.current.successfulWaits,
      impulsiveClicks: metricsRef.current.impulsiveClicks,
    });
    setResult(built);
    setIsGameOver(true);
    onFinishRef.current?.(built);
    try {
      await saveGameSession({
        childId: resolveChildId(childId),
        gameCode: FRIEND_FEEDER_GAME_CODE,
        score: scoreRef.current,
        levelReached: FRIEND_FEEDER_TOTAL_ROUNDS,
        metrics: built,
        trials: [],
        startedAt: startedAtRef.current,
        endedAt: new Date().toISOString(),
      });
      setMsg('تم حفظ جلسة إطعام صديق الغابة');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'تعذر الحفظ');
    }
  };

  useEffect(() => {
    if (currentTurn !== 'friend' || isGameOver) return undefined;
    audioRef.current?.playTurnTone(true);
    setCharacterState('happy');
    friendImpulseRef.current = 0;
    const timer = window.setTimeout(() => {
      audioRef.current?.playMunch();
      if (friendImpulseRef.current === 0) {
        metricsRef.current.successfulWaits += 1;
      }
      if (roundRef.current < FRIEND_FEEDER_TOTAL_ROUNDS) {
        roundRef.current += 1;
        setCurrentRound(roundRef.current);
        setRequestedFood(pickFood());
        setCurrentTurn('child');
        setCharacterState('idle');
        audioRef.current?.playTurnTone(false);
      } else {
        void finishGame();
      }
    }, 3200);
    return () => window.clearTimeout(timer);
    // finishGame reads refs; timer should restart only when the friend turn begins
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurn, isGameOver]);

  const handleFeedChildChoice = (food: FoodItem) => {
    if (isGameOver) return;
    if (currentTurn !== 'child') {
      metricsRef.current.impulsiveClicks += 1;
      friendImpulseRef.current += 1;
      return;
    }
    if (food.id !== requestedFood.id) return;

    audioRef.current?.playMunch();
    setCharacterState('chewing');
    setScore((s) => {
      const next = s + 15;
      scoreRef.current = next;
      return next;
    });
    if (chewTimerRef.current) window.clearTimeout(chewTimerRef.current);
    chewTimerRef.current = window.setTimeout(() => {
      setCurrentTurn('friend');
    }, 1000);
  };

  const stars = starsFromRate(result?.turnTakingAccuracy ?? 0);

  return (
    <div
      className="relative flex min-h-[76vh] w-full select-none flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#3D7055] bg-gradient-to-b from-[#1E3A2F] via-[#2D5A43] to-[#1B3022] p-6 font-sans text-white shadow-2xl"
      dir="rtl"
    >
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐿️</span>
          <div>
            <h3 className="text-sm font-bold text-emerald-200">
              إطعام صديق الغابة
            </h3>
            <p className="text-xs text-gray-300">
              أطعم السنجاب عندما يأتي دورك، وانتظر دور صديقك الأرنب!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5">
            الجولة:{' '}
            <strong className="text-emerald-300">
              {currentRound} / {FRIEND_FEEDER_TOTAL_ROUNDS}
            </strong>
          </span>
          <span className="rounded-xl border border-emerald-400/30 bg-emerald-600/60 px-3 py-1.5">
            النقاط: <strong className="text-yellow-300">{score}</strong>
          </span>
        </div>
      </div>

      <div className="relative my-4 flex flex-col items-center justify-center">
        <div
          className={`mb-4 rounded-full px-6 py-2 text-sm font-bold tracking-wide shadow-lg transition-all duration-300 ${
            currentTurn === 'child'
              ? 'scale-105 animate-pulse bg-amber-500 text-gray-950'
              : 'bg-indigo-600 text-white'
          }`}
        >
          {currentTurn === 'child'
            ? 'الآن دورك أنت: اختر الطعام المناسب!'
            : 'الآن دور الصديق: انتظر حتى ينتهي...'}
        </div>

        <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-4 border-emerald-500/40 bg-emerald-800/40 shadow-inner sm:h-52 sm:w-52">
          <div className="text-7xl transition-transform duration-300 sm:text-8xl">
            {characterState === 'chewing'
              ? '😋'
              : characterState === 'happy'
                ? '🐰'
                : '🐿️'}
          </div>
          {currentTurn === 'child' && (
            <div className="absolute -right-4 -top-4 flex animate-bounce items-center gap-2 rounded-2xl border-2 border-amber-400 bg-white px-4 py-2 font-bold text-gray-900 shadow-xl">
              <span className="text-xs">أريد:</span>
              <span className="text-2xl">{requestedFood.icon}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
        <span className="mb-2 block text-center text-xs font-bold text-gray-300">
          {currentTurn === 'child'
            ? 'اضغط على الطعام الذي طلبه صديقك:'
            : 'الأطعمة مقفلة مؤقتاً أثناء دور الصديق'}
        </span>
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-3">
          {FOODS.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => handleFeedChildChoice(food)}
              disabled={currentTurn !== 'child'}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 py-3 shadow-md transition-all ${
                currentTurn === 'child'
                  ? 'border-white/20 bg-white/10 hover:bg-white/20 hover:border-emerald-400 active:scale-95'
                  : 'cursor-not-allowed border-transparent bg-black/20 opacity-40'
              }`}
            >
              <span className="text-3xl">{food.icon}</span>
              <span className="text-[11px] font-bold text-gray-200">{food.name}</span>
            </button>
          ))}
        </div>
      </div>

      {isGameOver && result && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-emerald-500/40 bg-[#1C3326] p-8 text-center text-white shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-3xl text-emerald-300">
              🎉
            </div>
            <p className="text-2xl tracking-widest text-amber-300">
              {'★'.repeat(stars)}
              {'☆'.repeat(3 - stars)}
            </p>
            <h2 className="text-2xl font-bold text-emerald-200">
              رائع! أتممت جولات المشاركة
            </h2>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-right text-xs">
              <span className="mb-1 block font-bold text-emerald-400">
                رصد تربوي — تبادل الأدوار والانتظار (C18 · C19)
              </span>
              <div className="flex justify-between">
                <span className="text-gray-400">
                  الالتزام بتبادل الأدوار والانتظار:
                </span>
                <strong className="text-white">%{result.turnTakingRate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">
                  محاولات الضغط أثناء دور الآخر:
                </span>
                <strong className="text-amber-300">
                  {result.impulsiveClicksDuringFriendTurn} محاولات
                </strong>
              </div>
              <p className="pt-2 leading-6 text-gray-400">
                مؤشر تربوي مساند، وليس تشخيصاً طبياً.
              </p>
            </div>
            {msg && <p className="text-sm text-emerald-200">{msg}</p>}
            <button
              type="button"
              onClick={() => {
                setCurrentRound(1);
                setCurrentTurn('child');
                setCharacterState('idle');
                setScore(0);
                scoreRef.current = 0;
                setIsGameOver(false);
                setResult(null);
                setMsg('');
                setSession((n) => n + 1);
              }}
              className="w-full rounded-xl bg-[#2E7D8E] py-3.5 font-bold text-white shadow-lg transition hover:bg-[#256675]"
            >
              العب جولة جديدة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

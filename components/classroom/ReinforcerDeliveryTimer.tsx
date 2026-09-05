'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ScheduleReward } from '@/lib/scheduleRewards';
import {
  HOME_SCHEDULE_REWARDS,
  isSensoryScheduleReward,
  sensoryRoomHrefFromReward,
  stashSensoryReinforcerHandoff,
} from '@/lib/scheduleRewards';
import {
  formatReinforcerClock,
  REINFORCER_DURATION_MINUTES,
  reinforcerCelebrationLine,
  reinforcerDeliveryPhrase,
  type ReinforcerDurationMinutes,
} from '@/lib/reinforcerDelivery';
import { RewardAudio, speakText, stopSpeaking } from '@/lib/sensoryAudio';

const RING_RADIUS = 58;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * بطاقة احتفالية هادئة + مؤقت بصري لصرف المعزز بعد انتهاء المحاولات.
 */
export default function ReinforcerDeliveryTimer({
  reward: initialReward,
  soundOn = true,
  isAr,
  onComplete,
  onRewardChange,
  onOpenSensoryRoom,
  className,
}: {
  reward?: ScheduleReward | null;
  soundOn?: boolean;
  isAr: boolean;
  onComplete?: () => void;
  onRewardChange?: (reward: ScheduleReward) => void;
  onOpenSensoryRoom?: (href: string, totalSec: number) => void;
  className?: string;
}) {
  const router = useRouter();
  const [reward, setReward] = useState<ScheduleReward>(
    initialReward || HOME_SCHEDULE_REWARDS.find((item) => item.id === 'hug')!
  );
  const [minutes, setMinutes] = useState<ReinforcerDurationMinutes>(2);
  const [totalSec, setTotalSec] = useState(2 * 60);
  const [leftSec, setLeftSec] = useState(2 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const audioRef = useRef(new RewardAudio());
  const deadlineRef = useRef(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialReward) setReward(initialReward);
  }, [initialReward]);

  const applyDuration = (next: ReinforcerDurationMinutes) => {
    setMinutes(next);
    const sec = next * 60;
    setTotalSec(sec);
    setLeftSec(sec);
    setRunning(false);
    setFinished(false);
    deadlineRef.current = 0;
  };

  const clearTick = () => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  useEffect(() => () => {
    clearTick();
    stopSpeaking();
  }, []);

  const announceComplete = useCallback(() => {
    setFinished(true);
    setRunning(false);
    if (soundOn) {
      audioRef.current.playChime();
      speakText(
        isAr
          ? `انتهى وقت المعزّز. ${reinforcerDeliveryPhrase(reward, true)}`
          : `Reward time is over. ${reinforcerDeliveryPhrase(reward, false)}`,
        { lang: isAr ? 'ar' : 'en', rate: 0.78 }
      );
    }
    onComplete?.();
  }, [isAr, onComplete, reward, soundOn]);

  useEffect(() => {
    if (!running) {
      clearTick();
      return undefined;
    }

    tickRef.current = window.setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000)
      );
      setLeftSec(remaining);
      if (remaining <= 0) {
        clearTick();
        announceComplete();
      }
    }, 250);

    return clearTick;
  }, [running, announceComplete]);

  const startTimer = () => {
    if (finished) {
      applyDuration(minutes);
    }
    deadlineRef.current = Date.now() + leftSec * 1000;
    setRunning(true);
    if (soundOn) {
      speakText(reinforcerDeliveryPhrase(reward, isAr), {
        lang: isAr ? 'ar' : 'en',
        rate: 0.8,
      });
    }
  };

  const pauseTimer = () => {
    if (running) {
      setLeftSec(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    }
    setRunning(false);
  };

  const pickReward = (next: ScheduleReward) => {
    setReward(next);
    onRewardChange?.(next);
  };

  const openSensoryRoom = () => {
    if (!isSensoryScheduleReward(reward)) return;
    const href = sensoryRoomHrefFromReward(reward);
    const sec = running
      ? Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
      : leftSec > 0
        ? leftSec
        : totalSec;
    stashSensoryReinforcerHandoff({ href, totalSec: sec });
    if (onOpenSensoryRoom) {
      onOpenSensoryRoom(href, sec);
      return;
    }
    router.push(href);
  };

  const progress = totalSec > 0 ? leftSec / totalSec : 0;
  const dashOffset = RING_LENGTH * (1 - progress);

  return (
    <div
      className={`space-y-5 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/95 via-white to-emerald-50/80 p-5 shadow-[0_16px_48px_rgba(229,184,110,0.12)] sm:p-6 ${className || ''}`}
    >
      <div className="text-center">
        <span className="text-4xl leading-none">{reward.emoji}</span>
        <h3 className="mt-2 text-lg font-black text-[#0b1f14] sm:text-xl">
          {reinforcerCelebrationLine(reward, isAr)}
        </h3>
        <p className="mt-1 text-[11px] leading-6 text-amber-800/80">
          {isAr
            ? 'سلّمي المعزّز كما وعدتِ في لوحة «ثم»، واتركي للطفل وقته المحدد للاستمتاع.'
            : 'Deliver the promised “Then” reward and give the child their full reward window.'}
        </p>
      </div>

      {!initialReward && (
        <div className="flex flex-wrap justify-center gap-2">
          {HOME_SCHEDULE_REWARDS.slice(0, 6).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => pickReward(item)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-bold transition active:scale-95 ${
                reward.id === item.id
                  ? 'border-amber-400 bg-amber-100 text-amber-900'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <span>{item.emoji}</span>
              <span>{isAr ? item.labelAr : item.labelEn}</span>
            </button>
          ))}
        </div>
      )}

      {isSensoryScheduleReward(reward) && (
        <button
          type="button"
          onClick={openSensoryRoom}
          className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl border-2 border-violet-300 bg-gradient-to-r from-violet-100 to-fuchsia-100 px-4 py-3 text-xs font-black text-violet-900 shadow-sm transition hover:from-violet-200 hover:to-fuchsia-200 active:scale-[0.99]"
        >
          <span className="text-lg">{reward.emoji}</span>
          <span>
            {isAr
              ? `افتحي ${reward.labelAr} — المؤقت يُمرَّر تلقائياً`
              : `Open ${reward.labelEn} — timer carries over`}
          </span>
        </button>
      )}

      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg
            width={140}
            height={140}
            className="-rotate-90"
            aria-hidden
          >
            <circle
              cx={70}
              cy={70}
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(251,191,36,0.25)"
              strokeWidth={10}
            />
            <circle
              cx={70}
              cy={70}
              r={RING_RADIUS}
              fill="none"
              stroke="#2E7D8E"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-500 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black tabular-nums text-[#0b1f14]">
              {formatReinforcerClock(leftSec)}
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {finished
                ? isAr
                  ? 'انتهى الوقت'
                  : 'Time is up'
                : isAr
                  ? 'متبقٍ'
                  : 'Remaining'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {REINFORCER_DURATION_MINUTES.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => applyDuration(choice)}
              disabled={running}
              className={`rounded-full border px-4 py-2 text-[11px] font-black transition active:scale-95 disabled:opacity-50 ${
                minutes === choice
                  ? 'border-[#2E7D8E] bg-[#2E7D8E] text-white'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {isAr ? `${choice} دقيقة` : `${choice} min`}
            </button>
          ))}
        </div>

        <div className="flex w-full max-w-xs flex-wrap gap-2">
          <button
            type="button"
            onClick={running ? pauseTimer : startTimer}
            disabled={finished}
            className="flex-1 rounded-2xl bg-[#2E7D8E] px-4 py-3 text-xs font-black text-white shadow-md transition hover:bg-[#236372] active:scale-95 disabled:opacity-50"
          >
            {finished
              ? isAr
                ? '✓ اكتمل وقت المعزّز'
                : '✓ Reward time complete'
              : running
                ? isAr
                  ? '⏸ إيقاف'
                  : '⏸ Pause'
                : isAr
                  ? '▶ ابدئي مؤقت المعزّز'
                  : '▶ Start reward timer'}
          </button>
          <button
            type="button"
            onClick={() => applyDuration(minutes)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            {isAr ? '↺' : '↺'}
          </button>
        </div>
      </div>
    </div>
  );
}

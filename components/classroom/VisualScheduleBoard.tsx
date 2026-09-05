'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { RewardAudio, speakText, stopSpeaking } from '@/lib/sensoryAudio';
import {
  HOME_SCHEDULE_REWARDS,
  SENSORY_SCHEDULE_REWARDS,
  SCHEDULE_REWARDS,
  type ScheduleCard,
  type ScheduleReward,
} from '@/lib/scheduleRewards';

export type { ScheduleCard, ScheduleReward };
export { SCHEDULE_REWARDS, HOME_SCHEDULE_REWARDS, SENSORY_SCHEDULE_REWARDS };

const DURATION_CHOICES = [1, 2, 3, 5];
const RING_RADIUS = 54;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const DRAG_TYPE = 'text/taaluf-schedule-task';

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * لوحة «أولاً / ثم» مع مؤقت بصري حسي.
 *
 * مبنية لأطفال التوحد: ألوان هادئة بلا أحمر تحذيري، أهداف لمس كبيرة،
 * وحركة قصيرة تحترم prefers-reduced-motion. اللمس هو المسار الأساسي للإنجاز
 * والسحب إضافة لأجهزة سطح المكتب، لأن السحب HTML5 لا يعمل باللمس.
 */
export default function VisualScheduleBoard({
  firstCard,
  soundOn = true,
  onStart,
  startLabelAr,
  startLabelEn,
  onRewardChange,
  onComplete,
  className,
}: {
  firstCard: ScheduleCard;
  soundOn?: boolean;
  onStart?: () => void;
  startLabelAr?: string;
  startLabelEn?: string;
  onRewardChange?: (reward: ScheduleReward) => void;
  onComplete?: () => void;
  className?: string;
}) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [rewardId, setRewardId] = useState(SCHEDULE_REWARDS[0].id);
  const [totalSec, setTotalSec] = useState(DURATION_CHOICES[1] * 60);
  const [leftSec, setLeftSec] = useState(DURATION_CHOICES[1] * 60);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [overDropZone, setOverDropZone] = useState(false);
  const [done, setDone] = useState(false);

  const audioRef = useRef(new RewardAudio());
  const deadlineRef = useRef(0);
  const speechTimerRef = useRef<number | null>(null);
  const timeUpRef = useRef<() => void>(() => undefined);

  const reward = useMemo(
    () => SCHEDULE_REWARDS.find((item) => item.id === rewardId) || SCHEDULE_REWARDS[0],
    [rewardId]
  );

  const firstLabel = isAr ? firstCard.labelAr : firstCard.labelEn;
  const rewardLabel = isAr ? reward.labelAr : reward.labelEn;

  const speak = useCallback(
    (text: string, delayMs = 0) => {
      if (!soundOn) return;
      if (speechTimerRef.current !== null) {
        window.clearTimeout(speechTimerRef.current);
        speechTimerRef.current = null;
      }
      if (delayMs <= 0) {
        speakText(text, { lang, rate: 0.8 });
        return;
      }
      speechTimerRef.current = window.setTimeout(() => {
        speechTimerRef.current = null;
        speakText(text, { lang, rate: 0.8 });
      }, delayMs);
    },
    [lang, soundOn]
  );

  useEffect(
    () => () => {
      if (speechTimerRef.current !== null) {
        window.clearTimeout(speechTimerRef.current);
      }
      stopSpeaking();
    },
    []
  );

  // مرجع متجدد بدل تبعية في مؤثر المؤقت، فلا يُعاد ضبط العدّاد مع كل تغيير
  useEffect(() => {
    timeUpRef.current = () => {
      if (soundOn) audioRef.current.playChime();
      speak(
        isAr
          ? `انتهى الوقت. حان وقت ${rewardLabel}`
          : `Time is up. Now: ${rewardLabel}`,
        700
      );
    };
  }, [isAr, rewardLabel, soundOn, speak]);

  // الموعد النهائي مخزّن كطابع زمني لا كعدّاد، فلا ينحرف المؤقت إذا خُنق التبويب
  useEffect(() => {
    if (!running) return undefined;

    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000)
      );
      setLeftSec(left);
      if (left <= 0) {
        setRunning(false);
        timeUpRef.current();
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const pickReward = (next: ScheduleReward) => {
    setRewardId(next.id);
    onRewardChange?.(next);
  };

  const pickDuration = (minutes: number) => {
    setRunning(false);
    setTotalSec(minutes * 60);
    setLeftSec(minutes * 60);
  };

  const toggleTimer = () => {
    if (running) {
      setRunning(false);
      return;
    }
    const seconds = leftSec > 0 ? leftSec : totalSec;
    setLeftSec(seconds);
    deadlineRef.current = Date.now() + seconds * 1000;
    setRunning(true);
  };

  const resetTimer = () => {
    setRunning(false);
    setLeftSec(totalSec);
  };

  const speakSequence = () =>
    speak(
      isAr
        ? `أولاً: ${firstLabel}، ثم: ${rewardLabel}`
        : `First: ${firstLabel}. Then: ${rewardLabel}`
    );

  const completeTask = () => {
    setDragging(false);
    setOverDropZone(false);
    if (done) return;

    setDone(true);
    setRunning(false);
    if (soundOn) audioRef.current.playSuccess();
    speak(
      isAr
        ? `أحسنت! أنهيت ${firstLabel}. حان وقت ${rewardLabel}`
        : `Well done! You finished ${firstLabel}. Now: ${rewardLabel}`,
      520
    );
    onComplete?.();
  };

  const restartBoard = () => {
    setDone(false);
    setLeftSec(totalSec);
    setRunning(false);
  };

  const progress = totalSec > 0 ? leftSec / totalSec : 0;
  const lowTime = progress <= 0.25;
  const ringColor = lowTime ? '#D9A441' : '#2E7D8E';
  const startLabel = isAr
    ? startLabelAr || 'ابدأ المهمة ➔'
    : startLabelEn || 'Start the task ➔';

  return (
    <section
      className={`space-y-5 rounded-3xl border border-white/90 bg-white/85 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-6 ${className || ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-black text-[#0b1f14] sm:text-base">
            <span className="text-xl">🗓️</span>
            <span>
              {isAr
                ? 'الجدول البصري — أولاً / ثم'
                : 'Visual schedule — First / Then'}
            </span>
          </h2>
          <p className="mt-1 text-[11px] leading-6 text-slate-500">
            {isAr
              ? 'اعرضي اللوحة على الطفل قبل البدء: ماذا سيفعل الآن، وما الذي ينتظره بعده.'
              : 'Show the board to the child before starting: what happens now, and what comes after.'}
          </p>
        </div>

        <button
          type="button"
          onClick={speakSequence}
          disabled={!soundOn}
          title={
            isAr ? 'اسمعي نطق تسلسل المهمة' : 'Hear the task sequence spoken'
          }
          className="shrink-0 rounded-full border border-[#2E7D8E]/30 bg-white px-3.5 py-2 text-sm transition hover:bg-[#2E7D8E]/10 active:scale-95 disabled:opacity-40"
        >
          🔊
        </button>
      </div>

      {/* أولاً ← ثم */}
      <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <SlotFrame
          tone="teal"
          caption={isAr ? 'أولاً' : 'First'}
          hint={
            done
              ? isAr
                ? 'تمت ✔'
                : 'Done ✔'
              : isAr
                ? 'المهمة الآن'
                : 'The task now'
          }
        >
          {done ? (
            <p className="text-xs font-bold text-slate-400">
              {isAr ? 'انتقلت للأسفل ✔' : 'Moved below ✔'}
            </p>
          ) : (
            <button
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(DRAG_TYPE, 'task');
                event.dataTransfer.effectAllowed = 'move';
                setDragging(true);
              }}
              onDragEnd={() => setDragging(false)}
              onClick={completeTask}
              title={
                isAr
                  ? 'انقري أو اسحبي البطاقة إلى «تمت المهمة»'
                  : 'Tap or drag the card into “Task done”'
              }
              className={`w-full rounded-2xl border-2 border-[#2E7D8E]/25 bg-white p-4 text-center transition active:scale-95 ${
                dragging
                  ? 'scale-95 opacity-60'
                  : 'hover:border-[#2E7D8E]/60 hover:shadow-md'
              }`}
            >
              <span className="block text-5xl leading-none">
                {firstCard.emoji}
              </span>
              <span className="mt-2 block text-sm font-black text-[#0b1f14]">
                {firstLabel}
              </span>
            </button>
          )}
        </SlotFrame>

        <div className="flex items-center justify-center">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
            {isAr ? 'ثم' : 'then'}
          </span>
        </div>

        <SlotFrame
          tone="amber"
          caption={isAr ? 'ثم' : 'Then'}
          hint={isAr ? 'المعزّز بعدها' : 'The reward after'}
        >
          <div className="w-full rounded-2xl border-2 border-amber-300/60 bg-white p-4 text-center">
            <span className="block text-5xl leading-none">{reward.emoji}</span>
            <span className="mt-2 block text-sm font-black text-[#0b1f14]">
              {rewardLabel}
            </span>
          </div>
        </SlotFrame>
      </div>

      {/* اختيار المعزّز */}
      <div className="space-y-3">
        <span className="block text-[11px] font-black text-slate-500">
          {isAr
            ? 'اختاري المعزّز المحبب للطفل'
            : 'Pick the reward your child loves'}
        </span>

        <div className="space-y-2">
          <span className="block text-[10px] font-bold text-slate-400">
            {isAr ? 'معزّزات منزلية' : 'Home rewards'}
          </span>
          <div className="flex flex-wrap gap-2">
            {HOME_SCHEDULE_REWARDS.map((item) => (
              <RewardPill
                key={item.id}
                item={item}
                active={item.id === reward.id}
                isAr={isAr}
                onPick={pickReward}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-[10px] font-bold text-violet-500">
            {isAr ? '🌈 الغرف الحسية' : '🌈 Sensory rooms'}
          </span>
          <div className="flex flex-wrap gap-2">
            {SENSORY_SCHEDULE_REWARDS.map((item) => (
              <RewardPill
                key={item.id}
                item={item}
                active={item.id === reward.id}
                isAr={isAr}
                onPick={pickReward}
                sensory
              />
            ))}
          </div>
        </div>
      </div>

      {/* المؤقت البصري الحسي */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="11"
            />
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <strong
              className="text-2xl font-black tabular-nums"
              style={{ color: ringColor }}
            >
              {formatClock(leftSec)}
            </strong>
            <span className="text-[10px] font-bold text-slate-400">
              {isAr ? 'المتبقي' : 'left'}
            </span>
          </div>
        </div>

        <div className="w-full space-y-3">
          <div className="space-y-1.5">
            <span className="block text-[11px] font-black text-slate-500">
              {isAr ? 'مدة المهمة' : 'Task duration'}
            </span>
            <div className="flex flex-wrap gap-2">
              {DURATION_CHOICES.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => pickDuration(minutes)}
                  aria-pressed={totalSec === minutes * 60}
                  className={`rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition active:scale-95 ${
                    totalSec === minutes * 60
                      ? 'border-[#2E7D8E] bg-[#2E7D8E] text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#2E7D8E]/40'
                  }`}
                >
                  {isAr ? `${minutes} دقيقة` : `${minutes} min`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleTimer}
              className="flex-1 rounded-2xl bg-[#2E7D8E] px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-[#236372] active:scale-95"
            >
              {running
                ? isAr
                  ? '⏸ إيقاف مؤقت'
                  : '⏸ Pause'
                : isAr
                  ? '▶ ابدأ المؤقت'
                  : '▶ Start timer'}
            </button>
            <button
              type="button"
              onClick={resetTimer}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 active:scale-95"
            >
              {isAr ? '↺ إعادة' : '↺ Reset'}
            </button>
          </div>

          <p className="text-[10px] leading-5 text-slate-400">
            {isAr
              ? 'القرص يتناقص بلون هادئ ليفهم الطفل الوقت المتبقي دون قلق أو عدّ لفظي.'
              : 'The ring shrinks in a calm colour so the child sees the time left without anxiety or verbal counting.'}
          </p>
        </div>
      </div>

      {/* خانة الإنجاز */}
      <div
        onDragOver={(event) => {
          if (done || !event.dataTransfer.types.includes(DRAG_TYPE)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          setOverDropZone(true);
        }}
        onDragLeave={() => setOverDropZone(false)}
        onDrop={(event) => {
          if (!event.dataTransfer.types.includes(DRAG_TYPE)) return;
          event.preventDefault();
          completeTask();
        }}
        className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${
          done
            ? 'border-emerald-400 bg-emerald-50'
            : overDropZone
              ? 'border-emerald-400 bg-emerald-50/70'
              : 'border-slate-300 bg-white/70'
        }`}
      >
        {done ? (
          <div className="taaluf-settle space-y-1">
            <span className="block text-4xl leading-none">
              {firstCard.emoji}
            </span>
            <strong className="block text-sm font-black text-emerald-800">
              {isAr ? `تمت المهمة ✔ ${firstLabel}` : `Task done ✔ ${firstLabel}`}
            </strong>
            <p className="text-[11px] font-bold text-emerald-700">
              {isAr
                ? `حان وقت ${rewardLabel} ${reward.emoji}`
                : `Now: ${rewardLabel} ${reward.emoji}`}
            </p>
            <button
              type="button"
              onClick={restartBoard}
              className="pt-1 text-[11px] font-black text-slate-400 underline underline-offset-2 transition hover:text-[#2E7D8E]"
            >
              {isAr ? 'إعادة تجهيز اللوحة' : 'Reset the board'}
            </button>
          </div>
        ) : (
          <>
            <span className="block text-2xl leading-none">✔</span>
            <strong className="mt-1 block text-xs font-black text-slate-600">
              {isAr ? 'تمت المهمة' : 'Task done'}
            </strong>
            <p className="mt-0.5 text-[11px] leading-5 text-slate-400">
              {isAr
                ? 'اسحبي بطاقة «أولاً» إلى هنا أو انقريها عند إنهاء الطفل للمهمة.'
                : 'Drag the “First” card here, or tap it once the child finishes.'}
            </p>
          </>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {done
          ? isAr
            ? 'تمت المهمة'
            : 'Task completed'
          : ''}
      </p>

      {onStart && (
        <button
          type="button"
          onClick={onStart}
          className="w-full rounded-2xl bg-[#2E7D8E] py-3.5 text-xs font-black text-white shadow-lg shadow-[#2E7D8E]/20 transition hover:bg-[#236372] active:scale-[0.99] sm:text-sm"
        >
          {startLabel}
        </button>
      )}
    </section>
  );
}

function RewardPill({
  item,
  active,
  isAr,
  onPick,
  sensory,
}: {
  item: ScheduleReward;
  active: boolean;
  isAr: boolean;
  onPick: (item: ScheduleReward) => void;
  sensory?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(item)}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${
        active
          ? sensory
            ? 'border-violet-500 bg-violet-100 text-violet-900 shadow-sm'
            : 'border-amber-500 bg-amber-100 text-amber-900 shadow-sm'
          : sensory
            ? 'border-violet-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50'
            : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50'
      }`}
    >
      <span className="text-base leading-none">{item.emoji}</span>
      <span>{isAr ? item.labelAr : item.labelEn}</span>
    </button>
  );
}

function SlotFrame({
  tone,
  caption,
  hint,
  children,
}: {
  tone: 'teal' | 'amber';
  caption: string;
  hint: string;
  children: React.ReactNode;
}) {
  const tones =
    tone === 'teal'
      ? 'border-[#2E7D8E]/25 bg-[#2E7D8E]/[0.06]'
      : 'border-amber-300/50 bg-amber-50/80';
  const captionTone =
    tone === 'teal' ? 'bg-[#2E7D8E] text-white' : 'bg-amber-500 text-white';

  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-3xl border-2 p-4 ${tones}`}
    >
      <span
        className={`rounded-full px-3 py-0.5 text-[11px] font-black ${captionTone}`}
      >
        {caption}
      </span>
      <div className="flex w-full flex-1 items-center justify-center">
        {children}
      </div>
      <span className="text-[10px] font-bold text-slate-400">{hint}</span>
    </div>
  );
}

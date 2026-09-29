'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildSensoryMatchingMetrics,
  buildSessionRounds,
  CATEGORY_EMOJI,
  CATEGORY_LABEL_AR,
  isCorrectChoice,
  MATCH_DRAG_THRESHOLD_PX,
  persistSensoryMatchingResult,
  resolveCardRelease,
  SENSORY_MATCHING_TOTAL_ROUNDS,
  type MatchItem,
  type MatchRound,
  type SensoryMatchingMetrics,
} from '@/lib/sensoryMatching';
import { RewardAudio, speakText } from '@/lib/sensoryAudio';
import SensorySessionResultsPanel from '@/components/sensory-hub/SensorySessionResultsPanel';
import type { SensorySessionEndReason } from '@/lib/sensorySessionEnd';
import {
  holdExitProgress,
  SENSORY_FOCUS_EXIT_HOLD_MS,
} from '@/lib/sensoryFocusMode';

function PictureCard({
  item,
  size = 'choice',
  dimmed,
  glow,
  label,
}: {
  item: MatchItem;
  size?: 'prompt' | 'choice';
  dimmed?: boolean;
  glow?: boolean;
  label?: string;
}) {
  const big = size === 'prompt';
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[28px] border-2 bg-gradient-to-b p-3 shadow-sm transition ${
        item.tint
      } ${glow ? 'border-[#2E7D8E] ring-4 ring-teal-200' : 'border-white/80'} ${
        dimmed ? 'opacity-50' : ''
      } ${big ? 'min-h-[180px] w-full max-w-xs' : 'min-h-[132px] w-full'}`}
    >
      <span className={big ? 'text-7xl sm:text-8xl' : 'text-5xl sm:text-6xl'} aria-hidden>
        {item.emoji}
      </span>
      <p className={`mt-2 font-black text-slate-800 ${big ? 'text-xl' : 'text-base'}`}>
        {item.nameAr}
      </p>
      {label ? (
        <p className="mt-0.5 text-[11px] font-bold text-slate-500">{label}</p>
      ) : null}
    </div>
  );
}

/** جولة المجموعة — المثال للتعلّم فقط، والجواب بطاقة أخرى من نفس المجموعة */
function CategoryExamplePrompt({ round }: { round: MatchRound }) {
  const category = round.prompt.category;
  return (
    <div className="flex w-full max-w-xs flex-col items-center text-center">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1.5 text-sm font-black text-teal-900">
        <span aria-hidden>{CATEGORY_EMOJI[category]}</span>
        <span>مجموعة {CATEGORY_LABEL_AR[category]}</span>
      </div>
      <div className="w-full rounded-[28px] border-2 border-dashed border-teal-300/80 bg-teal-50/80 px-4 py-4">
        <p className="text-[11px] font-bold text-slate-500">مثال من المجموعة (ليس الجواب)</p>
        <span className="mt-2 block text-6xl" aria-hidden>
          {round.prompt.emoji}
        </span>
        <p className="mt-1 text-lg font-black text-slate-800">{round.prompt.nameAr}</p>
      </div>
      <p className="mt-3 text-xs font-bold leading-6 text-teal-800">
        اختر <span className="underline decoration-teal-400">صورة مختلفة</span> من نفس
        المجموعة من البطاقات أدناه
      </p>
    </div>
  );
}

function HoldToEndButton({ onComplete }: { onComplete: () => void }) {
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);

  const stopHold = useCallback(() => {
    holdStartRef.current = null;
    setProgress(0);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <button
      type="button"
      onPointerDown={() => {
        holdStartRef.current = Date.now();
        const tick = () => {
          if (holdStartRef.current === null) return;
          const elapsed = Date.now() - holdStartRef.current;
          setProgress(holdExitProgress(elapsed));
          if (elapsed >= SENSORY_FOCUS_EXIT_HOLD_MS) {
            stopHold();
            onComplete();
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
      className="rounded-xl bg-white/80 px-3 py-1.5 text-sm font-bold text-[#2E7D8E] shadow-sm"
      style={{
        boxShadow: progress
          ? `inset 0 0 0 ${Math.round(progress * 10)}px rgba(46,125,142,0.2)`
          : undefined,
      }}
    >
      إنهاء — اضغط مطولاً
    </button>
  );
}

export default function SensoryMatchingGame({
  childId,
  onComplete,
  onExitGroup,
  onReplayReset,
}: {
  childId?: string;
  onComplete?: (metrics: SensoryMatchingMetrics) => void;
  onExitGroup?: () => void;
  onReplayReset?: () => void;
}) {
  const audioRef = useRef(new RewardAudio());
  const dropRef = useRef<HTMLDivElement | null>(null);
  const roundStartedAt = useRef(Date.now());
  const sessionStartedAt = useRef(new Date().toISOString());
  const dragStartRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  // الجولات عشوائية — تُبنى في المتصفح فقط لتجنّب اختلاف HTML الخادم عن العميل
  const [rounds, setRounds] = useState<MatchRound[]>([]);
  useEffect(() => {
    setRounds(buildSessionRounds());
  }, []);
  const [index, setIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<'ok' | 'miss' | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });
  const [overTarget, setOverTarget] = useState(false);
  const [done, setDone] = useState(false);
  const [metrics, setMetrics] = useState<SensoryMatchingMetrics | null>(null);
  const [endReason, setEndReason] = useState<SensorySessionEndReason>('complete');
  const [liveRate, setLiveRate] = useState(0);

  const stats = useRef({
    correctAttempts: 0,
    totalAttempts: 0,
    firstTryCorrect: 0,
    responseTimesMs: [] as number[],
    missesThisRound: 0,
  });

  const round: MatchRound | undefined = rounds[index];

  useEffect(() => {
    roundStartedAt.current = Date.now();
    stats.current.missesThisRound = 0;
    setFeedback(null);
    setWrongId(null);
  }, [index]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.addEventListener('voiceschanged', warm);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', warm);
  }, []);

  const finish = (reason: SensorySessionEndReason = 'complete') => {
    if (done) return;
    const built = buildSensoryMatchingMetrics({
      correctAttempts: stats.current.correctAttempts,
      totalAttempts: stats.current.totalAttempts,
      firstTryCorrect: stats.current.firstTryCorrect,
      responseTimesMs: stats.current.responseTimesMs,
      roundsCompleted: reason === 'complete' ? rounds.length : index,
      sessionStartedAt: sessionStartedAt.current,
    });
    persistSensoryMatchingResult(built, childId);
    setMetrics(built);
    setEndReason(reason);
    setDone(true);
    completeRef.current?.(built);
  };

  const replay = () => {
    setDone(false);
    setMetrics(null);
    setIndex(0);
    setLocked(false);
    setFeedback(null);
    setWrongId(null);
    setEndReason('complete');
    stats.current = {
      correctAttempts: 0,
      totalAttempts: 0,
      firstTryCorrect: 0,
      responseTimesMs: [],
      missesThisRound: 0,
    };
    setLiveRate(0);
    roundStartedAt.current = Date.now();
    sessionStartedAt.current = new Date().toISOString();
    onReplayReset?.();
  };

  const succeed = (item: MatchItem) => {
    const elapsed = Date.now() - roundStartedAt.current;
    stats.current.correctAttempts += 1;
    stats.current.responseTimesMs.push(elapsed);
    if (stats.current.missesThisRound === 0) {
      stats.current.firstTryCorrect += 1;
    }
    speakText(item.nameAr, { lang: 'ar' });
    audioRef.current.playSuccess();
    setFeedback('ok');
    setLocked(true);
    window.setTimeout(() => {
      if (index + 1 >= rounds.length) {
        finish();
        return;
      }
      setLocked(false);
      setIndex((n) => n + 1);
    }, 1100);
  };

  const tryChoice = (choice: MatchItem) => {
    if (!round || locked || done) return;
    stats.current.totalAttempts += 1;
    if (isCorrectChoice(round, choice.id)) {
      succeed(round.mode === 'identical' ? round.prompt : choice);
    } else {
      stats.current.missesThisRound += 1;
      audioRef.current.playMiss();
      setFeedback('miss');
      setWrongId(choice.id);
      window.setTimeout(() => {
        setFeedback(null);
        setWrongId(null);
      }, 650);
    }
    setLiveRate(
      Math.round(
        (stats.current.correctAttempts / stats.current.totalAttempts) * 100
      )
    );
  };

  const isOverTarget = (clientX: number, clientY: number) => {
    const drop = dropRef.current?.getBoundingClientRect();
    if (!drop) return false;
    return (
      clientX >= drop.left &&
      clientX <= drop.right &&
      clientY >= drop.top &&
      clientY <= drop.bottom
    );
  };

  const resetDrag = () => {
    dragStartRef.current = null;
    setDragId(null);
    setDragOffset({ dx: 0, dy: 0 });
    setOverTarget(false);
  };

  const onChoicePointerDown = (event: React.PointerEvent, choice: MatchItem) => {
    if (locked || done) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* بعض الأجهزة لا تدعم الالتقاط */
    }
    dragStartRef.current = { id: choice.id, x: event.clientX, y: event.clientY };
    setDragId(choice.id);
    setDragOffset({ dx: 0, dy: 0 });
  };

  const onChoicePointerMove = (event: React.PointerEvent, choice: MatchItem) => {
    const start = dragStartRef.current;
    if (!start || start.id !== choice.id) return;
    setDragOffset({ dx: event.clientX - start.x, dy: event.clientY - start.y });
    setOverTarget(isOverTarget(event.clientX, event.clientY));
  };

  const onChoicePointerUp = (event: React.PointerEvent, choice: MatchItem) => {
    const start = dragStartRef.current;
    if (!start || start.id !== choice.id) {
      resetDrag();
      return;
    }
    const outcome = resolveCardRelease({
      dx: event.clientX - start.x,
      dy: event.clientY - start.y,
      overTarget: isOverTarget(event.clientX, event.clientY),
    });
    resetDrag();
    if (outcome === 'attempt') tryChoice(choice);
  };

  if (done && metrics) {
    return (
      <div className="relative min-h-screen" dir="rtl">
        <SensorySessionResultsPanel
          isAr
          titleAr="مطابقة الصور"
          titleEn="Picture matching"
          endReason={endReason}
          stats={[
            { labelAr: 'صحيحة', labelEn: 'Correct', value: metrics.correctAttempts },
            { labelAr: 'زمن الاستجابة', labelEn: 'Response', value: `${metrics.avgResponseMs}ms` },
            { labelAr: 'الدقة', labelEn: 'Accuracy', value: `${metrics.accuracyRate}%` },
            { labelAr: 'جولات', labelEn: 'Rounds', value: metrics.roundsCompleted },
          ]}
          onReplay={replay}
          onExitGroup={onExitGroup ?? (() => undefined)}
          variant="light"
        />
      </div>
    );
  }

  if (!round) return null;

  const stageLabel =
    round.mode === 'identical' ? 'تطابق صورة طبق الأصل' : 'تطابق المجموعات الضمنية';
  const promptHint =
    round.mode === 'identical'
      ? 'اسحب أو اضغط على الصورة المطابقة تماماً للصورة في الوسط'
      : `اختر صورة أخرى من مجموعة «${CATEGORY_LABEL_AR[round.prompt.category]}» — ليست المثال`;
  const actionHint =
    round.mode === 'identical'
      ? 'اضغط البطاقة أو اسحبها إلى الصورة أعلاه'
      : 'اضغط على البطاقة الصحيحة أو اسحبها إلى المربع أعلاه';
  const isDragging =
    dragId !== null && Math.hypot(dragOffset.dx, dragOffset.dy) >= MATCH_DRAG_THRESHOLD_PX;

  return (
    <div className="mx-auto max-w-3xl px-3 pb-8 pt-2 sm:px-4" dir="rtl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <HoldToEndButton onComplete={() => finish('manual')} />
        <div className="text-center">
          <p className="text-xs font-bold text-[#2E7D8E]">{stageLabel}</p>
          <p className="text-sm font-black text-slate-800">
            {index + 1} / {SENSORY_MATCHING_TOTAL_ROUNDS}
          </p>
        </div>
        <div className="w-16 text-left text-xs font-bold text-slate-500">
          {liveRate}%
        </div>
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/70">
        <div
          className="h-full rounded-full bg-[#2E7D8E] transition-all"
          style={{ width: `${(index / SENSORY_MATCHING_TOTAL_ROUNDS) * 100}%` }}
        />
      </div>

      <p className="mb-3 text-center text-sm font-bold text-slate-600">{promptHint}</p>

      <div
        ref={dropRef}
        className={`mx-auto mb-6 flex max-w-xs flex-col items-center rounded-[32px] border-4 border-dashed p-2 transition ${
          isDragging && overTarget
            ? 'scale-[1.03] border-[#2E7D8E] bg-teal-100'
            : isDragging
              ? 'border-[#2E7D8E] bg-teal-50'
              : 'border-teal-200 bg-white/70'
        }`}
      >
        {round.mode === 'identical' ? (
          <PictureCard
            item={round.prompt}
            size="prompt"
            glow={feedback === 'ok'}
            label="الصورة المطلوبة"
          />
        ) : (
          <CategoryExamplePrompt round={round} />
        )}
      </div>

      {feedback === 'ok' ? (
        <p className="mb-3 text-center text-lg font-black text-emerald-700">
          رائع! 🎯{' '}
          {round.mode === 'identical'
            ? round.prompt.nameAr
            : round.choices.find((c) => c.id === round.correctId)?.nameAr}
        </p>
      ) : feedback === 'miss' ? (
        <p className="mb-3 text-center text-sm font-bold text-amber-700">
          {round.mode === 'category'
            ? 'ليست من نفس المجموعة — حاول مرة أخرى 💧'
            : 'حاول مرة أخرى 💧'}
        </p>
      ) : (
        <p className="mb-3 text-center text-xs text-slate-400">{actionHint}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {round.choices.map((choice) => {
          const active = dragId === choice.id;
          return (
          <button
            key={choice.id}
            type="button"
            disabled={locked}
            onPointerDown={(event) => onChoicePointerDown(event, choice)}
            onPointerMove={(event) => onChoicePointerMove(event, choice)}
            onPointerUp={(event) => onChoicePointerUp(event, choice)}
            onPointerCancel={resetDrag}
            style={
              active && isDragging
                ? {
                    transform: `translate(${dragOffset.dx}px, ${dragOffset.dy}px) scale(1.05)`,
                    zIndex: 20,
                    position: 'relative',
                  }
                : undefined
            }
            className={`touch-none select-none rounded-[28px] focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 disabled:pointer-events-none ${
              active && isDragging ? 'cursor-grabbing shadow-2xl' : 'transition-transform duration-200'
            }`}
          >
            <PictureCard
              item={choice}
              dimmed={wrongId === choice.id}
              glow={active}
            />
          </button>
          );
        })}
      </div>
    </div>
  );
}

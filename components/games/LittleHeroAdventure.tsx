'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import PdfExportButton from '@/components/reports/PdfExportButton';
import { saveGameSession, starsFromRate } from '@/lib/gameSession';
import { useGazeTracker } from '@/hooks/useGazeTracker';
import {
  CREATURES,
  EMOTIONS,
  IMITATION_MOVES,
  SHIRT_COLORS,
  SKIN_TONES,
  buildLittleHeroResult,
  type CreatureId,
  type EmotionId,
  type LittleHeroAppearance,
  type LittleHeroStage,
  type MoveId,
  type StageTrial,
} from '@/lib/littleHero';

type Props = {
  childId?: string;
  onComplete?: (result: ReturnType<typeof buildLittleHeroResult>) => void;
};

function resolveChildId(childId?: string) {
  if (childId) return childId;
  try {
    const s = JSON.parse(localStorage.getItem('taaluf.activeStudent') || 'null');
    return s?.id || 'child_local';
  } catch {
    return 'child_local';
  }
}

function loadAppearance(): LittleHeroAppearance {
  try {
    const raw = JSON.parse(
      localStorage.getItem('taaluf.littleHero.appearance') || 'null'
    );
    return {
      skin: Math.min(3, Math.max(0, Number(raw?.skin) || 0)),
      shirt: Math.min(3, Math.max(0, Number(raw?.shirt) || 0)),
    };
  } catch {
    return { skin: 0, shirt: 0 };
  }
}

function skyForTime(t: number) {
  if (t < 0.35) return 'linear-gradient(#7ec8ff, #c8ecff 55%, #8fd18a)';
  if (t < 0.65) return 'linear-gradient(#f0a56a, #ffd9a0 50%, #7cbc6a)';
  return 'linear-gradient(#0b1026, #1a2450 55%, #16301c)';
}

const TREES = [
  { left: '8%', delay: '0s' },
  { left: '18%', delay: '0.4s' },
  { left: '78%', delay: '0.2s' },
  { left: '88%', delay: '0.7s' },
];

const FLOWERS = Array.from({ length: 14 }, (_, i) => ({
  left: `${8 + ((i * 17) % 84)}%`,
  color: ['#f472b6', '#fbbf24', '#a78bfa', '#fb923c'][i % 4],
  delay: `${(i % 5) * 0.2}s`,
}));

function Creature({
  id,
  active,
  pose,
  emotion,
}: {
  id: CreatureId;
  active?: boolean;
  pose?: MoveId;
  emotion?: EmotionId;
}) {
  const spec = CREATURES.find((c) => c.id === id)!;
  const face =
    emotion === 'joy'
      ? '◕‿◕'
      : emotion === 'sad'
        ? '◕︵◕'
        : emotion === 'fear'
          ? '◉△◉'
          : emotion === 'anger'
            ? 'ಠ_ಠ'
            : '◕‿◕';
  return (
    <div
      className={`flex flex-col items-center transition-transform duration-300 ${
        active ? 'scale-110 -translate-y-2' : 'opacity-90'
      }`}
    >
      <div
        className={`relative flex h-20 w-20 items-center justify-center rounded-full text-lg shadow-sm ${
          pose === 'hands_up' ? '-translate-y-2' : ''
        } ${pose === 'wave' ? 'animate-pulse' : ''}`}
        style={{ background: spec.color }}
      >
        {id === 'rabbit' && (
          <>
            <span className="absolute -top-5 left-4 h-6 w-2 rounded-full bg-[#F4E1C1]" />
            <span className="absolute -top-5 right-4 h-6 w-2 rounded-full bg-[#F4E1C1]" />
          </>
        )}
        {id === 'bear' && (
          <>
            <span className="absolute -top-2 left-2 h-4 w-4 rounded-full bg-[#8B5A2B]" />
            <span className="absolute -top-2 right-2 h-4 w-4 rounded-full bg-[#8B5A2B]" />
          </>
        )}
        <span className="text-sm text-white drop-shadow">{face}</span>
      </div>
      <p className="mt-1 text-xs font-semibold text-[#0b1f14]">{spec.label}</p>
    </div>
  );
}

export default function LittleHeroAdventure({ childId, onComplete }: Props) {
  const [stage, setStage] = useState<LittleHeroStage>('hub');
  const [timeOfDay, setTimeOfDay] = useState(0.28);
  const [look, setLook] = useState<LittleHeroAppearance>(loadAppearance);
  const [trials, setTrials] = useState<StageTrial[]>([]);
  const [index, setIndex] = useState(0);
  const [star, setStar] = useState({ x: 50, y: 35 });
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState<ReturnType<
    typeof buildLittleHeroResult
  > | null>(null);
  const startedAt = useRef('');
  const shownAt = useRef(0);
  const trackSamples = useRef({ near: 0, total: 0 });
  const settlingRef = useRef(false);
  const { gaze, status: gazeStatus, start: startGaze, stop: stopGaze } =
    useGazeTracker(true);

  const night = timeOfDay > 0.62;
  const promptMove = IMITATION_MOVES[index];
  const promptEmotion = EMOTIONS[index];
  const actor = CREATURES[index % CREATURES.length];

  useEffect(() => {
    localStorage.setItem('taaluf.littleHero.appearance', JSON.stringify(look));
  }, [look]);

  useEffect(() => {
    if (stage !== 'tracking') return undefined;
    const id = window.setInterval(() => {
      setStar({
        x: 12 + Math.random() * 76,
        y: 16 + Math.random() * 48,
      });
    }, Math.max(420, 1100 - index * 120));
    return () => window.clearInterval(id);
  }, [stage, index]);

  useEffect(() => {
    if (stage !== 'tracking' || !gaze?.present) return;
    trackSamples.current.total += 1;
    const dx = gaze.x * 100 - star.x;
    const dy = gaze.y * 100 - star.y;
    if (Math.hypot(dx, dy) < 18) trackSamples.current.near += 1;
  }, [gaze, stage, star.x, star.y]);

  useEffect(() => {
    if (stage !== 'tracking' || gazeStatus !== 'live') return undefined;
    const id = window.setTimeout(() => settleTracking(), 6000);
    return () => window.clearTimeout(id);
    // settle once per tracking level
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, index, gazeStatus]);

  const pushTrial = (trial: StageTrial, nextStage: LittleHeroStage, nextIndex: number) => {
    const next = [...trials, trial];
    setTrials(next);
    setIndex(nextIndex);
    setStage(nextStage);
    shownAt.current = performance.now();
    settlingRef.current = false;
    if (nextStage === 'tracking') trackSamples.current = { near: 0, total: 0 };
    return next;
  };

  const finish = async (all: StageTrial[]) => {
    const built = buildLittleHeroResult({
      trials: all,
      startedAt: startedAt.current,
      gazeUsed: gazeStatus === 'live',
    });
    setResult(built);
    setStage('results');
    stopGaze();
    try {
      await saveGameSession({
        childId: resolveChildId(childId),
        gameCode: 'little_hero',
        score: built.score,
        levelReached: built.levelReached,
        metrics: built.metrics,
        trials: built.trials,
        startedAt: built.startedAt,
        endedAt: built.endedAt,
      });
      setMsg('تم حفظ جلسة المغامرة في المنصة');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'تعذر الحفظ');
    }
    onComplete?.(built);
  };

  const answerImitation = (moveId: MoveId) => {
    const success = moveId === promptMove.id;
    const trial: StageTrial = {
      stage: 'imitation',
      promptId: promptMove.id,
      success,
      responseMs: performance.now() - shownAt.current,
      at: new Date().toISOString(),
    };
    if (index >= IMITATION_MOVES.length - 1) {
      pushTrial(trial, 'tracking', 0);
      return;
    }
    pushTrial(trial, 'imitation', index + 1);
  };

  const settleTracking = (manual?: boolean) => {
    if (stage !== 'tracking' || settlingRef.current) return;
    settlingRef.current = true;
    const gazeOk =
      trackSamples.current.total >= 4 &&
      trackSamples.current.near / trackSamples.current.total >= 0.45;
    const success = manual === undefined ? gazeOk : manual;
    const distracted = !success;
    const trial: StageTrial = {
      stage: 'tracking',
      promptId: `star_l${index + 1}`,
      success,
      distracted,
      responseMs: performance.now() - shownAt.current,
      at: new Date().toISOString(),
    };
    if (index >= 4) {
      pushTrial(trial, 'emotions', 0);
      return;
    }
    pushTrial(trial, 'tracking', index + 1);
  };

  const answerEmotion = (emotionId: EmotionId) => {
    const success = emotionId === promptEmotion.id;
    const trial: StageTrial = {
      stage: 'emotions',
      promptId: promptEmotion.id,
      success,
      responseMs: performance.now() - shownAt.current,
      at: new Date().toISOString(),
    };
    if (index >= EMOTIONS.length - 1) {
      void finish([...trials, trial]);
      return;
    }
    pushTrial(trial, 'emotions', index + 1);
  };

  const overall = result
    ? (result.metrics.imitationRate +
        result.metrics.trackingAccuracy +
        result.metrics.emotionAccuracy) /
      3
    : 0;
  const stars = starsFromRate(overall);

  const instruction = useMemo(() => {
    if (stage === 'imitation') return `${actor.label} يحرّك: ${promptMove.label} — قلّد واختر`;
    if (stage === 'tracking') return 'اتبع النجم الذهبي بعينيك أو سجّل التتبع';
    if (stage === 'emotions') return `ما شعور ${actor.label}؟`;
    return '';
  }, [actor.label, promptMove.label, stage]);

  return (
    <section className="space-y-4">
      <div
        className="relative overflow-hidden rounded-3xl border border-emerald-100"
        style={{ minHeight: 520, background: skyForTime(timeOfDay) }}
      >
        {night &&
          Array.from({ length: 36 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-amber-100"
              style={{
                left: `${(i * 23) % 100}%`,
                top: `${(i * 11) % 48}%`,
                opacity: 0.4 + ((i * 7) % 6) / 10,
                animation: 'pulse 2s ease-in-out infinite',
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}

        <div
          className="absolute inset-x-0 bottom-0 h-48 origin-bottom"
          style={{
            transform: 'perspective(900px) rotateX(18deg)',
            background:
              'radial-gradient(circle at 30% 20%, #9fe08a, #4ea15a 55%, #2f7a40)',
          }}
        />

        {TREES.map((tree) => (
          <div
            key={tree.left}
            className="absolute bottom-28"
            style={{ left: tree.left }}
          >
            <div className="mx-auto h-10 w-2 rounded bg-[#7a4a22]" />
            <div className="-mt-2 h-14 w-14 rounded-full bg-[#1f7a3a]" />
          </div>
        ))}

        {FLOWERS.map((f, i) => (
          <span
            key={i}
            className="absolute bottom-24 h-2 w-2 rounded-full"
            style={{ left: f.left, background: f.color }}
          />
        ))}

        {stage === 'tracking' && (
          <button
            type="button"
            aria-label="نجم التتبع"
            className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.95)] transition-all duration-500"
            style={{ left: `${star.x}%`, top: `${star.y}%` }}
            onClick={() => settleTracking(true)}
          />
        )}

        {gaze?.present && stage === 'tracking' && (
          <span
            className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70"
            style={{ left: `${gaze.x * 100}%`, top: `${gaze.y * 100}%` }}
          />
        )}

        <div className="absolute inset-x-0 bottom-6 flex items-end justify-center gap-5">
          <div className="flex flex-col items-center">
            <div
              className="h-16 w-12 rounded-t-full"
              style={{ background: SKIN_TONES[look.skin] }}
            />
            <div
              className="h-14 w-16 rounded-xl"
              style={{ background: SHIRT_COLORS[look.shirt] }}
            />
            <p className="mt-1 text-xs font-bold text-white drop-shadow">البطل</p>
          </div>
          {CREATURES.map((c) => (
            <Creature
              key={c.id}
              id={c.id}
              active={actor.id === c.id && stage !== 'hub' && stage !== 'results'}
              pose={stage === 'imitation' ? promptMove.id : undefined}
              emotion={stage === 'emotions' ? promptEmotion.id : undefined}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-start justify-between p-4">
          <div>
            <p className="text-xs font-semibold text-white/90 drop-shadow">
              مغامرة البطل الصغير
            </p>
            <p className="text-sm font-bold text-white drop-shadow">
              {stage === 'hub'
                ? 'عالم التلال والأصدقاء'
                : stage === 'results'
                  ? 'أحسنت'
                  : instruction}
            </p>
          </div>
          <label className="rounded-xl bg-black/25 px-3 py-2 text-xs text-white">
            الإضاءة
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(Number(e.target.value))}
              className="mt-1 block w-28"
            />
          </label>
        </div>
      </div>

      {stage === 'hub' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-[#0b1f14]">خصّص البطل ثم ابدأ</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            ثلاث مراحل: تقليد حركة الأصدقاء، تتبع النجم، ثم التعرف على المشاعر.
            التقدير البصري عبر الكاميرا محلي فقط وليس تشخيصاً طبياً.
          </p>
          <p className="mt-3 text-xs font-semibold text-slate-500">لون البشرة</p>
          <div className="mt-2 flex gap-2">
            {SKIN_TONES.map((c, i) => (
              <button
                key={c}
                type="button"
                aria-label={`بشرة ${i + 1}`}
                onClick={() => setLook((a) => ({ ...a, skin: i }))}
                className={`h-8 w-8 rounded-full border-2 ${
                  look.skin === i ? 'border-[#0b1f14]' : 'border-white'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">لون الملابس</p>
          <div className="mt-2 flex gap-2">
            {SHIRT_COLORS.map((c, i) => (
              <button
                key={c}
                type="button"
                aria-label={`ملابس ${i + 1}`}
                onClick={() => setLook((a) => ({ ...a, shirt: i }))}
                className={`h-8 w-8 rounded-full border-2 ${
                  look.shirt === i ? 'border-[#0b1f14]' : 'border-white'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                startedAt.current = new Date().toISOString();
                shownAt.current = performance.now();
                setTrials([]);
                setIndex(0);
                setResult(null);
                setMsg('');
                setStage('imitation');
              }}
            >
              ابدأ المغامرة
            </Button>
            <Button
              variant="outline"
              onClick={() => startGaze()}
              disabled={gazeStatus === 'live' || gazeStatus === 'loading'}
            >
              {gazeStatus === 'live'
                ? 'الكاميرا تعمل محلياً'
                : gazeStatus === 'loading'
                  ? 'جاري التشغيل…'
                  : 'تشغيل تتبع النظر (اختياري)'}
            </Button>
          </div>
          {gazeStatus === 'denied' && (
            <p className="mt-2 text-xs text-amber-700">
              رُفض إذن الكاميرا — يمكن إكمال التتبع يدوياً.
            </p>
          )}
        </div>
      )}

      {stage === 'imitation' && (
        <div className="flex flex-wrap justify-center gap-2">
          {IMITATION_MOVES.map((m) => (
            <Button key={m.id} variant="outline" onClick={() => answerImitation(m.id)}>
              {m.label}
            </Button>
          ))}
        </div>
      )}

      {stage === 'tracking' && (
        <div className="flex flex-wrap justify-center gap-3">
          <p className="w-full text-center text-xs text-slate-500">
            المستوى {index + 1} من 5
            {gazeStatus === 'live' ? ' · تقدير النظر يعمل' : ''}
          </p>
          <Button onClick={() => settleTracking(true)}>تتبع ✓</Button>
          <Button variant="outline" onClick={() => settleTracking(false)}>
            تشتت ✗
          </Button>
        </div>
      )}

      {stage === 'emotions' && (
        <div className="flex flex-wrap justify-center gap-2">
          {EMOTIONS.map((e) => (
            <Button key={e.id} variant="outline" onClick={() => answerEmotion(e.id)}>
              {e.emoji} {e.label}
            </Button>
          ))}
        </div>
      )}

      {stage === 'results' && result && (
        <div className="print-document rounded-3xl border border-emerald-100 bg-white p-8 text-center print:bg-white print:p-0 print:shadow-none">
          <div className="mb-4 flex justify-center print:hidden">
            <PdfExportButton
              documentTitle="نتيجة_مغامرة_البطل_الصغير"
              className="px-6 py-3 text-sm"
            />
          </div>
          <p className="text-4xl tracking-widest text-amber-400">
            {'★'.repeat(stars)}
            {'☆'.repeat(3 - stars)}
          </p>
          <h3 className="mt-3 text-2xl font-bold text-[#0b1f14]">أكملت المغامرة</h3>
          <p className="mt-2 text-sm text-slate-600">
            النتيجة {result.score} · تقليد {Math.round(result.metrics.imitationRate * 100)}%
            · تتبع {Math.round(result.metrics.trackingAccuracy * 100)}% · مشاعر{' '}
            {Math.round(result.metrics.emotionAccuracy * 100)}%
          </p>
          <p className="mt-1 text-xs text-slate-400">
            زمن الاستجابة {result.metrics.avgResponseMs}ms · تشتت{' '}
            {Math.round(result.metrics.distractionRate * 100)}%
          </p>
          <p className="mt-1 text-xs text-slate-400">
            المعايير: C15 · C16 · C11 · C12 · C17 · C32
          </p>
          {msg && <p className="mt-3 text-sm text-[#2D8B5A]">{msg}</p>}
          <Button
            className="mt-5 print:hidden"
            variant="outline"
            onClick={() => {
              setStage('hub');
              setResult(null);
              setTrials([]);
            }}
          >
            إعادة المغامرة
          </Button>
        </div>
      )}
    </section>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import {
  TRACING_PATHS,
  TRACING_TOLERANCE,
  TRACING_VIEWBOX,
  completionPhrase,
  pathsByDifficulty,
  scoreTracing,
  tracingPathById,
  type TracingDifficulty,
  type TracingPathId,
  type TracingPoint,
  type TracingScore,
} from '@/lib/motorTracing';
import { RewardAudio, speakText, stopSpeaking } from '@/lib/sensoryAudio';

const DIFFICULTY_ORDER: TracingDifficulty[] = [
  'beginner',
  'intermediate',
  'advanced',
];

function pointsToPolyline(points: TracingPoint[]) {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

function StarMarker({ x, y }: { x: number; y: number }) {
  const size = 14;
  return (
    <polygon
      points={`${x},${y - size} ${x + size * 0.95},${y + size * 0.3} ${x + size * 0.35},${y + size * 0.95} ${x - size * 0.35},${y + size * 0.95} ${x - size * 0.95},${y + size * 0.3}`}
      fill="#fbbf24"
      stroke="#d97706"
      strokeWidth={1.5}
      aria-hidden
    />
  );
}

/**
 * محرك التتبع البصري الحركي: مسارات متدرجة + تقييم دقة/سلاسة + تعزيز صوتي.
 */
export default function MotorTracingEngine({
  initialPathId = 'line_horizontal',
  soundOn = true,
  className,
}: {
  initialPathId?: TracingPathId;
  soundOn?: boolean;
  className?: string;
}) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [difficulty, setDifficulty] = useState<TracingDifficulty>('beginner');
  const [pathId, setPathId] = useState<TracingPathId>(initialPathId);
  const [points, setPoints] = useState<TracingPoint[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [score, setScore] = useState<TracingScore | null>(null);
  const [finished, setFinished] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const audioRef = useRef<RewardAudio | null>(null);
  const soundRef = useRef(soundOn);
  const langRef = useRef(lang);

  useEffect(() => {
    soundRef.current = soundOn;
    langRef.current = lang;
  }, [soundOn, lang]);

  const path = tracingPathById(pathId) ?? TRACING_PATHS[0];
  const difficultyPaths = pathsByDifficulty(difficulty);

  const getAudio = () => {
    if (!audioRef.current) audioRef.current = new RewardAudio();
    return audioRef.current;
  };

  useEffect(
    () => () => {
      stopSpeaking();
    },
    []
  );

  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }, []);

  const resetStroke = useCallback(() => {
    setPoints([]);
    setScore(null);
    setFinished(false);
    setDrawing(false);
  }, []);

  const selectPath = (id: TracingPathId) => {
    setPathId(id);
    resetStroke();
  };

  const selectDifficulty = (level: TracingDifficulty) => {
    setDifficulty(level);
    const first = pathsByDifficulty(level)[0];
    if (first) {
      setPathId(first.id);
      resetStroke();
    }
  };

  const finishStroke = useCallback(
    (stroke: TracingPoint[]) => {
      const result = scoreTracing(stroke, path);
      setScore(result);
      if (result.completed) {
        setFinished(true);
        if (soundRef.current) {
          getAudio().playChime();
          speakText(completionPhrase(result, langRef.current === 'ar'), {
            lang: langRef.current,
            rate: 0.82,
          });
        }
      }
    },
    [path]
  );

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (finished) return;
    const loc = clientToSvg(e.clientX, e.clientY);
    if (!loc) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrawing(true);
    setScore(null);
    const pt: TracingPoint = { x: loc.x, y: loc.y, t: Date.now() };
    setPoints([pt]);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing || finished) return;
    const loc = clientToSvg(e.clientX, e.clientY);
    if (!loc) return;
    setPoints((prev) => {
      const last = prev[prev.length - 1];
      if (last && distance(last, loc) < 3) return prev;
      return [...prev, { x: loc.x, y: loc.y, t: Date.now() }];
    });
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDrawing(false);
    setPoints((prev) => {
      finishStroke(prev);
      return prev;
    });
  };

  const difficultyLabel = (level: TracingDifficulty) => {
    if (level === 'beginner') return isAr ? 'مبتدئ' : 'Beginner';
    if (level === 'intermediate') return isAr ? 'متوسط' : 'Intermediate';
    return isAr ? 'متقدم' : 'Advanced';
  };

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap gap-2">
        {DIFFICULTY_ORDER.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => selectDifficulty(level)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              difficulty === level
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white/70 text-slate-700 hover:bg-sky-50'
            }`}
          >
            {difficultyLabel(level)}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {difficultyPaths.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => selectPath(p.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs sm:text-sm transition ${
              pathId === p.id
                ? 'border-sky-400 bg-sky-50 text-sky-900'
                : 'border-slate-200 bg-white/60 text-slate-600 hover:border-sky-200'
            }`}
          >
            {isAr ? p.labelAr : p.labelEn}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-slate-50 to-sky-50/80 p-3 shadow-inner">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${TRACING_VIEWBOX.width} ${TRACING_VIEWBOX.height}`}
          className="mx-auto w-full max-w-lg touch-none select-none"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          role="img"
          aria-label={
            isAr
              ? `مسار ${path.labelAr} — اسحب من النقطة الخضراء إلى النجمة`
              : `Trace ${path.labelEn} — drag from green dot to star`
          }
        >
          <path
            d={path.pathD}
            fill="none"
            stroke="#bfdbfe"
            strokeWidth={26}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
          />
          <path
            d={path.pathD}
            fill="none"
            stroke="#93c5fd"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 10"
            opacity={0.5}
          />

          <circle
            cx={path.start.x}
            cy={path.start.y}
            r={10}
            fill="#22c55e"
            stroke="#15803d"
            strokeWidth={2}
          />
          <StarMarker x={path.end.x} y={path.end.y} />

          {points.length > 1 ? (
            <polyline
              points={pointsToPolyline(points)}
              fill="none"
              stroke="#0369a1"
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
          ) : null}
        </svg>

        <p className="mt-2 text-center text-xs text-slate-500">
          {isAr
            ? 'ابدأ من النقطة الخضراء واتبع المسار حتى النجمة'
            : 'Start at the green dot and follow the path to the star'}
        </p>
      </div>

      {score ? (
        <div
          className={`mt-4 rounded-xl border p-3 text-sm ${
            score.completed
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
              : 'border-amber-200 bg-amber-50/80 text-amber-900'
          }`}
        >
          <p className="font-medium">
            {score.completed
              ? isAr
                ? 'أكملت المسار!'
                : 'Path completed!'
              : isAr
                ? 'استمر في المحاولة'
                : 'Keep trying'}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
            <div>
              <span className="block text-lg font-semibold">{score.accuracy}%</span>
              {isAr ? 'الدقة' : 'Accuracy'}
            </div>
            <div>
              <span className="block text-lg font-semibold">{score.smoothness}%</span>
              {isAr ? 'السلاسة' : 'Smoothness'}
            </div>
            <div>
              <span className="block text-lg font-semibold">{score.coverage}%</span>
              {isAr ? 'التغطية' : 'Coverage'}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={resetStroke}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          {isAr ? 'مسح وإعادة' : 'Clear & retry'}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {isAr
          ? `هامش التتبع ≈ ${TRACING_TOLERANCE}px — يعمل باللمس أو الماوس`
          : `Trace margin ≈ ${TRACING_TOLERANCE}px — touch or mouse`}
      </p>
    </div>
  );
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

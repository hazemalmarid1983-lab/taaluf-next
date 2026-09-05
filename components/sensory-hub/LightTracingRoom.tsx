'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SensoryRoomShell from '@/components/sensory-hub/SensoryRoomShell';
import { useSensoryRoomSession } from '@/components/sensory-hub/useSensoryRoomSession';
import { useLanguage } from '@/components/LanguageProvider';
import {
  pathsByDifficulty,
  scoreTracing,
  TRACING_TOLERANCE,
  tracingPathById,
  type TracingDifficulty,
  type TracingPathId,
  type TracingPoint,
} from '@/lib/motorTracing';
import { effectiveBrightness, safeSaturation } from '@/lib/sensoryHub';
import {
  sensoryOverlayClass,
  useSensoryImmersiveChrome,
} from '@/components/sensory-hub/SensoryImmersiveContext';

export default function LightTracingRoom() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const session = useSensoryRoomSession('tracing');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<TracingPoint[]>([]);
  const drawingRef = useRef(false);

  const [difficulty, setDifficulty] = useState<TracingDifficulty>('beginner');
  const [pathId, setPathId] = useState<TracingPathId>(
    pathsByDifficulty('beginner')[0]?.id ?? 'line_horizontal'
  );
  const path = tracingPathById(pathId)!;
  const paths = pathsByDifficulty(difficulty);

  const resetStroke = useCallback(() => {
    pointsRef.current = [];
    drawingRef.current = false;
  }, []);

  useEffect(() => {
    resetStroke();
    const first = pathsByDifficulty(difficulty)[0];
    if (first) setPathId(first.id);
  }, [difficulty, resetStroke]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const bright = effectiveBrightness(session.settings);
      const sat = safeSaturation(50, session.settings);

      ctx.fillStyle = `rgb(${Math.round(12 * bright)}, ${Math.round(10 * bright)}, ${Math.round(28 * bright)})`;
      ctx.fillRect(0, 0, w, h);

      const scale = Math.min(w / 420, h / 320) * (0.75 + session.settings.sensitivity * 0.2);
      const ox = (w - 400 * scale) / 2;
      const oy = (h - 300 * scale) / 2;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale);

      ctx.strokeStyle = `hsla(200, ${sat}%, 70%, ${0.25 * bright})`;
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const path2d = new Path2D(path.pathD);
      ctx.stroke(path2d);

      ctx.strokeStyle = `hsla(280, ${sat}%, 75%, ${0.45 * bright})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 8]);
      ctx.stroke(path2d);
      ctx.setLineDash([]);

      ctx.fillStyle = `rgba(34, 197, 94, ${0.85 * bright})`;
      ctx.beginPath();
      ctx.arc(path.start.x, path.start.y, 9, 0, Math.PI * 2);
      ctx.fill();

      if (pointsRef.current.length > 1) {
        ctx.strokeStyle = `hsla(190, ${sat}%, 80%, ${0.9 * bright})`;
        ctx.lineWidth = 5;
        ctx.shadowColor = `hsla(190, ${sat}%, 70%, 0.8)`;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        pointsRef.current.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
      requestAnimationFrame(draw);
    };
    const id = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(id);
    };
  }, [path, session.settings]);

  const toLocal = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const w = canvas.width;
    const h = canvas.height;
    const scale = Math.min(w / 420, h / 320) * (0.75 + session.settings.sensitivity * 0.2);
    const ox = (w - 400 * scale) / 2;
    const oy = (h - 300 * scale) / 2;
    return {
      x: (clientX - rect.left - ox) / scale,
      y: (clientY - rect.top - oy) / scale,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    pointsRef.current = [];
    const loc = toLocal(e.clientX, e.clientY);
    if (loc) pointsRef.current.push({ ...loc, t: Date.now() });
    session.bumpInteraction();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const loc = toLocal(e.clientX, e.clientY);
    if (!loc) return;
    pointsRef.current.push({ ...loc, t: Date.now() });
  };

  const onPointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const score = scoreTracing(pointsRef.current, path, TRACING_TOLERANCE);
    session.bumpInteraction();
    if (score.completed) {
      session.audio.current?.chime(session.settings);
    }
  };

  return (
    <SensoryRoomShell
      roomId="tracing"
      titleAr="غرفة الرسم الضوئي"
      titleEn="Light tracing room"
      isAr={isAr}
      elapsedMs={session.elapsedMs}
      interactions={session.interactions}
      calmIndex={session.calmIndex}
      engagementIndex={session.engagementIndex}
      interactionRate={session.interactionRate}
      remainingSec={session.remainingSec}
      settings={session.settings}
      onSettingsChange={session.setSettings}
      onExit={session.exit}
      sessionPhase={session.sessionPhase}
      endReason={session.endReason}
      resultStats={session.resultStats}
      onReplay={session.replay}
      onExitGroup={session.exitGroup}
      className="bg-violet-950"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      <TracingPathPicker
        isAr={isAr}
        difficulty={difficulty}
        pathId={pathId}
        paths={paths}
        onDifficulty={setDifficulty}
        onPath={(id) => {
          setPathId(id);
          resetStroke();
        }}
      />
    </SensoryRoomShell>
  );
}

function TracingPathPicker({
  isAr,
  difficulty,
  pathId,
  paths,
  onDifficulty,
  onPath,
}: {
  isAr: boolean;
  difficulty: TracingDifficulty;
  pathId: TracingPathId;
  paths: ReturnType<typeof pathsByDifficulty>;
  onDifficulty: (d: TracingDifficulty) => void;
  onPath: (id: TracingPathId) => void;
}) {
  const immersive = useSensoryImmersiveChrome();
  return (
    <div
      className={`absolute bottom-6 left-1/2 z-10 flex max-w-lg -translate-x-1/2 flex-wrap justify-center gap-2 px-4 ${sensoryOverlayClass(immersive?.controlsVisible ?? false)}`}
    >
      {(['beginner', 'intermediate', 'advanced'] as TracingDifficulty[]).map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onDifficulty(level)}
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
            difficulty === level
              ? 'bg-violet-500 text-white'
              : 'bg-black/30 text-white/70'
          }`}
        >
          {level === 'beginner'
            ? isAr
              ? 'مبتدئ'
              : 'Beginner'
            : level === 'intermediate'
              ? isAr
                ? 'متوسط'
                : 'Mid'
              : isAr
                ? 'متقدم'
                : 'Advanced'}
        </button>
      ))}
      {paths.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPath(p.id)}
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
            pathId === p.id ? 'bg-cyan-600/80 text-white' : 'bg-black/30 text-white/70'
          }`}
        >
          {isAr ? p.labelAr : p.labelEn}
        </button>
      ))}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import SensoryRoomShell from '@/components/sensory-hub/SensoryRoomShell';
import { useSensoryRoomSession } from '@/components/sensory-hub/useSensoryRoomSession';
import { useLanguage } from '@/components/LanguageProvider';
import { BREATHING_PHASES, BREATH_RESTING_SCALE } from '@/lib/regulationZones';
import { effectiveBrightness } from '@/lib/sensoryHub';
import {
  sensoryOverlayClass,
  useSensoryImmersiveChrome,
} from '@/components/sensory-hub/SensoryImmersiveContext';
import { speakText, stopSpeaking } from '@/lib/sensoryAudio';

type Star = { x: number; y: number; r: number; twinkle: number; speed: number };

export default function CalmingStarRoom() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number | null>(null);

  const {
    settings,
    setSettings,
    interactions,
    bumpInteraction,
    elapsedMs,
    calmIndex,
    engagementIndex,
    interactionRate,
    remainingSec,
    audio,
    setBreathingCycles,
    setEmergencyCalmCount,
    exit,
    sessionPhase,
    endReason,
    resultStats,
    replay,
    exitGroup,
  } = useSensoryRoomSession('stars');
  const [breathRunning, setBreathRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [calmOverlay, setCalmOverlay] = useState(0);

  useEffect(() => {
    if (!breathRunning) return undefined;
    const phase = BREATHING_PHASES[phaseIndex];
    speakText(isAr ? phase.cueAr : phase.cueEn, { lang, rate: 0.72 });
    const timer = window.setTimeout(() => {
      if (phaseIndex + 1 < BREATHING_PHASES.length) {
        setPhaseIndex(phaseIndex + 1);
        return;
      }
      setBreathingCycles((n) => n + 1);
      setPhaseIndex(0);
    }, phase.seconds * 1000);
    return () => {
      window.clearTimeout(timer);
      stopSpeaking();
    };
  }, [breathRunning, phaseIndex, isAr, lang, setBreathingCycles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (!starsRef.current.length) {
        starsRef.current = Array.from({ length: 90 }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.8 + 0.4,
          twinkle: Math.random() * Math.PI * 2,
          speed: 0.015 + Math.random() * 0.02,
        }));
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const bright = effectiveBrightness(settings);
      ctx.fillStyle = `rgb(${Math.round(8 * bright)}, ${Math.round(12 * bright)}, ${Math.round(32 * bright)})`;
      ctx.fillRect(0, 0, w, h);

      for (const star of starsRef.current) {
        star.twinkle += star.speed;
        const alpha = (0.35 + Math.sin(star.twinkle) * 0.25) * bright;
        ctx.fillStyle = `rgba(220, 230, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const phase = BREATHING_PHASES[phaseIndex];
      const scale = breathRunning ? phase.scale : BREATH_RESTING_SCALE;
      const cx = w / 2;
      const cy = h * 0.48;
      const radius = 70 * scale * (0.85 + settings.sensitivity * 0.15);

      const glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.4);
      glow.addColorStop(0, `rgba(129, 140, 248, ${0.35 * bright})`);
      glow.addColorStop(1, 'rgba(129, 140, 248, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(165, 180, 252, ${0.65 * bright})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      if (calmOverlay > 0) {
        ctx.fillStyle = `rgba(30, 58, 138, ${calmOverlay * 0.45})`;
        ctx.fillRect(0, 0, w, h);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopSpeaking();
    };
  }, [breathRunning, phaseIndex, calmOverlay, settings]);

  const emergencyCalm = () => {
    bumpInteraction();
    setEmergencyCalmCount((n) => n + 1);
    setCalmOverlay(1);
    setBreathRunning(true);
    setPhaseIndex(0);
    audio.current?.calmTone(settings);
    speakText(isAr ? 'خذ نفس عميق' : 'Take a deep breath', { lang, rate: 0.75 });
    window.setTimeout(() => setCalmOverlay(0.3), 4000);
  };

  return (
    <SensoryRoomShell
      roomId="stars"
      titleAr="غرفة النجوم والتنفس"
      titleEn="Calming star room"
      isAr={isAr}
      elapsedMs={elapsedMs}
      interactions={interactions}
      calmIndex={calmIndex}
      engagementIndex={engagementIndex}
      interactionRate={interactionRate}
      remainingSec={remainingSec}
      settings={settings}
      onSettingsChange={setSettings}
      onExit={exit}
      sessionPhase={sessionPhase}
      endReason={endReason}
      resultStats={resultStats}
      onReplay={replay}
      onExitGroup={exitGroup}
      className="bg-slate-950"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <StarsRegulationPanel
        isAr={isAr}
        breathRunning={breathRunning}
        onToggleBreath={() => {
          bumpInteraction();
          setBreathRunning((r) => !r);
          setPhaseIndex(0);
        }}
        onEmergencyCalm={emergencyCalm}
      />
    </SensoryRoomShell>
  );
}

function StarsRegulationPanel({
  isAr,
  breathRunning,
  onToggleBreath,
  onEmergencyCalm,
}: {
  isAr: boolean;
  breathRunning: boolean;
  onToggleBreath: () => void;
  onEmergencyCalm: () => void;
}) {
  const immersive = useSensoryImmersiveChrome();
  const overlay = sensoryOverlayClass(immersive?.controlsVisible ?? false, true);
  return (
    <div
      className={`absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 ${overlay}`}
    >
      <button
        type="button"
        onClick={onToggleBreath}
        className="rounded-2xl bg-indigo-500/70 px-5 py-2.5 text-xs font-black text-white shadow-lg backdrop-blur-sm"
      >
        {breathRunning
          ? isAr
            ? '⏸ إيقاف'
            : '⏸ Pause'
          : isAr
            ? '▶ تنفس'
            : '▶ Breathe'}
      </button>
      <button
        type="button"
        onClick={onEmergencyCalm}
        className="rounded-full border border-sky-300/30 bg-sky-900/40 px-4 py-2 text-[11px] font-black text-sky-100 backdrop-blur-md"
      >
        {isAr ? '🫧 اهدأ' : '🫧 Calm'}
      </button>
    </div>
  );
}

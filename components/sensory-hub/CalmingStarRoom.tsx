'use client';

import { useEffect, useRef, useState } from 'react';
import SensoryRoomShell from '@/components/sensory-hub/SensoryRoomShell';
import { useSensoryRoomSession } from '@/components/sensory-hub/useSensoryRoomSession';
import { useLanguage } from '@/components/LanguageProvider';
import {
  BREATHING_PHASES,
  BREATH_RESTING_SCALE,
  breathScaleAt,
} from '@/lib/regulationZones';
import { effectiveBrightness } from '@/lib/sensoryHub';
import {
  sensoryOverlayClass,
  useSensoryImmersiveChrome,
} from '@/components/sensory-hub/SensoryImmersiveContext';
import { speakText, stopSpeaking } from '@/lib/sensoryAudio';

type Star = { x: number; y: number; r: number; twinkle: number; speed: number };

type BreathClock = { running: boolean; index: number; startedAt: number };

export default function CalmingStarRoom() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);

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

  // الرسم والتوقيت والنطق يقرؤون الساعة نفسها، فلا ينفصل حجم الدائرة عن الكلام المعروض/المنطوق.
  const clockRef = useRef<BreathClock>({ running: false, index: 0, startedAt: 0 });
  const scaleRef = useRef(BREATH_RESTING_SCALE);
  const calmOverlayRef = useRef(0);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const langRef = useRef({ isAr, lang });
  langRef.current = { isAr, lang };
  const cyclesRef = useRef(setBreathingCycles);
  cyclesRef.current = setBreathingCycles;

  const speakPhase = (index: number) => {
    const phase = BREATHING_PHASES[index];
    const { isAr: ar, lang: l } = langRef.current;
    speakText(ar ? phase.cueAr : phase.cueEn, { lang: l, rate: 0.72 });
  };

  const startBreathing = () => {
    clockRef.current = { running: true, index: 0, startedAt: performance.now() };
    setBreathRunning(true);
    speakPhase(0);
  };

  const stopBreathing = () => {
    clockRef.current = { ...clockRef.current, running: false };
    setBreathRunning(false);
    stopSpeaking();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    let raf = 0;

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

    const draw = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const s = settingsRef.current;
      const bright = effectiveBrightness(s);
      const clock = clockRef.current;

      let phaseProgress = 0;
      let secondsLeft = 0;
      if (clock.running) {
        let phase = BREATHING_PHASES[clock.index];
        let elapsed = (now - clock.startedAt) / 1000;
        if (elapsed >= phase.seconds) {
          const next = (clock.index + 1) % BREATHING_PHASES.length;
          if (next === 0) cyclesRef.current((n) => n + 1);
          clockRef.current = { running: true, index: next, startedAt: now };
          speakPhase(next);
          phase = BREATHING_PHASES[next];
          elapsed = 0;
        }
        const current = clockRef.current;
        scaleRef.current = breathScaleAt(current.index, elapsed);
        phaseProgress = Math.min(1, elapsed / phase.seconds);
        secondsLeft = Math.max(1, Math.ceil(phase.seconds - elapsed));
      } else {
        scaleRef.current += (BREATH_RESTING_SCALE - scaleRef.current) * 0.04;
      }

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

      const cx = w / 2;
      const cy = h * 0.46;
      const maxRadius = Math.min(w, h) * 0.26 * (0.85 + s.sensitivity * 0.15);
      const radius = maxRadius * scaleRef.current;

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

      if (clock.running) {
        const phase = BREATHING_PHASES[clockRef.current.index];
        ctx.strokeStyle = `rgba(224, 231, 255, ${0.8 * bright})`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius + 18, -Math.PI / 2, -Math.PI / 2 + phaseProgress * Math.PI * 2);
        ctx.stroke();

        const { isAr: ar } = langRef.current;
        ctx.fillStyle = `rgba(238, 242, 255, ${0.95 * bright + 0.05})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${Math.round(Math.max(26, maxRadius * 0.28))}px system-ui, sans-serif`;
        ctx.fillText(ar ? phase.labelAr : phase.labelEn, cx, cy - maxRadius * 0.08);
        ctx.font = `700 ${Math.round(Math.max(18, maxRadius * 0.16))}px system-ui, sans-serif`;
        ctx.fillStyle = `rgba(199, 210, 254, ${0.9 * bright})`;
        ctx.fillText(String(secondsLeft), cx, cy + maxRadius * 0.2);
      }

      if (calmOverlayRef.current > 0) {
        ctx.fillStyle = `rgba(30, 58, 138, ${calmOverlayRef.current * 0.45})`;
        ctx.fillRect(0, 0, w, h);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sessionPhase !== 'playing') stopBreathing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPhase]);

  const emergencyCalm = () => {
    bumpInteraction();
    setEmergencyCalmCount((n) => n + 1);
    calmOverlayRef.current = 1;
    audio.current?.calmTone(settings);
    startBreathing();
    window.setTimeout(() => {
      calmOverlayRef.current = 0.3;
    }, 4000);
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
          if (breathRunning) stopBreathing();
          else startBreathing();
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

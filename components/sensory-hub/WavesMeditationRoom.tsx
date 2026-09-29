'use client';

import { useEffect, useRef, useState } from 'react';
import SensoryRoomShell from '@/components/sensory-hub/SensoryRoomShell';
import { useSensoryRoomSession } from '@/components/sensory-hub/useSensoryRoomSession';
import { useLanguage } from '@/components/LanguageProvider';
import { effectiveBrightness } from '@/lib/sensoryHub';
import { normalizeTilt } from '@/lib/sensoryHubEffects';
import {
  createSwell,
  stepBoat,
  stepSwells,
  waterSurfaceY,
  type BoatState,
  type Swell,
} from '@/lib/sensoryWaves';
import {
  sensoryOverlayClass,
  useSensoryImmersiveChrome,
} from '@/components/sensory-hub/SensoryImmersiveContext';

type OrientationPermissionApi = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
};

function needsOrientationPermission() {
  if (typeof DeviceOrientationEvent === 'undefined') return false;
  return typeof (DeviceOrientationEvent as OrientationPermissionApi).requestPermission === 'function';
}

export default function WavesMeditationRoom() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const session = useSensoryRoomSession('waves');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // يُستخدم الميل فقط بعد وصول قراءة فعلية؛ الحواسيب تعلن الدعم ولا ترسل قراءات.
  const betaRef = useRef<number | null>(null);
  const pointerRef = useRef<{ down: boolean; x: number }>({ down: false, x: 0 });
  const touchTargetRef = useRef<{ x: number; at: number } | null>(null);
  const swellsRef = useRef<Swell[]>([]);
  const boatRef = useRef<BoatState | null>(null);
  const lastDragSwellRef = useRef(0);
  const lastSplashRef = useRef(0);
  const settingsRef = useRef(session.settings);
  settingsRef.current = session.settings;
  const audioRef = session.audio;
  const [showTiltButton, setShowTiltButton] = useState(false);

  useEffect(() => {
    setShowTiltButton(needsOrientationPermission());
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta != null) betaRef.current = e.beta;
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, []);

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

    let phase = 0;
    let lastLap = 0;
    let raf = 0;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const bright = effectiveBrightness(settingsRef.current);
      phase += 0.018;
      swellsRef.current = stepSwells(swellsRef.current, w * 1.2);
      const swells = swellsRef.current;

      if (!boatRef.current) boatRef.current = { x: w / 2, vx: 0 };
      const touch = touchTargetRef.current;
      const recentTouch =
        touch && (pointerRef.current.down || Date.now() - touch.at < 3000);
      const targetX = recentTouch
        ? touch.x
        : betaRef.current != null
          ? w / 2 + normalizeTilt(betaRef.current, 0, w) * w * 0.3
          : touch?.x ?? boatRef.current.x;
      const boat = stepBoat(boatRef.current, Math.max(40, Math.min(w - 40, targetX)));
      boatRef.current = boat;

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, `rgba(15, 40, 80, ${bright})`);
      grad.addColorStop(1, `rgba(8, 25, 55, ${bright})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (let layer = 0; layer < 3; layer += 1) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 8) {
          ctx.lineTo(x, waterSurfaceY(x, h, phase, layer, swells));
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = `rgba(56, 189, 248, ${(0.14 + layer * 0.06) * bright})`;
        ctx.fill();
      }

      for (const s of swells) {
        for (const dir of [-1, 1]) {
          const fx = s.x + dir * s.radius;
          if (fx < -20 || fx > w + 20) continue;
          const fy = waterSurfaceY(fx, h, phase, 0, swells);
          ctx.fillStyle = `rgba(224, 242, 254, ${Math.min(0.7, s.amp / 60) * bright})`;
          ctx.beginPath();
          ctx.ellipse(fx, fy + 2, 22, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const surfaceY = waterSurfaceY(boat.x, h, phase, 0, swells);
      const slope =
        (waterSurfaceY(boat.x + 14, h, phase, 0, swells) -
          waterSurfaceY(boat.x - 14, h, phase, 0, swells)) /
        28;
      ctx.save();
      ctx.translate(boat.x, surfaceY - 4);
      ctx.rotate(Math.atan(slope) + Math.max(-0.25, Math.min(0.25, boat.vx * 0.02)));
      ctx.fillStyle = `rgba(254, 243, 199, ${0.95 * bright})`;
      ctx.beginPath();
      ctx.moveTo(-34, -2);
      ctx.lineTo(34, -2);
      ctx.lineTo(24, 10);
      ctx.lineTo(-24, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-2, -46, 4, 44);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * bright})`;
      ctx.beginPath();
      ctx.moveTo(2, -44);
      ctx.lineTo(28, -8);
      ctx.lineTo(2, -8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const now = Date.now();
      if (now - lastLap > 4200) {
        lastLap = now;
        audioRef.current?.waveLap(settingsRef.current);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [audioRef]);

  const splash = (x: number, strength: number) => {
    swellsRef.current = [...swellsRef.current, createSwell(x, strength)].slice(-12);
    const now = Date.now();
    if (now - lastSplashRef.current > 350) {
      lastSplashRef.current = now;
      audioRef.current?.waveSplash(settingsRef.current, strength);
    }
  };

  return (
    <SensoryRoomShell
      roomId="waves"
      titleAr="تأمل الموجة والقارب"
      titleEn="Wave & boat meditation"
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
      className="bg-blue-950"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* بعض الأجهزة لا تدعم الالتقاط */
          }
          const x = e.nativeEvent.offsetX;
          pointerRef.current = { down: true, x };
          touchTargetRef.current = { x, at: Date.now() };
          session.bumpInteraction();
          splash(x, 0.9);
        }}
        onPointerMove={(e) => {
          if (!pointerRef.current.down) return;
          const x = e.nativeEvent.offsetX;
          const moved = Math.abs(x - pointerRef.current.x);
          pointerRef.current = { down: true, x };
          touchTargetRef.current = { x, at: Date.now() };
          const now = Date.now();
          if (moved > 2 && now - lastDragSwellRef.current > 140) {
            lastDragSwellRef.current = now;
            splash(x, Math.min(0.7, 0.3 + moved / 40));
          }
        }}
        onPointerUp={() => {
          pointerRef.current = { ...pointerRef.current, down: false };
        }}
        onPointerCancel={() => {
          pointerRef.current = { ...pointerRef.current, down: false };
        }}
      />
      {showTiltButton && (
        <WavesTiltButton
          isAr={isAr}
          onResult={(granted) => {
            if (granted) setShowTiltButton(false);
          }}
        />
      )}
    </SensoryRoomShell>
  );
}

function WavesTiltButton({
  isAr,
  onResult,
}: {
  isAr: boolean;
  onResult: (granted: boolean) => void;
}) {
  const immersive = useSensoryImmersiveChrome();
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={async () => {
        const DOE = DeviceOrientationEvent as OrientationPermissionApi;
        if (DOE.requestPermission) {
          const r = await DOE.requestPermission();
          onResult(r === 'granted');
        }
      }}
      className={`absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/15 px-3 py-2 text-[10px] font-bold text-white backdrop-blur-sm ${sensoryOverlayClass(immersive?.controlsVisible ?? false)}`}
    >
      {isAr ? 'إمالة الجهاز' : 'Device tilt'}
    </button>
  );
}

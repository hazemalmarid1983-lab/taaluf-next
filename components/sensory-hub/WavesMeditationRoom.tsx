'use client';

import { useEffect, useRef, useState } from 'react';
import SensoryRoomShell from '@/components/sensory-hub/SensoryRoomShell';
import { useSensoryRoomSession } from '@/components/sensory-hub/useSensoryRoomSession';
import { useLanguage } from '@/components/LanguageProvider';
import { effectiveBrightness } from '@/lib/sensoryHub';
import { normalizeTilt } from '@/lib/sensoryHubEffects';
import {
  sensoryOverlayClass,
  useSensoryImmersiveChrome,
} from '@/components/sensory-hub/SensoryImmersiveContext';

export default function WavesMeditationRoom() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const session = useSensoryRoomSession('waves');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tiltRef = useRef(0);
  const dragRef = useRef(0);
  const betaRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const [orientOk, setOrientOk] = useState(false);
  const [useDrag, setUseDrag] = useState(false);

  useEffect(() => {
    const request = async () => {
      if (typeof DeviceOrientationEvent === 'undefined') {
        setUseDrag(true);
        return;
      }
      const DOE = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
      };
      try {
        if (typeof DOE.requestPermission === 'function') {
          const res = await DOE.requestPermission();
          setOrientOk(res === 'granted');
          setUseDrag(res !== 'granted');
        } else {
          setOrientOk(true);
        }
      } catch {
        setUseDrag(true);
      }
    };
    void request();
  }, []);

  useEffect(() => {
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta != null) betaRef.current = e.beta;
    };
    if (orientOk) window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, [orientOk]);

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

    let lastLap = 0;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const bright = effectiveBrightness(session.settings);
      phaseRef.current += 0.018;

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, `rgba(15, 40, 80, ${bright})`);
      grad.addColorStop(1, `rgba(8, 25, 55, ${bright})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      tiltRef.current = normalizeTilt(betaRef.current, dragRef.current, w);
      const boatX = w / 2 + tiltRef.current * w * 0.18;
      const boatY = h * 0.48;

      for (let layer = 0; layer < 3; layer += 1) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 8) {
          const y =
            h * (0.55 + layer * 0.08) +
            Math.sin(x * 0.008 + phaseRef.current + layer) * (18 - layer * 4) +
            tiltRef.current * 12;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = `rgba(56, 189, 248, ${(0.12 + layer * 0.06) * bright})`;
        ctx.fill();
      }

      ctx.save();
      ctx.translate(boatX, boatY);
      ctx.rotate(tiltRef.current * 0.35);
      ctx.fillStyle = `rgba(254, 243, 199, ${0.9 * bright})`;
      ctx.beginPath();
      ctx.moveTo(-28, 8);
      ctx.lineTo(28, 8);
      ctx.lineTo(0, -16);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-4, -28, 8, 18);
      ctx.restore();

      const now = Date.now();
      if (now - lastLap > 2800) {
        lastLap = now;
        session.audio.current?.waveLap(session.settings);
      }

      requestAnimationFrame(draw);
    };
    const id = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(id);
    };
  }, [session.settings]);

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
        onPointerDown={() => session.bumpInteraction()}
        onPointerMove={(e) => {
          if (useDrag || !orientOk) {
            dragRef.current = e.clientX - window.innerWidth / 2;
            session.bumpInteraction();
          }
        }}
      />
      {!orientOk && (
        <WavesTiltButton
          isAr={isAr}
          onResult={(granted) => {
            setOrientOk(granted);
            setUseDrag(!granted);
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
      onClick={async () => {
        const DOE = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
          requestPermission?: () => Promise<'granted' | 'denied'>;
        };
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

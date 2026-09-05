'use client';

import { useEffect, useRef } from 'react';
import SensoryRoomShell from '@/components/sensory-hub/SensoryRoomShell';
import { useSensoryRoomSession } from '@/components/sensory-hub/useSensoryRoomSession';
import { useLanguage } from '@/components/LanguageProvider';
import {
  effectiveBrightness,
  safeSaturation,
} from '@/lib/sensoryHub';

type Bubble = {
  id: number;
  x: number;
  y: number;
  r: number;
  baseR: number;
  vx: number;
  vy: number;
  hue: number;
  holdId: number | null;
  holdStart: number;
};

const LONG_PRESS_MS = 520;

function hitBubble(b: Bubble, x: number, y: number) {
  const dx = x - b.x;
  const dy = y - b.y;
  return Math.hypot(dx, dy) <= b.r + 8;
}

function spawnBubble(w: number, h: number, id: number, sensitivity: number): Bubble {
  const baseR = 18 + Math.random() * 22 * sensitivity;
  return {
    id,
    x: baseR + Math.random() * (w - baseR * 2),
    y: h + baseR,
    r: baseR,
    baseR,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -(0.25 + Math.random() * 0.45) * (0.7 + sensitivity * 0.5),
    hue: 185 + Math.random() * 35,
    holdId: null,
    holdStart: 0,
  };
}

export default function BubblePopRoom() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const session = useSensoryRoomSession('bubbles');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const idRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (bubblesRef.current.length < 8) {
        while (bubblesRef.current.length < 10) {
          idRef.current += 1;
          bubblesRef.current.push(
            spawnBubble(canvas.width, canvas.height, idRef.current, session.settings.sensitivity)
          );
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const bright = effectiveBrightness(session.settings);
      ctx.fillStyle = `rgba(4, 30, 44, ${0.92 * bright})`;
      ctx.fillRect(0, 0, w, h);

      const now = Date.now();
      bubblesRef.current = bubblesRef.current.filter((b) => b.y + b.r > -40);

      for (const b of bubblesRef.current) {
        if (b.holdId !== null && now - b.holdStart > LONG_PRESS_MS) {
          b.r = Math.min(b.baseR * 1.85, b.r + 0.6);
        }
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < b.r) b.x = b.r;
        if (b.x > w - b.r) b.x = w - b.r;

        const sat = safeSaturation(55, session.settings);
        const grad = ctx.createRadialGradient(
          b.x - b.r * 0.25,
          b.y - b.r * 0.25,
          b.r * 0.1,
          b.x,
          b.y,
          b.r
        );
        grad.addColorStop(0, `hsla(${b.hue}, ${sat}%, 78%, ${0.55 * bright})`);
        grad.addColorStop(0.55, `hsla(${b.hue}, ${sat}%, 55%, ${0.28 * bright})`);
        grad.addColorStop(1, `hsla(${b.hue}, ${sat}%, 40%, 0.05)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `hsla(${b.hue}, ${sat}%, 85%, ${0.35 * bright})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      while (bubblesRef.current.length < 10) {
        idRef.current += 1;
        bubblesRef.current.push(
          spawnBubble(w, h, idRef.current, session.settings.sensitivity)
        );
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [session.settings]);

  const popAt = (x: number, y: number, pointerId: number, longHold: boolean) => {
    const hit = bubblesRef.current.find((b) => hitBubble(b, x, y));
    if (!hit) return;
    if (longHold) {
      hit.r = hit.baseR * 1.9;
    }
    bubblesRef.current = bubblesRef.current.filter((b) => b.id !== hit.id);
    session.audio.current?.pop(session.settings, 520 + Math.random() * 180);
    session.bumpInteraction();
    idRef.current += 1;
    bubblesRef.current.push(
      spawnBubble(
        canvasRef.current?.width || 800,
        canvasRef.current?.height || 600,
        idRef.current,
        session.settings.sensitivity
      )
    );
    void pointerId;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const b = bubblesRef.current.find((bubble) =>
      hitBubble(bubble, e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    );
    if (b) {
      b.holdId = e.pointerId;
      b.holdStart = Date.now();
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    const held = bubblesRef.current.find((b) => b.holdId === e.pointerId);
    const longHold = held ? Date.now() - held.holdStart >= LONG_PRESS_MS : false;
    bubblesRef.current.forEach((b) => {
      if (b.holdId === e.pointerId) b.holdId = null;
    });
    popAt(x, y, e.pointerId, longHold);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <SensoryRoomShell
      roomId="bubbles"
      titleAr="غرفة الفقاعات"
      titleEn="Bubble pop room"
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
      className="bg-gradient-to-b from-cyan-950 to-slate-950"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label={isAr ? 'فقاعات تفاعلية' : 'Interactive bubbles'}
      />
    </SensoryRoomShell>
  );
}

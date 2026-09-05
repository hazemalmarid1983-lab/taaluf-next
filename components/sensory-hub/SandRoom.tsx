'use client';

import { useEffect, useRef } from 'react';
import SensoryRoomShell from '@/components/sensory-hub/SensoryRoomShell';
import { useSensoryRoomSession } from '@/components/sensory-hub/useSensoryRoomSession';
import { useLanguage } from '@/components/LanguageProvider';
import { effectiveBrightness } from '@/lib/sensoryHub';

type Grain = { x: number; y: number; vx: number; vy: number; r: number };

const LONG_PRESS = 480;

export default function SandRoom() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const session = useSensoryRoomSession('sand');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grainsRef = useRef<Grain[]>([]);
  const holdsRef = useRef<Map<number, number>>(new Map());
  const rafRef = useRef<number | null>(null);
  const lastSoundRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (!grainsRef.current.length) {
        for (let i = 0; i < 900; i += 1) {
          grainsRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: 0,
            vy: 0,
            r: 1.2 + Math.random() * 1.4,
          });
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const bright = effectiveBrightness(session.settings);
      ctx.fillStyle = `rgba(${Math.round(180 * bright)}, ${Math.round(145 * bright)}, ${Math.round(95 * bright)}, 0.25)`;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = `rgba(${Math.round(210 * bright)}, ${Math.round(175 * bright)}, ${Math.round(120 * bright)}, 0.92)`;

      for (const g of grainsRef.current) {
        g.vx *= 0.86;
        g.vy *= 0.86;
        g.x += g.vx;
        g.y += g.vy;
        if (g.y > h - 4) {
          g.y = h - 4;
          g.vy *= -0.2;
        }
        g.x = Math.max(2, Math.min(w - 2, g.x));
        g.y = Math.max(2, Math.min(h - 2, g.y));
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [session.settings]);

  const pushSand = (x: number, y: number, force: number, mound: boolean) => {
    const sens = session.settings.sensitivity;
    for (const g of grainsRef.current) {
      const dx = g.x - x;
      const dy = g.y - y;
      const d = Math.hypot(dx, dy);
      const reach = 40 + sens * 35 + (mound ? 30 : 0);
      if (d < reach) {
        const power = (1 - d / reach) * force * (0.8 + sens * 0.4);
        g.vx += (dx / (d || 1)) * power * -2.2;
        g.vy += (dy / (d || 1)) * power * -2.2 - (mound ? 0.8 : 0);
      }
    }
    if (mound) {
      for (let i = 0; i < 12; i += 1) {
        grainsRef.current.push({
          x: x + (Math.random() - 0.5) * 16,
          y: y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 0.6,
          r: 1.4 + Math.random(),
        });
      }
      if (grainsRef.current.length > 1400) {
        grainsRef.current.splice(0, grainsRef.current.length - 1400);
      }
    }
    const now = Date.now();
    if (now - lastSoundRef.current > 90) {
      lastSoundRef.current = now;
      session.audio.current?.sandFriction(session.settings, force);
    }
    session.bumpInteraction();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    holdsRef.current.set(e.pointerId, Date.now());
    pushSand(e.nativeEvent.offsetX, e.nativeEvent.offsetY, 0.6, false);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!holdsRef.current.has(e.pointerId)) return;
    const start = holdsRef.current.get(e.pointerId)!;
    const mound = Date.now() - start > LONG_PRESS;
    pushSand(e.nativeEvent.offsetX, e.nativeEvent.offsetY, mound ? 1 : 0.55, mound);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    holdsRef.current.delete(e.pointerId);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <SensoryRoomShell
      roomId="sand"
      titleAr="الرمل السحري"
      titleEn="Magic sand room"
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
      className="bg-amber-100"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </SensoryRoomShell>
  );
}

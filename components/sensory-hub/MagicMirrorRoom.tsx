'use client';

import { useEffect, useRef } from 'react';
import SensoryRoomShell from '@/components/sensory-hub/SensoryRoomShell';
import { useSensoryRoomSession } from '@/components/sensory-hub/useSensoryRoomSession';
import { useLanguage } from '@/components/LanguageProvider';
import { effectiveBrightness } from '@/lib/sensoryHub';

type Floaty = { x: number; y: number; vx: number; vy: number; emoji: string; size: number };

export default function MagicMirrorRoom() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const session = useSensoryRoomSession('mirror');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const floatiesRef = useRef<Floaty[]>([]);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        floatiesRef.current = [
          { x: 0.2, y: 0.3, vx: 0.0004, vy: -0.0003, emoji: '🦋', size: 28 },
          { x: 0.7, y: 0.5, vx: -0.0003, vy: -0.0002, emoji: '🦋', size: 22 },
          { x: 0.5, y: 0.15, vx: 0.0002, vy: 0.0001, emoji: '☁️', size: 36 },
          { x: 0.85, y: 0.25, vx: -0.00025, vy: 0.00015, emoji: '☁️', size: 30 },
        ];
      } catch {
        /* camera denied — overlay only */
      }
    };
    void start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
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

      ctx.clearRect(0, 0, w, h);

      if (video && video.readyState >= 2) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const scale = Math.max(w / vw, h / vh);
        const sw = vw * scale;
        const sh = vh * scale;
        ctx.save();
        ctx.filter = `brightness(${bright}) saturate(0.95)`;
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, (w - sw) / 2, (h - sh) / 2, sw, sh);
        ctx.restore();
      } else {
        ctx.fillStyle = `rgba(30, 27, 75, ${bright})`;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.font = '28px system-ui';
      for (const f of floatiesRef.current) {
        f.x += f.vx;
        f.y += f.vy;
        if (f.x < 0.05 || f.x > 0.95) f.vx *= -1;
        if (f.y < 0.08 || f.y > 0.88) f.vy *= -1;
        ctx.font = `${f.size}px system-ui`;
        ctx.globalAlpha = 0.75 * bright;
        ctx.fillText(f.emoji, f.x * w, f.y * h);
      }
      ctx.globalAlpha = 1;

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
      roomId="mirror"
      titleAr="المرآة السحرية"
      titleEn="Magic mirror"
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
      className="bg-indigo-950"
    >
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </SensoryRoomShell>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import SensoryRoomShell from '@/components/sensory-hub/SensoryRoomShell';
import { useSensoryRoomSession } from '@/components/sensory-hub/useSensoryRoomSession';
import { useLanguage } from '@/components/LanguageProvider';
import { effectiveBrightness } from '@/lib/sensoryHub';
import { rainIntensityFromRms } from '@/lib/sensoryHubEffects';
import {
  sensoryOverlayClass,
  useSensoryImmersiveChrome,
} from '@/components/sensory-hub/SensoryImmersiveContext';

type Drop = { x: number; y: number; speed: number; len: number };
type Ripple = { x: number; y: number; r: number; life: number };

export default function RainRoom() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const session = useSensoryRoomSession('rain');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<Drop[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const micRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micIntensityRef = useRef(0);
  const touchIntensityRef = useRef(0.35);
  const [micOn, setMicOn] = useState(false);
  const lastDropSoundRef = useRef(0);

  useEffect(() => {
    return () => {
      micRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleMic = async () => {
    if (micOn) {
      micRef.current?.getTracks().forEach((t) => t.stop());
      micRef.current = null;
      analyserRef.current = null;
      setMicOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micRef.current = stream;
      const ctx = session.audio.current?.getContext();
      if (ctx) {
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyserRef.current = analyser;
      }
      setMicOn(true);
      session.bumpInteraction();
    } catch {
      setMicOn(false);
    }
  };

  const settingsRef = useRef(session.settings);
  settingsRef.current = session.settings;
  const micOnRef = useRef(micOn);
  micOnRef.current = micOn;
  const audioRef = session.audio;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let w = 0;
    let h = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nextW = Math.max(1, Math.round(rect.width || window.innerWidth));
      const nextH = Math.max(1, Math.round(rect.height || window.innerHeight));
      if (nextW === w && nextH === h) return;
      const prevW = w;
      w = nextW;
      h = nextH;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = 'rgb(15, 23, 42)';
      ctx.fillRect(0, 0, w, h);
      if (prevW > 0 && prevW < w) {
        for (const d of dropsRef.current) d.x = (d.x / prevW) * w;
      }
      dropsRef.current = dropsRef.current.filter((d) => d.x <= w + 4);
    };
    resize();
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    document.addEventListener('fullscreenchange', resize);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);

    const spawnDrop = (intensity: number) => {
      dropsRef.current.push({
        x: Math.random() * w,
        y: -10 - Math.random() * 20,
        speed: 5 + Math.random() * 4 + intensity * 4,
        len: 10 + Math.random() * 12,
      });
    };

    let frame = 0;
    let raf = 0;
    const draw = () => {
      frame += 1;
      const bright = effectiveBrightness(settingsRef.current);

      if (analyserRef.current) {
        const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i += 1) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        micIntensityRef.current = rainIntensityFromRms(rms);
      }

      const intensity = Math.min(
        1,
        (micOnRef.current ? micIntensityRef.current : 0) + touchIntensityRef.current * 0.6 + 0.15,
      );

      const spawnRate = Math.floor(4 - intensity * 2);
      if (frame % Math.max(1, spawnRate) === 0) {
        const widthFactor = Math.max(1, w / 420);
        const count = Math.round((1 + intensity * 3) * widthFactor);
        for (let i = 0; i < count; i += 1) spawnDrop(intensity);
      }

      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = `rgba(147, 197, 253, ${0.55 * bright})`;
      ctx.lineWidth = 1.2;
      for (const d of dropsRef.current) {
        d.y += d.speed;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 1, d.y - d.len);
        ctx.stroke();
      }
      dropsRef.current = dropsRef.current.filter((d) => d.y < h + 20);

      for (const rip of ripplesRef.current) {
        rip.r += 1.2;
        rip.life -= 0.018;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(186, 230, 253, ${rip.life * 0.5 * bright})`;
        ctx.stroke();
      }
      ripplesRef.current = ripplesRef.current.filter((r) => r.life > 0);

      const now = Date.now();
      if (now - lastDropSoundRef.current > 250) {
        lastDropSoundRef.current = now;
        audioRef.current?.setAmbientIntensity(0.45 + intensity * 0.85);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      document.removeEventListener('fullscreenchange', resize);
      observer?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [audioRef]);

  const lastRippleSoundRef = useRef(0);

  const addRipple = (x: number, y: number, isNewTouch: boolean) => {
    ripplesRef.current.push({ x, y, r: 4, life: 1 });
    touchIntensityRef.current = Math.min(1, touchIntensityRef.current + (isNewTouch ? 0.12 : 0.03));
    if (isNewTouch) session.bumpInteraction();
    const now = Date.now();
    if (isNewTouch || now - lastRippleSoundRef.current > 160) {
      lastRippleSoundRef.current = now;
      session.audio.current?.droplet(session.settings);
    }
    window.setTimeout(() => {
      touchIntensityRef.current = Math.max(0.2, touchIntensityRef.current - (isNewTouch ? 0.08 : 0.02));
    }, 1500);
  };

  return (
    <SensoryRoomShell
      roomId="rain"
      titleAr="غرفة المطر التفاعلية"
      titleEn="Interactive rain room"
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
      className="bg-slate-900"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => addRipple(e.nativeEvent.offsetX, e.nativeEvent.offsetY, true)}
        onPointerMove={(e) => {
          if (e.buttons > 0) addRipple(e.nativeEvent.offsetX, e.nativeEvent.offsetY, false);
        }}
      />
      <RainMicButton micOn={micOn} isAr={isAr} onToggle={() => void toggleMic()} />
    </SensoryRoomShell>
  );
}

function RainMicButton({
  micOn,
  isAr,
  onToggle,
}: {
  micOn: boolean;
  isAr: boolean;
  onToggle: () => void;
}) {
  const immersive = useSensoryImmersiveChrome();
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-bold text-white backdrop-blur-sm ${sensoryOverlayClass(immersive?.controlsVisible ?? false)}`}
    >
      {micOn ? (isAr ? 'إيقاف الميكروفون' : 'Mic off') : isAr ? 'ميكروفون' : 'Mic'}
    </button>
  );
}

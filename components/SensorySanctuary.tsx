'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AmbientSoundEngine } from '@/lib/sensoryAudio';
import {
  holdExitProgress,
  SENSORY_FOCUS_EXIT_HOLD_MS,
} from '@/lib/sensoryFocusMode';
import type { SensorySessionEndReason } from '@/lib/sensorySessionEnd';
import {
  persistSensorySanctuaryResult,
  sensoryAccuracyRate,
  SENSORY_SANCTUARY_GAME_CODE,
  type SensoryMode,
  type SensorySessionMetrics,
} from '@/lib/sensorySanctuary';
import {
  readSensoryReinforcerHandoff,
  reinforcerSecondsRemaining,
} from '@/lib/scheduleRewards';

export type { SensoryMode, SensorySessionMetrics };
export { SENSORY_SANCTUARY_GAME_CODE };

type Scene = 'pond' | 'vortex' | 'bubbles';

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  alpha: number;
  hue: number;
  wobble: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  hue: number;
}

interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  phase: number;
  dart: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
  hue: number;
}

interface VortexBit {
  angle: number;
  radius: number;
  y: number;
  size: number;
  speed: number;
  hue: number;
}

const COLOR_SWATCHES = [
  { name: 'فيروزي مائي', hue: 185, bg: 'bg-[#2E7D8E]' },
  { name: 'زمردي طبيعي', hue: 145, bg: 'bg-[#10B981]' },
  { name: 'أرجواني دافئ', hue: 280, bg: 'bg-[#A855F7]' },
  { name: 'شمسي هادئ', hue: 45, bg: 'bg-[#F59E0B]' },
];

function sceneToMode(scene: Scene, bubbleMode: 'calm' | 'stimulate'): SensoryMode {
  if (scene === 'pond') return 'pond';
  if (scene === 'vortex') return 'vortex';
  return bubbleMode;
}

function drawFish(
  ctx: CanvasRenderingContext2D,
  fish: Fish,
  glowHue: number
) {
  const facing = fish.vx >= 0 ? 1 : -1;
  const size = Math.max(8, fish.size);
  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.scale(facing, 1);
  ctx.rotate(Math.sin(fish.phase) * 0.12);

  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, size * 2.2);
  glow.addColorStop(0, `hsla(${fish.hue}, 90%, 72%, 0.85)`);
  glow.addColorStop(1, `hsla(${glowHue}, 80%, 50%, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, size * 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.scale(1.7, 0.85);
  ctx.fillStyle = `hsla(${fish.hue}, 85%, 62%, 0.95)`;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = `hsla(${fish.hue + 20}, 90%, 75%, 0.9)`;
  ctx.beginPath();
  ctx.moveTo(-size * 1.25, 0);
  ctx.lineTo(-size * 2.05, -size * 0.55);
  ctx.lineTo(-size * 2.05, size * 0.55);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(size * 0.55, -size * 0.12, Math.max(1, size * 0.16), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#123';
  ctx.beginPath();
  ctx.arc(size * 0.62, -size * 0.12, Math.max(1, size * 0.07), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function ParentHoldExitButton({
  onComplete,
  label,
}: {
  onComplete: () => void;
  label: string;
}) {
  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);

  const stopHold = useCallback(() => {
    holdStartRef.current = null;
    setProgress(0);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <button
      type="button"
      onPointerDown={() => {
        holdStartRef.current = Date.now();
        const tick = () => {
          if (holdStartRef.current === null) return;
          const elapsed = Date.now() - holdStartRef.current;
          setProgress(holdExitProgress(elapsed));
          if (elapsed >= SENSORY_FOCUS_EXIT_HOLD_MS) {
            stopHold();
            onComplete();
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
      className="relative rounded-xl bg-white/15 px-3 py-1.5 font-bold hover:bg-white/25"
      style={{
        boxShadow: progress
          ? `inset 0 0 0 ${Math.round(progress * 10)}px rgba(255,255,255,0.15)`
          : undefined,
      }}
    >
      {label}
    </button>
  );
}

export default function SensorySanctuary({
  onSessionComplete,
  backHref = '/dashboard/games',
  childId,
  sessionDurationSec,
  maxInteractions,
  onSessionStop,
  sessionPaused = false,
}: {
  onSessionComplete?: (metrics: SensorySessionMetrics) => void;
  backHref?: string;
  childId?: string;
  sessionDurationSec?: number;
  maxInteractions?: number;
  onSessionStop?: (metrics: SensorySessionMetrics, reason: SensorySessionEndReason) => void;
  sessionPaused?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<AmbientSoundEngine | null>(null);
  const completeRef = useRef(onSessionComplete);
  const startedAtRef = useRef(Date.now());
  const hitsRef = useRef(0);
  const waterTouchesRef = useRef(0);
  const pointerRef = useRef({ down: false, x: 0, y: 0 });
  const soundOnRef = useRef(true);

  const [scene, setScene] = useState<Scene>('pond');
  const [bubbleMode, setBubbleMode] = useState<'calm' | 'stimulate'>('calm');
  const [activeHue, setActiveHue] = useState(185);
  const [hits, setHits] = useState(0);
  const [waterTouches, setWaterTouches] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  completeRef.current = onSessionComplete;
  soundOnRef.current = soundOn;
  const mode = sceneToMode(scene, bubbleMode);
  const accuracyRate = sensoryAccuracyRate(hits, waterTouches);
  const savedSigRef = useRef('');
  const childIdRef = useRef(childId);
  childIdRef.current = childId;

  const emitMetrics = () => {
    const metrics: SensorySessionMetrics = {
      gameCode: SENSORY_SANCTUARY_GAME_CODE,
      mode,
      hue: activeHue,
      interactions: hitsRef.current + waterTouchesRef.current,
      hits: hitsRef.current,
      waterTouches: waterTouchesRef.current,
      accuracyRate: sensoryAccuracyRate(hitsRef.current, waterTouchesRef.current),
      visualMotorRate: sensoryAccuracyRate(
        hitsRef.current,
        waterTouchesRef.current
      ),
      durationMs: Date.now() - startedAtRef.current,
      scoring: 'child_playable',
    };
    persistSensorySanctuaryResult(metrics, childIdRef.current);
    const sig = `${metrics.hits}:${metrics.waterTouches}:${metrics.accuracyRate}`;
    if (savedSigRef.current !== sig) {
      savedSigRef.current = sig;
      completeRef.current?.(metrics);
    }
    return metrics;
  };
  const emitRef = useRef(emitMetrics);
  emitRef.current = emitMetrics;
  const autoEndedRef = useRef(false);
  const onSessionStopRef = useRef(onSessionStop);
  onSessionStopRef.current = onSessionStop;

  const finishSession = (reason: SensorySessionEndReason) => {
    if (autoEndedRef.current || sessionPaused) return;
    autoEndedRef.current = true;
    const metrics = emitRef.current();
    onSessionStopRef.current?.(metrics, reason);
  };

  useEffect(() => {
    if (!sessionDurationSec || sessionDurationSec <= 0 || sessionPaused) return undefined;
    const id = window.setTimeout(() => finishSession('time'), sessionDurationSec * 1000);
    return () => window.clearTimeout(id);
  }, [sessionDurationSec, sessionPaused]);

  useEffect(() => {
    if (!maxInteractions || maxInteractions <= 0 || sessionPaused) return;
    if (hits + waterTouches >= maxInteractions) finishSession('interactions');
  }, [hits, waterTouches, maxInteractions, sessionPaused]);

  useEffect(() => {
    if (!onSessionStop || sessionPaused) return undefined;
    const handoff = readSensoryReinforcerHandoff();
    if (!handoff) return undefined;
    const tick = () => {
      if (autoEndedRef.current) return;
      if (reinforcerSecondsRemaining(handoff) <= 0) finishSession('reinforcer');
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [onSessionStop, sessionPaused]);

  useEffect(() => {
    return () => {
      if (hitsRef.current + waterTouchesRef.current <= 0) return;
      emitRef.current();
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
    audioRef.current?.setMuted(!soundOn);
  }, [soundOn]);

  useEffect(() => {
    audioRef.current = new AmbientSoundEngine();
    audioRef.current.setMuted(!soundOnRef.current);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let width = Math.max(1, window.innerWidth);
    let height = Math.max(1, window.innerHeight);
    canvas.width = width;
    canvas.height = height;
    let t = 0;
    let vortexBoost = 1;
    let vortexHue = activeHue;

    const handleResize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const ripples: Ripple[] = [];
    const sparks: Spark[] = [];
    const fish: Fish[] = [];
    const vortex: VortexBit[] = [];

    const bubbleCount = reducedMotion ? 8 : bubbleMode === 'calm' ? 35 : 70;
    for (let i = 0; i < bubbleCount; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * (bubbleMode === 'calm' ? 18 : 28) + 8,
        speedY: (Math.random() * 0.8 + 0.4) * (bubbleMode === 'calm' ? 1 : 1.8),
        speedX: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.2,
        hue: activeHue + Math.floor(Math.random() * 20 - 10),
        wobble: Math.random() * Math.PI * 2,
      });
    }

    const fishCount = reducedMotion ? 4 : 9;
    for (let i = 0; i < fishCount; i += 1) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      fish.push({
        x: Math.random() * width,
        y: height * (0.25 + Math.random() * 0.55),
        vx: dir * (0.55 + Math.random() * 0.9),
        vy: 0,
        size: 14 + Math.random() * 16,
        hue: 25 + Math.random() * 50,
        phase: Math.random() * Math.PI * 2,
        dart: Math.random() * 240,
      });
    }

    const vortexCount = reducedMotion ? 28 : 90;
    for (let i = 0; i < vortexCount; i += 1) {
      vortex.push({
        angle: Math.random() * Math.PI * 2,
        radius: 18 + Math.random() * 110,
        y: Math.random() * height,
        size: 3 + Math.random() * 9,
        speed: 0.01 + Math.random() * 0.03,
        hue: activeHue + Math.random() * 40 - 20,
      });
    }

    const addRipple = (x: number, y: number, hue: number) => {
      ripples.push({ x, y, radius: 8, alpha: 0.85, hue });
    };

    const burstSparks = (x: number, y: number, hue: number) => {
      const n = reducedMotion ? 6 : 16;
      for (let i = 0; i < n; i += 1) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * (1.6 + Math.random() * 2.4),
          vy: Math.sin(a) * (1.6 + Math.random() * 2.4) - 1.2,
          life: 1,
          r: 3 + Math.random() * 5,
          hue,
        });
      }
    };

    const bumpHit = () => {
      hitsRef.current += 1;
      setHits(hitsRef.current);
    };

    const bumpWater = () => {
      waterTouchesRef.current += 1;
      setWaterTouches(waterTouchesRef.current);
    };

    const vortexPoint = (b: VortexBit) => {
      const cx = width / 2;
      return {
        x: cx + Math.cos(b.angle) * b.radius * (0.35 + (b.y / height) * 0.9),
        y: b.y + Math.sin(b.angle * 2) * 6,
      };
    };

    const localPoint = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const renderBubbles = () => {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (bubbleMode === 'calm') {
        bgGrad.addColorStop(0, '#06131C');
        bgGrad.addColorStop(1, '#0C2735');
      } else {
        bgGrad.addColorStop(0, '#100B26');
        bgGrad.addColorStop(1, '#241242');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.wobble += reducedMotion ? 0 : 0.02;
        p.x += Math.sin(p.wobble) * 0.5 + p.speedX;
        p.speedX *= 0.985;
        if (p.y + p.radius < 0) {
          p.y = height + p.radius;
          p.x = Math.random() * width;
        }
        const glow = ctx.createRadialGradient(
          p.x,
          p.y,
          p.radius * 0.1,
          p.x,
          p.y,
          p.radius * 1.5
        );
        glow.addColorStop(0, `hsla(${activeHue}, 80%, 70%, ${p.alpha})`);
        glow.addColorStop(0.6, `hsla(${activeHue}, 75%, 50%, ${p.alpha * 0.5})`);
        glow.addColorStop(1, `hsla(${activeHue}, 70%, 40%, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${activeHue + 20}, 90%, 85%, ${p.alpha + 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    };

    const renderPond = () => {
      const water = ctx.createLinearGradient(0, 0, 0, height);
      water.addColorStop(0, '#083344');
      water.addColorStop(0.45, '#0E7490');
      water.addColorStop(1, '#042F2E');
      ctx.fillStyle = water;
      ctx.fillRect(0, 0, width, height);

      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 6; i += 1) {
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${185 + i * 8}, 80%, 78%, 0.7)`;
        ctx.lineWidth = 10;
        const y = ((t * 12 + i * 70) % (height + 80)) - 40;
        ctx.moveTo(0, y);
        for (let x = 0; x <= width; x += 18) {
          ctx.lineTo(x, y + Math.sin(x * 0.02 + t * 0.04 + i) * 14);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      fish.forEach((f) => {
        f.dart -= 1;
        if (f.dart < 0 && !reducedMotion) {
          f.vy = -2.8 - Math.random() * 1.6;
          f.vx *= 1.8;
          addRipple(f.x, f.y, 190);
          f.dart = 180 + Math.random() * 320;
        }
        f.phase += 0.08;
        f.x += f.vx * (reducedMotion ? 0.45 : 1);
        f.y += f.vy + Math.sin(f.phase) * 0.35;
        f.vy *= 0.94;
        if (f.y < height * 0.18) f.vy += 0.12;
        if (f.y > height * 0.86) f.vy -= 0.08;
        if (f.x < -40) f.x = width + 30;
        if (f.x > width + 40) f.x = -30;
        drawFish(ctx, f, activeHue);
      });
    };

    const renderVortex = () => {
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, `hsl(${vortexHue}, 55%, 8%)`);
      bg.addColorStop(0.5, `hsl(${vortexHue + 30}, 60%, 14%)`);
      bg.addColorStop(1, `hsl(${vortexHue + 60}, 50%, 7%)`);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const tube = ctx.createLinearGradient(cx - 90, 0, cx + 90, 0);
      tube.addColorStop(0, 'rgba(8,20,40,0)');
      tube.addColorStop(0.35, `hsla(${vortexHue}, 90%, 45%, 0.25)`);
      tube.addColorStop(0.5, `hsla(${vortexHue + 40}, 95%, 65%, 0.35)`);
      tube.addColorStop(0.65, `hsla(${vortexHue}, 90%, 45%, 0.25)`);
      tube.addColorStop(1, 'rgba(8,20,40,0)');
      ctx.fillStyle = tube;
      ctx.fillRect(cx - 110, 0, 220, height);

      vortex.forEach((b) => {
        b.angle += b.speed * vortexBoost * (reducedMotion ? 0.4 : 1);
        b.y -= (0.35 + b.size * 0.04) * vortexBoost;
        if (b.y < -12) b.y = height + 12;
        const x = cx + Math.cos(b.angle) * b.radius * (0.35 + (b.y / height) * 0.9);
        const y = b.y + Math.sin(b.angle * 2) * 6;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, b.size * 2.4);
        glow.addColorStop(0, `hsla(${b.hue + vortexHue * 0.2}, 95%, 78%, 0.95)`);
        glow.addColorStop(1, `hsla(${b.hue}, 90%, 50%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, b.size * 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      vortexBoost += (1 - vortexBoost) * 0.035;
    };

    const renderRipplesAndSparks = () => {
      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const r = ripples[i];
        r.radius += scene === 'pond' ? 2.8 : 3.6;
        r.alpha *= 0.96;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${r.hue}, 90%, 72%, ${r.alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.55, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${r.hue + 20}, 90%, 85%, ${r.alpha * 0.45})`;
        ctx.stroke();
        if (r.alpha < 0.02) ripples.splice(i, 1);
      }

      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy -= 0.03;
        s.life -= 0.02;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${s.hue}, 95%, 75%, ${Math.max(s.life, 0)})`;
        ctx.arc(s.x, s.y, Math.max(0.1, s.r * Math.max(s.life, 0)), 0, Math.PI * 2);
        ctx.fill();
        if (s.life <= 0) sparks.splice(i, 1);
      }
    };

    const render = () => {
      t += 1;
      try {
        if (scene === 'pond') renderPond();
        else if (scene === 'vortex') renderVortex();
        else renderBubbles();
        renderRipplesAndSparks();
      } catch {
        /* keep the loop alive if a frame fails */
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    const onPointerDown = (e: PointerEvent) => {
      try {
        const { x, y } = localPoint(e.clientX, e.clientY);
        pointerRef.current = { down: true, x, y };
        void audioRef.current?.start();

        if (scene === 'pond') {
          addRipple(x, y, 190);
          let hit = false;
          for (const f of fish) {
            const dx = f.x - x;
            const dy = f.y - y;
            if (Math.hypot(dx, dy) < f.size * 1.8) {
              hit = true;
              f.vx = (Math.random() > 0.5 ? 1 : -1) * (2.4 + Math.random());
              f.vy = -3.2;
              f.dart = 90 + Math.random() * 160;
              burstSparks(f.x, f.y, f.hue);
              audioRef.current?.playFishChime();
              bumpHit();
              break;
            }
          }
          if (!hit) {
            audioRef.current?.playTouch();
            bumpWater();
          }
          return;
        }

        if (scene === 'vortex') {
          vortexBoost = Math.min(4.2, vortexBoost + 1.4);
          vortexHue = (vortexHue + 18) % 360;
          addRipple(x, y, vortexHue);
          const hitBit = vortex.find((b) => {
            const p = vortexPoint(b);
            return Math.hypot(p.x - x, p.y - y) < b.size * 2.4;
          });
          if (hitBit) {
            const p = vortexPoint(hitBit);
            burstSparks(p.x, p.y, hitBit.hue);
            audioRef.current?.playFishChime();
            bumpHit();
          } else {
            audioRef.current?.playTouch();
            bumpWater();
          }
          return;
        }

        addRipple(x, y, activeHue);
        const hitBubble = particles.find(
          (p) => Math.hypot(p.x - x, p.y - y) < p.radius * 1.4
        );
        if (hitBubble) {
          burstSparks(hitBubble.x, hitBubble.y, activeHue);
          audioRef.current?.playFishChime();
          bumpHit();
        } else {
          audioRef.current?.playTouch();
          bumpWater();
        }
        particles.forEach((p) => {
          const dx = p.x - x;
          const dy = p.y - y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120 && dist > 0.001) {
            p.speedX += (dx / dist) * 2;
            p.speedY += (dy / dist) * 1.5;
          }
        });
      } catch {
        /* keep playing */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointerRef.current.down || scene !== 'vortex') return;
      const { x, y } = localPoint(e.clientX, e.clientY);
      pointerRef.current = { down: true, x, y };
      vortexBoost = Math.min(4.8, vortexBoost + 0.08);
      vortexHue = (vortexHue + 1.2) % 360;
    };

    const onPointerUp = () => {
      pointerRef.current.down = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      audioRef.current?.close();
    };
  }, [scene, bubbleMode, activeHue, reducedMotion]);

  const hint =
    scene === 'pond'
      ? 'المس السمكة للصيد 🎯 — لمس الماء يُحدث تموجاً فقط 💧'
      : scene === 'vortex'
        ? 'المس الفقاعة النيون للصيد — الفراغ تموج فقط'
        : 'المس الفقاعة للصيد — الفراغ تموج فقط';

  return (
    <div
      className="relative h-full min-h-0 w-full select-none overflow-hidden bg-[#042F2E] font-sans"
      dir="rtl"
    >
      <canvas
        ref={canvasRef}
        className={`block h-full w-full touch-none ${
          sessionPaused ? 'pointer-events-none opacity-40' : 'cursor-pointer'
        }`}
      />

      <div
        className={`absolute left-4 right-4 top-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white backdrop-blur-md sm:text-sm ${
          sessionPaused ? 'pointer-events-none opacity-40' : ''
        }`}
      >
        <div className="flex items-center gap-2.5">
          {onSessionStop ? (
            <ParentHoldExitButton
              label="إنهاء — اضغط مطولاً"
              onComplete={() => finishSession('manual')}
            />
          ) : (
            <Link
              href={backHref}
              onClick={() => {
                if (hitsRef.current + waterTouchesRef.current > 0) emitMetrics();
              }}
              className="rounded-xl bg-white/15 px-3 py-1.5 font-bold hover:bg-white/25"
            >
              خروج
            </Link>
          )}
          <span className="h-3 w-3 animate-ping rounded-full bg-teal-400" />
          <span className="font-bold tracking-wide">الغرفة الحسية</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setScene('pond')}
            className={`rounded-xl px-3 py-1.5 font-bold transition ${
              scene === 'pond'
                ? 'bg-[#2E7D8E] text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            🐟 بحيرة الأسماك
          </button>
          <button
            type="button"
            onClick={() => setScene('vortex')}
            className={`rounded-xl px-3 py-1.5 font-bold transition ${
              scene === 'vortex'
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            🫧 أنبوب الفقاعات
          </button>
          <button
            type="button"
            onClick={() => setScene('bubbles')}
            className={`rounded-xl px-3 py-1.5 font-bold transition ${
              scene === 'bubbles'
                ? 'bg-amber-500 text-slate-900'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            ✨ فقاعات مهدئة
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            const next = !soundOn;
            setSoundOn(next);
            void audioRef.current?.start().catch(() => undefined);
            audioRef.current?.setMuted(!next);
          }}
          className="rounded-xl bg-white/15 px-3 py-1.5 font-bold hover:bg-white/25"
        >
          {soundOn ? '🔊 هدير الماء' : '🔇 كتم الصوت'}
        </button>
      </div>

      {scene === 'bubbles' ? (
        <div className="absolute right-4 top-24 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-xs text-white">
          <button
            type="button"
            onClick={() => setBubbleMode('calm')}
            className={`rounded-xl px-3 py-1.5 font-bold ${
              bubbleMode === 'calm' ? 'bg-[#2E7D8E]' : 'bg-white/10'
            }`}
          >
            🌊 تهدئة
          </button>
          <button
            type="button"
            onClick={() => setBubbleMode('stimulate')}
            className={`rounded-xl px-3 py-1.5 font-bold ${
              bubbleMode === 'stimulate' ? 'bg-[#8B5CF6]' : 'bg-white/10'
            }`}
          >
            ✨ تنشيط
          </button>
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color.hue}
              type="button"
              onClick={() => setActiveHue(color.hue)}
              className={`h-6 w-6 rounded-full border-2 ${color.bg} ${
                activeHue === color.hue ? 'scale-110 border-white' : 'border-transparent opacity-60'
              }`}
              title={color.name}
            />
          ))}
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-4 left-1/2 flex max-w-[94%] -translate-x-1/2 flex-col items-center gap-1">
        <p className="rounded-full bg-black/35 px-3 py-1 text-[11px] text-white/75">
          {hint}
        </p>
        <div
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-white/10 bg-black/45 px-5 py-2 text-center text-xs font-bold text-white/90 backdrop-blur-sm sm:text-sm"
          aria-live="polite"
        >
          <span>الهدف: {hits} 🎯</span>
          <span className="text-white/30">|</span>
          <span>التموجات: {waterTouches} 💧</span>
          <span className="text-white/30">|</span>
          <span>نسبة الدقة: {accuracyRate}% 📈</span>
        </div>
      </div>

      <button
        type="button"
        onClick={emitMetrics}
        className="absolute bottom-4 left-4 z-10 rounded-xl bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/25"
      >
        إنهاء الجلسة وحفظ الرصد
      </button>
    </div>
  );
}

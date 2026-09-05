'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BUBBLE_SEEKER_GAME_CODE,
  BUBBLE_SEEKER_TOTAL_ROUNDS,
  buildBubbleSeekerMetrics,
  nearestHitIndex,
  type BubbleSeekerMetrics,
} from '@/lib/bubbleSeeker';
import { saveGameSession, starsFromRate } from '@/lib/gameSession';

class OceanAudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  playPop() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        850,
        this.ctx.currentTime + 0.12
      );
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + 0.12
      );
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      /* ignore autoplay / audio errors */
    }
  }

  playCheer() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.08, this.ctx!.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          this.ctx!.currentTime + idx * 0.08 + 0.25
        );
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.08);
        osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.25);
      });
    } catch {
      /* ignore */
    }
  }
}

type TargetBubble = {
  id: number;
  x: number;
  y: number;
  radius: number;
  isTarget: boolean;
};

export type GameTelemetryMetrics = BubbleSeekerMetrics;

type Props = {
  childId?: string;
  onFinishGame?: (metrics: BubbleSeekerMetrics) => void;
};

function resolveChildId(childId?: string) {
  if (childId) return childId;
  try {
    const s = JSON.parse(
      localStorage.getItem('taaluf.activeStudent') || 'null'
    );
    return s?.id || 'child_local';
  } catch {
    return 'child_local';
  }
}

export default function BubbleSeekerGame({ childId, onFinishGame }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<OceanAudioEngine | null>(null);
  const onFinishRef = useRef(onFinishGame);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [result, setResult] = useState<BubbleSeekerMetrics | null>(null);
  const [msg, setMsg] = useState('');
  const [session, setSession] = useState(0);

  useEffect(() => {
    onFinishRef.current = onFinishGame;
  }, [onFinishGame]);

  useEffect(() => {
    audioRef.current = new OceanAudioEngine();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = 640;
    let height = 480;
    let nextId = 1;
    let locked = false;
    let finished = false;
    let currentRound = 1;
    let scoreValue = 0;
    let targetSpawnTime = Date.now();
    const startedAt = new Date().toISOString();
    const metrics = {
      attempts: 0,
      jointSuccesses: 0,
      latencies: [] as number[],
    };
    const trials: Array<{
      round: number;
      hitTarget: boolean;
      latencyMs: number;
      at: string;
    }> = [];

    const creature = {
      x: 0,
      y: 0,
      lookAngle: -Math.PI / 2,
      targetAngle: -Math.PI / 2,
      wobble: 0,
    };
    let activeBubbles: TargetBubble[] = [];

    const layoutCreature = () => {
      creature.x = width / 2;
      creature.y = height - 120;
    };

    const spawnRoundBubbles = (roundNum: number) => {
      activeBubbles = [];
      const bubbleCount = Math.min(3 + Math.floor(roundNum / 2), 5);
      const targetIndex = Math.floor(Math.random() * bubbleCount);
      for (let i = 0; i < bubbleCount; i++) {
        const bx =
          (width / (bubbleCount + 1)) * (i + 1) + (Math.random() * 40 - 20);
        const by = Math.random() * (height * 0.4) + height * 0.15;
        const isTgt = i === targetIndex;
        const id = nextId++;
        if (isTgt) {
          targetSpawnTime = Date.now();
          creature.targetAngle = Math.atan2(by - creature.y, bx - creature.x);
        }
        activeBubbles.push({
          id,
          x: bx,
          y: by,
          radius: isTgt ? 42 : 32,
          isTarget: isTgt,
        });
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent?.clientWidth || window.innerWidth;
      height = parent?.clientHeight || 520;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layoutCreature();
    };

    const render = () => {
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
      oceanGrad.addColorStop(0, '#021B2B');
      oceanGrad.addColorStop(0.5, '#073B4C');
      oceanGrad.addColorStop(1, '#052A36');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(width * 0.2 * i, 0);
        ctx.lineTo(width * 0.2 * i + 80, 0);
        ctx.lineTo(width * 0.2 * i + 240, height);
        ctx.lineTo(width * 0.2 * i + 120, height);
        ctx.fill();
      }
      ctx.restore();

      creature.wobble += 0.03;
      creature.lookAngle += (creature.targetAngle - creature.lookAngle) * 0.08;

      ctx.save();
      ctx.translate(creature.x, creature.y + Math.sin(creature.wobble) * 6);
      ctx.beginPath();
      ctx.ellipse(0, 0, 65, 45, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#2E7D8E';
      ctx.fill();
      ctx.strokeStyle = '#5EEAD4';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.rotate(creature.lookAngle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(15, -75);
      ctx.lineTo(-15, -75);
      ctx.closePath();
      ctx.fillStyle = '#14B8A6';
      ctx.fill();
      ctx.strokeStyle = '#99F6E4';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      const eyeOffsetX = Math.cos(creature.lookAngle) * 8;
      const eyeOffsetY = Math.sin(creature.lookAngle) * 6;
      [-18, 18].forEach((ex) => {
        ctx.beginPath();
        ctx.arc(ex, -12, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex + eyeOffsetX, -12 + eyeOffsetY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#0F172A';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex + eyeOffsetX - 1.5, -14 + eyeOffsetY, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      });

      ctx.beginPath();
      ctx.arc(0, 10, 12, 0.2, Math.PI - 0.2);
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      activeBubbles.forEach((b) => {
        ctx.save();
        const bubbleHue = b.isTarget ? 45 : 185;
        const bGlow = ctx.createRadialGradient(
          b.x,
          b.y,
          b.radius * 0.2,
          b.x,
          b.y,
          b.radius * 1.4
        );
        bGlow.addColorStop(0, `hsla(${bubbleHue}, 90%, 75%, 0.8)`);
        bGlow.addColorStop(1, `hsla(${bubbleHue}, 80%, 50%, 0)`);
        ctx.fillStyle = bGlow;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.strokeStyle = b.isTarget ? '#FCD34D' : '#99F6E4';
        ctx.lineWidth = b.isTarget ? 3 : 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
          b.x - b.radius * 0.35,
          b.y - b.radius * 0.35,
          b.radius * 0.25,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    const finish = async (hitTarget: boolean, latency: number) => {
      finished = true;
      audioRef.current?.playCheer();
      const built = buildBubbleSeekerMetrics({
        attempts: metrics.attempts,
        jointSuccesses: metrics.jointSuccesses,
        latencies: metrics.latencies,
      });
      setResult(built);
      setIsGameOver(true);
      onFinishRef.current?.(built);
      try {
        await saveGameSession({
          childId: resolveChildId(childId),
          gameCode: BUBBLE_SEEKER_GAME_CODE,
          score: scoreValue,
          levelReached: BUBBLE_SEEKER_TOTAL_ROUNDS,
          metrics: {
            ...built,
            lastHitTarget: hitTarget,
            lastLatencyMs: latency,
          },
          trials,
          startedAt,
          endedAt: new Date().toISOString(),
        });
        setMsg('تم حفظ جلسة صائد الفقاعات');
      } catch (err) {
        setMsg(err instanceof Error ? err.message : 'تعذر الحفظ');
      }
    };

    const handleTouchBubble = (clientX: number, clientY: number) => {
      if (finished || locked) return;
      const rect = canvas.getBoundingClientRect();
      const tx = ((clientX - rect.left) / Math.max(1, rect.width)) * width;
      const ty = ((clientY - rect.top) / Math.max(1, rect.height)) * height;
      const hitIndex = nearestHitIndex(tx, ty, activeBubbles);
      if (hitIndex < 0) return;

      locked = true;
      const bubble = activeBubbles[hitIndex];
      audioRef.current?.playPop();
      const latency = Date.now() - targetSpawnTime;
      metrics.attempts += 1;
      if (bubble.isTarget) {
        metrics.jointSuccesses += 1;
        metrics.latencies.push(latency);
        scoreValue += 10;
        setScore(scoreValue);
      }
      trials.push({
        round: currentRound,
        hitTarget: bubble.isTarget,
        latencyMs: latency,
        at: new Date().toISOString(),
      });

      if (currentRound < BUBBLE_SEEKER_TOTAL_ROUNDS) {
        currentRound += 1;
        setRound(currentRound);
        spawnRoundBubbles(currentRound);
        locked = false;
      } else {
        void finish(bubble.isTarget, latency);
      }
    };

    const onMouseDown = (e: MouseEvent) =>
      handleTouchBubble(e.clientX, e.clientY);
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) {
        handleTouchBubble(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    resize();
    spawnRoundBubbles(1);
    render();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('touchstart', onTouchStart);
    };
  }, [session, childId]);

  const stars = starsFromRate(result?.trackingAccuracy ?? 0);

  return (
    <div
      className="relative h-[76vh] w-full select-none overflow-hidden rounded-3xl border border-teal-800/40 font-sans shadow-2xl"
      dir="rtl"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-pointer touch-none"
      />

      <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-white backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl">🐬</span>
          <div>
            <h3 className="text-sm font-bold text-teal-200">
              صائد الفقاعات والإشارة
            </h3>
            <span className="text-[11px] text-gray-300">
              اتبع إشارة صديقك البحري لفرقعة الفقاعة الذهبية!
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <span className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5">
            الجولة:{' '}
            <strong className="text-teal-300">
              {round} / {BUBBLE_SEEKER_TOTAL_ROUNDS}
            </strong>
          </span>
          <span className="rounded-xl border border-teal-400/30 bg-teal-600/60 px-3 py-1.5">
            النقاط: <strong className="text-yellow-300">{score}</strong>
          </span>
        </div>
      </div>

      {isGameOver && result && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-6 backdrop-blur-lg">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-teal-500/30 bg-[#0C2735] p-8 text-center text-white shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-teal-400/40 bg-teal-500/20 text-3xl text-teal-300">
              🌟
            </div>
            <p className="text-2xl tracking-widest text-amber-300">
              {'★'.repeat(stars)}
              {'☆'.repeat(3 - stars)}
            </p>
            <h2 className="text-2xl font-bold text-teal-200">
              أحسنت يا بطل! تم إنهاء التحدي
            </h2>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-right text-xs">
              <span className="mb-1 block font-bold text-teal-400">
                رصد تربوي — الانتباه المشترك وتتبع الإشارة (C11 · C12)
              </span>
              <div className="flex justify-between">
                <span className="text-gray-400">
                  معدل تتبع الإشارة والانتباه المشترك:
                </span>
                <strong className="text-white">%{result.jointAttentionRate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">متوسط زمن الاستجابة للإشارة:</span>
                <strong className="text-white">
                  {result.avgLatencyMs
                    ? `${(result.avgLatencyMs / 1000).toFixed(1)} ثانية`
                    : '—'}
                </strong>
              </div>
              <p className="pt-2 leading-6 text-gray-400">
                مؤشر تربوي مساند، وليس تشخيصاً طبياً.
              </p>
            </div>
            {msg && <p className="text-sm text-teal-200">{msg}</p>}
            <button
              type="button"
              onClick={() => {
                setRound(1);
                setScore(0);
                setIsGameOver(false);
                setResult(null);
                setMsg('');
                setSession((n) => n + 1);
              }}
              className="w-full rounded-xl bg-[#2E7D8E] py-3.5 font-bold text-white shadow-lg transition hover:bg-[#256675]"
            >
              العب مرة أخرى
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

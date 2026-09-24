/**
 * مؤثرات قصيرة عبر Web Audio API، بلا ملفات خارجية.
 * اللمس ناعم، النجاح مشجّع، والمحاولة الخاطئة خفيفة.
 */

type ToneCtx = AudioContext;

function audioContextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  );
}

function tone(
  ctx: ToneCtx,
  frequency: number,
  start: number,
  duration: number,
  peak: number,
  type: OscillatorType
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export class ActivityFeedbackAudio {
  private ctx: ToneCtx | null = null;

  private context(): ToneCtx | null {
    const Ctor = audioContextClass();
    if (!Ctor) return null;
    if (!this.ctx) this.ctx = new Ctor();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  playTap() {
    try {
      const ctx = this.context();
      if (!ctx) return;
      tone(ctx, 740, ctx.currentTime, 0.045, 0.035, 'sine');
    } catch {
      /* الجهاز بلا صوت */
    }
  }

  playSuccess() {
    try {
      const ctx = this.context();
      if (!ctx) return;
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        tone(ctx, frequency, ctx.currentTime + index * 0.08, 0.22, 0.06, 'triangle');
      });
    } catch {
      /* الجهاز بلا صوت */
    }
  }

  playIncorrect() {
    try {
      const ctx = this.context();
      if (!ctx) return;
      tone(ctx, 392, ctx.currentTime, 0.12, 0.03, 'sine');
      tone(ctx, 330, ctx.currentTime + 0.1, 0.16, 0.025, 'sine');
    } catch {
      /* الجهاز بلا صوت */
    }
  }
}

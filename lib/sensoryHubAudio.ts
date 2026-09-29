/**
 * Web Audio API للجناح الحسي — أصوات نقية بحد أقصى آمن للصوت.
 * أصوات الحيوانات والمطر تسجيلات حقيقية من public/sounds (المصادر في ATTRIBUTION.txt)،
 * مع توليد صناعي احتياطي إذا تعذّر تحميل الملف.
 */

import {
  effectiveVolume,
  type SensoryHubSettings,
  type SensoryRoomId,
} from './sensoryHub';
import { playNaturalAnimalSound } from './animalSoundSynth';

export const ANIMAL_SOUND_IDS = ['cat', 'dog', 'bird', 'cow', 'sheep', 'lion'] as const;

export function animalSoundUrl(animalId: string): string | null {
  return (ANIMAL_SOUND_IDS as readonly string[]).includes(animalId)
    ? `/sounds/animals/${animalId}.mp3`
    : null;
}

const AMBIENT_SAMPLES: Partial<Record<SensoryRoomId, string>> = {
  rain: '/sounds/ambient/rain.mp3',
};

/** مستوى الصوت المحيطي لكل غرفة نسبةً لمستوى الصوت العام */
const AMBIENT_LEVEL: Partial<Record<SensoryRoomId, number>> = {
  rain: 0.9,
  waves: 0.7,
};
const DEFAULT_AMBIENT_LEVEL = 0.48;

function audioContextClass() {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  );
}

export class SensoryHubAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientNodes: AudioScheduledSourceNode[] = [];
  private ambientRoom: SensoryRoomId | null = null;
  private ambientIntensity = 1;
  private volume = 0.5;
  private samples = new Map<string, Promise<AudioBuffer | null>>();
  private animalSrc: AudioBufferSourceNode | null = null;

  private ensure() {
    if (this.ctx) return;
    const Ctor = audioContextClass();
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
  }

  async resume() {
    this.ensure();
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  getContext() {
    this.ensure();
    return this.ctx;
  }

  private loadSample(url: string): Promise<AudioBuffer | null> {
    const cached = this.samples.get(url);
    if (cached) return cached;
    const pending = (async () => {
      this.ensure();
      if (!this.ctx) return null;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.arrayBuffer();
        return await this.ctx.decodeAudioData(data);
      } catch {
        return null;
      }
    })();
    this.samples.set(url, pending);
    return pending;
  }

  /** تحميل مسبق حتى يُسمع الصوت فور اللمس */
  preload(urls: string[]) {
    for (const url of urls) void this.loadSample(url);
  }

  private ambientTarget() {
    const level = (this.ambientRoom && AMBIENT_LEVEL[this.ambientRoom]) ?? DEFAULT_AMBIENT_LEVEL;
    return this.volume * level * this.ambientIntensity;
  }

  private applyAmbientGain(smooth = true) {
    if (!this.ambientGain || !this.ctx) return;
    const target = this.ambientTarget();
    if (smooth) this.ambientGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.4);
    else this.ambientGain.gain.value = target;
  }

  setVolume(settings: SensoryHubSettings) {
    this.ensure();
    if (!this.master) return;
    this.volume = effectiveVolume(settings);
    this.master.gain.value = this.volume;
    this.applyAmbientGain(false);
  }

  /** 0–1 — شدة الصوت المحيطي (مثلاً مطر أغزر مع اللمس) */
  setAmbientIntensity(level: number) {
    this.ambientIntensity = Math.max(0.15, Math.min(1.4, level));
    this.applyAmbientGain(true);
  }

  stopAmbient() {
    for (const node of this.ambientNodes) {
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
      try {
        node.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.ambientNodes = [];
    this.ambientGain = null;
    this.ambientRoom = null;
  }

  /** صوت محيطي — تسجيل حقيقي متكرر إن توفّر، وإلا طبقات مولّدة */
  startAmbient(roomId: SensoryRoomId, settings: SensoryHubSettings) {
    void this.resume().then(async () => {
      if (this.ambientRoom === roomId) {
        this.setVolume(settings);
        return;
      }
      this.stopAmbient();
      this.ensure();
      if (!this.ctx || !this.master) return;
      this.ambientRoom = roomId;
      this.volume = effectiveVolume(settings);
      const gainNode = this.ctx.createGain();
      this.ambientGain = gainNode;
      this.applyAmbientGain(false);
      gainNode.connect(this.master);

      const sampleUrl = AMBIENT_SAMPLES[roomId];
      if (sampleUrl) {
        const buffer = await this.loadSample(sampleUrl);
        if (this.ambientGain !== gainNode || !this.ctx) return;
        if (buffer) {
          const src = this.ctx.createBufferSource();
          src.buffer = buffer;
          src.loop = true;
          // حشوة ترميز MP3 في البداية والنهاية تُحدث فجوة عند التكرار
          src.loopStart = Math.min(0.06, buffer.duration / 4);
          src.loopEnd = Math.max(src.loopStart + 0.1, buffer.duration - 0.06);
          src.connect(gainNode);
          src.start(0, src.loopStart);
          this.ambientNodes.push(src);
          return;
        }
      }

      for (const layer of AMBIENT_PROFILES[roomId]) {
        if (layer.kind === 'tone') {
          const osc = this.ctx.createOscillator();
          osc.type = layer.type ?? 'sine';
          osc.frequency.value = layer.freq;
          const gain = this.ctx.createGain();
          gain.gain.value = layer.gain;
          osc.connect(gain);
          gain.connect(gainNode);
          osc.start();
          this.ambientNodes.push(osc);
        } else {
          const buffer = this.createNoiseBuffer(layer.duration ?? 2.4);
          const src = this.ctx.createBufferSource();
          src.buffer = buffer;
          src.loop = true;
          const filter = this.ctx.createBiquadFilter();
          filter.type = layer.filterType ?? 'lowpass';
          filter.frequency.value = layer.filterFreq ?? 680;
          const gain = this.ctx.createGain();
          gain.gain.value = layer.gain;
          src.connect(filter);
          filter.connect(gain);
          gain.connect(gainNode);
          src.start();
          this.ambientNodes.push(src);
        }
      }
    });
  }

  private createNoiseBuffer(seconds: number) {
    this.ensure();
    const sampleRate = this.ctx?.sampleRate ?? 44100;
    const length = Math.floor(sampleRate * seconds);
    const buffer = this.ctx!.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  pop(settings: SensoryHubSettings, freq = 620) {
    void this.resume().then(() => this.playPop(settings, freq));
  }

  chime(settings: SensoryHubSettings) {
    void this.resume().then(() => {
      [523.25, 659.25].forEach((f, i) => {
        window.setTimeout(() => this.playPop(settings, f, 0.07, 0.35), i * 120);
      });
    });
  }

  calmTone(settings: SensoryHubSettings) {
    void this.resume().then(() => this.playPop(settings, 392, 0.05, 0.55));
  }

  /** احتكاك رمل ناعم — ضجيج وردي منخفض */
  sandFriction(settings: SensoryHubSettings, intensity = 0.5) {
    void this.resume().then(() => {
      this.noiseBurst(settings, {
        seconds: 0.12,
        peak: 0.04 * intensity,
        filterType: 'lowpass',
        freqFrom: 680,
        freqTo: 680,
      });
    });
  }

  animalTone(settings: SensoryHubSettings, freq: number) {
    void this.resume().then(() => this.playPop(settings, freq, 0.09, 0.28));
  }

  /** صوت الحيوان الحقيقي — يعيد مدته بالثواني ليُنطق الاسم بعده لا فوقه */
  async playAnimalSound(settings: SensoryHubSettings, animalId: string): Promise<number> {
    await this.resume();
    this.setVolume(settings);
    if (!this.ctx || !this.master) return 0;
    const url = animalSoundUrl(animalId);
    const buffer = url ? await this.loadSample(url) : null;
    if (!this.ctx || !this.master) return 0;
    try {
      this.animalSrc?.stop();
    } catch {
      /* already ended */
    }
    this.animalSrc = null;
    if (buffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(this.master);
      src.start();
      this.animalSrc = src;
      return buffer.duration;
    }
    playNaturalAnimalSound(this.ctx, this.master, animalId, this.volume);
    return 1.2;
  }

  waveLap(settings: SensoryHubSettings) {
    void this.resume().then(() => this.playPop(settings, 220, 0.04, 0.5));
  }

  /** رشّة موج عند لمس الماء — ضجيج يهبط ترشيحه مثل موجة تنكسر */
  waveSplash(settings: SensoryHubSettings, strength = 0.6) {
    void this.resume().then(() => {
      this.noiseBurst(settings, {
        seconds: 0.9 + strength * 0.5,
        peak: 0.5 * strength,
        filterType: 'lowpass',
        freqFrom: 2200,
        freqTo: 300,
        attack: 0.08,
      });
    });
  }

  /** قطرة ماء عند اللمس — نغمة قصيرة تنزلق للأسفل */
  droplet(settings: SensoryHubSettings) {
    void this.resume().then(() => {
      if (!this.ctx || !this.master) return;
      this.setVolume(settings);
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const f = 900 + Math.random() * 500;
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.45, now + 0.09);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.25 * this.volume, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.16);
    });
  }

  /** @deprecated المطر الآن تسجيل حقيقي متكرر؛ استخدم setAmbientIntensity */
  rainDrop(settings: SensoryHubSettings, intensity = 0.5) {
    void settings;
    this.setAmbientIntensity(0.5 + intensity * 0.7);
  }

  private noiseBurst(
    settings: SensoryHubSettings,
    opts: {
      seconds: number;
      peak: number;
      filterType: BiquadFilterType;
      freqFrom: number;
      freqTo: number;
      attack?: number;
    }
  ) {
    try {
      this.setVolume(settings);
      if (!this.ctx || !this.master) return;
      const now = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.createNoiseBuffer(opts.seconds);
      const filter = this.ctx.createBiquadFilter();
      filter.type = opts.filterType;
      filter.frequency.setValueAtTime(opts.freqFrom, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqTo), now + opts.seconds);
      const gain = this.ctx.createGain();
      const peak = Math.max(0.0002, opts.peak * this.volume);
      const attack = opts.attack ?? 0.005;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.seconds);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(now);
      src.stop(now + opts.seconds + 0.02);
    } catch {
      /* ignore */
    }
  }

  private playPop(
    settings: SensoryHubSettings,
    freq: number,
    peak = 0.14,
    seconds = 0.22
  ) {
    try {
      this.setVolume(settings);
      if (!this.ctx || !this.master) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(180, freq * 0.5), now + seconds);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak * this.volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + seconds + 0.02);
    } catch {
      /* ignore */
    }
  }
}

type AmbientLayer =
  | {
      kind: 'tone';
      freq: number;
      gain: number;
      type?: OscillatorType;
    }
  | {
      kind: 'noise';
      gain: number;
      duration?: number;
      filterType?: BiquadFilterType;
      filterFreq?: number;
    };

const AMBIENT_PROFILES: Record<SensoryRoomId, AmbientLayer[]> = {
  bubbles: [
    { kind: 'tone', freq: 196, gain: 0.07, type: 'sine' },
    { kind: 'tone', freq: 294, gain: 0.045, type: 'triangle' },
  ],
  stars: [
    { kind: 'tone', freq: 174.61, gain: 0.08, type: 'sine' },
    { kind: 'noise', gain: 0.032, filterFreq: 420, duration: 3.2 },
  ],
  tracing: [
    { kind: 'tone', freq: 440, gain: 0.038, type: 'sine' },
    { kind: 'tone', freq: 554.37, gain: 0.026, type: 'triangle' },
  ],
  sand: [
    { kind: 'noise', gain: 0.058, filterFreq: 520, duration: 1.8 },
    { kind: 'tone', freq: 220, gain: 0.022, type: 'sine' },
  ],
  animals: [
    { kind: 'tone', freq: 329.63, gain: 0.048, type: 'triangle' },
    { kind: 'noise', gain: 0.022, filterFreq: 900, duration: 2.6 },
  ],
  waves: [
    { kind: 'noise', gain: 0.09, filterFreq: 420, duration: 4 },
    { kind: 'tone', freq: 146.83, gain: 0.03, type: 'sine' },
  ],
  rain: [
    { kind: 'noise', gain: 0.22, filterType: 'bandpass', filterFreq: 2400, duration: 1.2 },
    { kind: 'noise', gain: 0.14, filterFreq: 900, duration: 0.6 },
  ],
  mirror: [
    { kind: 'tone', freq: 523.25, gain: 0.034, type: 'sine' },
    { kind: 'tone', freq: 659.25, gain: 0.026, type: 'triangle' },
  ],
  classic: [
    { kind: 'tone', freq: 256, gain: 0.058, type: 'sine' },
    { kind: 'noise', gain: 0.034, filterFreq: 480, duration: 3.5 },
  ],
};

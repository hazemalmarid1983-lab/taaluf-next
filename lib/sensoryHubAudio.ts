/**
 * Web Audio API للجناح الحسي — أصوات نقية بحد أقصى آمن للصوت.
 */

import {
  effectiveVolume,
  type SensoryHubSettings,
  type SensoryRoomId,
} from './sensoryHub';
import { playNaturalAnimalSound } from './animalSoundSynth';

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

  setVolume(settings: SensoryHubSettings) {
    this.ensure();
    if (!this.master) return;
    this.master.gain.value = effectiveVolume(settings);
    if (this.ambientGain) {
      this.ambientGain.gain.value = effectiveVolume(settings) * 0.48;
    }
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

  /** صوت محيطي ناعم — مخصّص لكل غرفة */
  startAmbient(roomId: SensoryRoomId, settings: SensoryHubSettings) {
    void this.resume().then(() => {
      if (this.ambientRoom === roomId) {
        this.setVolume(settings);
        return;
      }
      this.stopAmbient();
      this.ensure();
      if (!this.ctx || !this.master) return;
      this.ambientRoom = roomId;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = effectiveVolume(settings) * 0.48;
      this.ambientGain.connect(this.master);

      const profile = AMBIENT_PROFILES[roomId];
      for (const layer of profile) {
        if (layer.kind === 'tone') {
          const osc = this.ctx.createOscillator();
          osc.type = layer.type ?? 'sine';
          osc.frequency.value = layer.freq;
          const gain = this.ctx.createGain();
          gain.gain.value = layer.gain;
          osc.connect(gain);
          gain.connect(this.ambientGain);
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
          gain.connect(this.ambientGain);
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
      try {
        this.setVolume(settings);
        if (!this.ctx || !this.master) return;
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i += 1) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 680;
        const gain = this.ctx.createGain();
        const peak = 0.04 * intensity * effectiveVolume(settings);
        gain.gain.setValueAtTime(peak, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        src.start(now);
        src.stop(now + 0.14);
      } catch {
        /* ignore */
      }
    });
  }

  animalTone(settings: SensoryHubSettings, freq: number) {
    void this.resume().then(() => this.playPop(settings, freq, 0.09, 0.28));
  }

  /** أصوات حيوانات — توليد طبيعي متعدد الطبقات */
  playAnimalSound(settings: SensoryHubSettings, animalId: string) {
    void this.resume().then(() => {
      this.setVolume(settings);
      if (!this.ctx || !this.master) return;
      playNaturalAnimalSound(this.ctx, this.master, animalId, effectiveVolume(settings));
    });
  }

  waveLap(settings: SensoryHubSettings) {
    void this.resume().then(() => this.playPop(settings, 220, 0.04, 0.5));
  }

  rainDrop(settings: SensoryHubSettings, intensity = 0.5) {
    void this.resume().then(() =>
      this.playPop(settings, 740, 0.025 * intensity, 0.08)
    );
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
      gain.gain.exponentialRampToValueAtTime(peak * effectiveVolume(settings), now + 0.015);
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
    { kind: 'noise', gain: 0.065, filterFreq: 380, duration: 4 },
    { kind: 'tone', freq: 146.83, gain: 0.034, type: 'sine' },
  ],
  rain: [
    { kind: 'noise', gain: 0.072, filterFreq: 740, duration: 1.2 },
    { kind: 'noise', gain: 0.034, filterFreq: 1200, duration: 0.6 },
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

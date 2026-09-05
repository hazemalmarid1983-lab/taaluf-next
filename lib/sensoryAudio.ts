const BUBBLE_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0];
const FISH_NOTES = [659.25, 783.99, 987.77];

function audioContextClass() {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  );
}

function makePinkNoise(ctx: AudioContext, seconds = 3) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] =
      (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
    b6 = white * 0.115926;
  }
  return buffer;
}

function isLive(ctx: AudioContext | null): ctx is AudioContext {
  return !!ctx && ctx.state !== 'closed';
}

export type SpeechLang = 'ar' | 'en';

type SpeechOptions = { lang?: SpeechLang; rate?: number; pitch?: number };

const SPEECH_LOCALE: Record<SpeechLang, string> = {
  ar: 'ar-SA',
  en: 'en-US',
};

/** المتصفح يجمع قمامة كائن النطق قبل انتهائه فينقطع الصوت — نثبّت مرجعاً له */
type UtteranceHolder = { _lastUtterance?: SpeechSynthesisUtterance };

function getSynth() {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis || null;
}

/** يُبطل أي نطق مؤجَّل أو احتياطي إذا أُلغي الصوت أو طُلب نطق أحدث */
let speechToken = 0;

/** آخر مقطع صوتي قيد التشغيل — نوقفه قبل تشغيل غيره */
let currentAudio: HTMLAudioElement | null = null;

/**
 * يختار أفضل صوت متاح للغة المطلوبة: أي لهجة منها (ar-SA / ar-EG / en-GB …)
 * أو صوت يحمل اسم اللغة، مع تفضيل أصوات Google/Microsoft لأنها أوضح من المدمجة.
 * يعود بـ undefined إن لم يوجد صوت مناسب، فنترك المتصفح يحسم عبر lang.
 */
export function pickVoiceForLang(
  voices: SpeechSynthesisVoice[],
  lang: SpeechLang
) {
  const namePattern = lang === 'ar' ? /arabic|عرب/i : /english/i;
  const matches = voices.filter(
    (voice) =>
      voice.lang.toLowerCase().startsWith(lang) || namePattern.test(voice.name)
  );
  if (!matches.length) return undefined;

  const preferred = SPEECH_LOCALE[lang].toLowerCase();
  const rank = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase();
    let score = 0;
    if (name.includes('google') || name.includes('microsoft')) score += 2;
    if (voice.lang.toLowerCase().startsWith(preferred)) score += 1;
    return score;
  };

  return [...matches].sort((a, b) => rank(b) - rank(a))[0];
}

function utterInLang(
  synth: SpeechSynthesis,
  text: string,
  opts?: SpeechOptions
) {
  try {
    const lang = opts?.lang ?? 'ar';
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = SPEECH_LOCALE[lang];
    utter.rate = opts?.rate ?? 0.82;
    utter.pitch = opts?.pitch ?? 1.08;

    const voice = pickVoiceForLang(synth.getVoices(), lang);
    if (voice) utter.voice = voice;

    (window as unknown as UtteranceHolder)._lastUtterance = utter;

    synth.resume();
    synth.speak(utter);
  } catch {
    /* ignore missing speech engine */
  }
}

/** احتياط محلي إن تعذّر الوصول للمسار السيرفري */
function speakWithSynthesis(text: string, opts?: SpeechOptions) {
  const synth = getSynth();
  if (!synth) return;
  try {
    // إلغاء أي نطق معلق ثم فك التعليق يعيد تنشيط محرك صامت في حالة خاطئة
    synth.cancel();
    synth.resume();

    if (synth.getVoices().length > 0) {
      utterInLang(synth, text, opts);
      return;
    }

    // القائمة تُحمّل لاحقاً في كروم، والنطق قبل جهوزيتها يخرج صامتاً
    const token = ++speechToken;
    const speakOnce = () => {
      if (token !== speechToken) return;
      speechToken += 1;
      utterInLang(synth, text, opts);
    };
    synth.addEventListener('voiceschanged', speakOnce, { once: true });
    window.setTimeout(speakOnce, 300);
  } catch {
    /* ignore missing speech engine */
  }
}

function stopCurrentAudio() {
  if (!currentAudio) return;
  try {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  } catch {
    /* ignore */
  }
  currentAudio = null;
}

function ttsSpeed(rate?: number) {
  const value = rate ?? 0.85;
  if (!Number.isFinite(value)) return 0.85;
  return Math.min(1, Math.max(0.3, Number(value.toFixed(2))));
}

/**
 * نطق كلمة/عبارة بصوت واضح وبطيء يناسب الأطفال، بلغة الواجهة.
 * يعتمد على مسار الخادم `/api/tts` لأن كثيراً من أجهزة أولياء الأمور
 * تخلو من حزم أصوات عربية فيخرج SpeechSynthesis صامتاً — ويبقى الأخير احتياطاً.
 */
export function speakText(text: string, opts?: SpeechOptions) {
  const clean = text.trim();
  if (typeof window === 'undefined' || !clean) return;

  stopSpeaking();
  const token = ++speechToken;

  let usedFallback = false;
  const fallback = () => {
    if (usedFallback || token !== speechToken) return;
    usedFallback = true;
    speakWithSynthesis(clean, opts);
  };

  try {
    const query = new URLSearchParams({
      text: clean,
      tl: opts?.lang ?? 'ar',
      speed: String(ttsSpeed(opts?.rate)),
    });
    const audio = new Audio(`/api/tts?${query.toString()}`);
    currentAudio = audio;
    // الطلب الفاشل قد يُرفض من play() أو يصل كحدث error حسب المتصفح
    audio.addEventListener('error', fallback);
    audio.addEventListener('ended', () => {
      if (currentAudio === audio) currentAudio = null;
    });
    void audio.play().catch(fallback);
  } catch {
    fallback();
  }
}

export function stopSpeaking() {
  speechToken += 1;
  stopCurrentAudio();
  const synth = getSynth();
  if (!synth) return;
  try {
    synth.cancel();
  } catch {
    /* ignore */
  }
}

/**
 * قوائم الأصوات تُحمّل بشكل غير متزامن في بعض المتصفحات، فإن لم تُطلب مبكراً
 * جاءت أول محاولة نطق احتياطية بصوت خاطئ أو صامتة تماماً.
 */
export function warmUpVoices() {
  const synth = getSynth();
  if (!synth) return;
  try {
    synth.getVoices();
  } catch {
    /* ignore */
  }
}

/** نغمات تعزيز قصيرة للاستجابة الصحيحة/الخاطئة */
export class RewardAudio {
  private ctx: AudioContext | null = null;

  private init() {
    const Ctor = audioContextClass();
    if (!Ctor) return;
    if (!this.ctx) this.ctx = new Ctor();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  playSuccess() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.09;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    } catch {
      /* ignore */
    }
  }

  /** نغمة انتهاء المؤقت: أنعم وأبطأ من نغمة التعزيز حتى لا تُفزع الطفل */
  playChime() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      [659.25, 880.0].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.3;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.07, t + 0.14);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.95);
      });
    } catch {
      /* ignore */
    }
  }

  /**
   * فرقعة فقاعة للتفريغ الحسي: واضحة وممتعة دون أن تكون حادة أو مزعجة
   * عند التكرار السريع في لوحة التهدئة.
   */
  playPop() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;
      const peak = 0.09;

      const body = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      body.type = 'sine';
      body.frequency.setValueAtTime(680, now);
      body.frequency.exponentialRampToValueAtTime(260, now + 0.2);
      bodyGain.gain.setValueAtTime(0.0001, now);
      bodyGain.gain.exponentialRampToValueAtTime(peak, now + 0.012);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      body.connect(bodyGain);
      bodyGain.connect(ctx.destination);
      body.start(now);
      body.stop(now + 0.26);

      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(1180, now);
      click.frequency.exponentialRampToValueAtTime(720, now + 0.05);
      clickGain.gain.setValueAtTime(peak * 0.55, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      click.connect(clickGain);
      clickGain.connect(ctx.destination);
      click.start(now);
      click.stop(now + 0.08);

      const ring = ctx.createOscillator();
      const ringGain = ctx.createGain();
      ring.type = 'sine';
      ring.frequency.setValueAtTime(920, now + 0.015);
      ring.frequency.exponentialRampToValueAtTime(480, now + 0.16);
      ringGain.gain.setValueAtTime(0.0001, now + 0.015);
      ringGain.gain.exponentialRampToValueAtTime(peak * 0.35, now + 0.03);
      ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      ring.connect(ringGain);
      ringGain.connect(ctx.destination);
      ring.start(now + 0.015);
      ring.stop(now + 0.22);
    } catch {
      /* ignore */
    }
  }

  playMiss() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(210, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      /* ignore */
    }
  }
}

/** خرير ماء خفيف (جدول هادئ) + نغمات فقاعات عند اللمس */
export class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambient: GainNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private muted = false;
  private running = false;
  private starting: Promise<void> | null = null;

  get isMuted() {
    return this.muted;
  }

  private ensure() {
    try {
      const Ctor = audioContextClass();
      if (!Ctor || this.ctx) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.ambient = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.ambient.gain.value = 0.1;
      this.ambient.connect(this.master);
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
      this.master = null;
      this.ambient = null;
    }
  }

  async start() {
    if (this.starting) return this.starting;
    this.starting = this.startInner().finally(() => {
      this.starting = null;
    });
    return this.starting;
  }

  private async startInner() {
    try {
      this.ensure();
      if (!this.ctx || !this.ambient || this.running) {
        if (isLive(this.ctx) && this.ctx.state === 'suspended') {
          await this.ctx.resume();
        }
        return;
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      if (!isLive(this.ctx) || !this.ambient) return;

      const noise = this.ctx.createBufferSource();
      noise.buffer = makePinkNoise(this.ctx, 4);
      noise.loop = true;

      const stream = this.ctx.createBiquadFilter();
      stream.type = 'bandpass';
      stream.frequency.value = 680;
      stream.Q.value = 0.55;

      const soften = this.ctx.createBiquadFilter();
      soften.type = 'lowpass';
      soften.frequency.value = 1600;
      soften.Q.value = 0.4;

      const streamGain = this.ctx.createGain();
      streamGain.gain.value = 0.7;

      noise.connect(stream);
      stream.connect(soften);
      soften.connect(streamGain);
      streamGain.connect(this.ambient);

      const sway = this.ctx.createOscillator();
      sway.type = 'sine';
      sway.frequency.value = 0.06;
      const swayDepth = this.ctx.createGain();
      swayDepth.gain.value = 160;
      sway.connect(swayDepth);
      swayDepth.connect(stream.frequency);

      noise.start();
      sway.start();
      this.sources = [noise, sway];
      this.running = true;
    } catch {
      this.running = false;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      if (!this.master || !isLive(this.ctx) || !this.ctx) return;
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setValueAtTime(
        this.master.gain.value,
        this.ctx.currentTime
      );
      this.master.gain.linearRampToValueAtTime(
        muted ? 0 : 1,
        this.ctx.currentTime + 0.12
      );
    } catch {
      /* ignore */
    }
  }

  playTouch() {
    void this.start()
      .then(() => {
        if (!this.ctx || !this.master || this.muted) return;
        const note =
          BUBBLE_NOTES[Math.floor(Math.random() * BUBBLE_NOTES.length)] || 659;
        this.bubblePop(note);
      })
      .catch(() => undefined);
  }

  playFishChime() {
    void this.start()
      .then(() => {
        if (!this.ctx || !this.master || this.muted) return;
        FISH_NOTES.forEach((freq, i) => {
          window.setTimeout(() => this.bubblePop(freq, 0.22, 0.55), i * 80);
        });
      })
      .catch(() => undefined);
  }

  private bubblePop(startFreq: number, volume = 0.2, seconds = 0.42) {
    try {
      if (!this.ctx || !this.master || !isLive(this.ctx)) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(180, startFreq * 0.45),
        now + seconds
      );
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + seconds);

      const click = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      click.type = 'sine';
      click.frequency.setValueAtTime(startFreq * 1.6, now);
      clickGain.gain.setValueAtTime(volume * 0.35, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      click.connect(clickGain);
      clickGain.connect(this.master);
      click.start(now);
      click.stop(now + 0.09);
    } catch {
      /* ignore */
    }
  }

  close() {
    this.sources.forEach((src) => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    });
    this.sources = [];
    this.running = false;
    try {
      void this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.ctx = null;
    this.master = null;
    this.ambient = null;
  }
}

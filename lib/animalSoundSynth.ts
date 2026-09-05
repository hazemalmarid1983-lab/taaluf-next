/**
 * أصوات حيوانات مركّبة — أقرب للطبيعة عبر Web Audio (ضجيج بني، فلاتر، تمويج).
 */

function brownNoiseBuffer(ctx: AudioContext, seconds: number) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

function connectChain(
  ctx: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  peak: number,
  when: number,
  attack: number,
  hold: number,
  release: number
) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + attack);
  gain.gain.setValueAtTime(Math.max(0.0002, peak), when + attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + attack + hold + release);
  source.connect(gain);
  gain.connect(destination);
}

function noiseBurst(
  ctx: AudioContext,
  dest: AudioNode,
  when: number,
  peak: number,
  duration: number,
  filterHz: number,
  q = 1.2,
  type: BiquadFilterType = 'bandpass'
) {
  const src = ctx.createBufferSource();
  src.buffer = brownNoiseBuffer(ctx, duration + 0.05);
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = filterHz;
  filter.Q.value = q;
  src.connect(filter);
  connectChain(ctx, filter, dest, peak, when, 0.008, duration * 0.35, duration * 0.65);
  src.start(when);
  src.stop(when + duration + 0.08);
}

function toneContour(
  ctx: AudioContext,
  dest: AudioNode,
  when: number,
  peak: number,
  points: Array<{ t: number; f: number }>,
  type: OscillatorType = 'sine',
  vibratoHz = 0,
  vibratoDepth = 0
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  const total = points[points.length - 1]?.t ?? 0.4;
  points.forEach((pt, i) => {
    const at = when + pt.t;
    if (i === 0) osc.frequency.setValueAtTime(pt.f, at);
    else osc.frequency.linearRampToValueAtTime(pt.f, at);
  });
  if (vibratoHz > 0 && vibratoDepth > 0) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = vibratoHz;
    depth.gain.value = vibratoDepth;
    lfo.connect(depth);
    depth.connect(osc.frequency);
    lfo.start(when);
    lfo.stop(when + total + 0.1);
  }
  connectChain(ctx, osc, dest, peak, when, 0.04, total * 0.55, total * 0.45);
  osc.start(when);
  osc.stop(when + total + 0.12);
}

function playDog(ctx: AudioContext, dest: AudioNode, vol: number) {
  const now = ctx.currentTime;
  [0, 0.17].forEach((delay, i) => {
    const t = now + delay;
    const f = i === 0 ? 520 : 610;
    noiseBurst(ctx, dest, t, vol * 0.85, 0.12, f, 1.4);
    noiseBurst(ctx, dest, t, vol * 0.35, 0.09, f * 1.8, 2.1, 'highpass');
    toneContour(ctx, dest, t, vol * 0.18, [
      { t: 0, f: 180 },
      { t: 0.04, f: 240 },
      { t: 0.11, f: 150 },
    ], 'triangle');
  });
}

function playCat(ctx: AudioContext, dest: AudioNode, vol: number) {
  const now = ctx.currentTime;
  toneContour(
    ctx,
    dest,
    now,
    vol * 0.55,
    [
      { t: 0, f: 520 },
      { t: 0.12, f: 880 },
      { t: 0.28, f: 720 },
      { t: 0.52, f: 380 },
    ],
    'sine',
    6,
    18
  );
  noiseBurst(ctx, dest, now + 0.05, vol * 0.12, 0.35, 2800, 0.8, 'bandpass');
}

function playBird(ctx: AudioContext, dest: AudioNode, vol: number) {
  const now = ctx.currentTime;
  [0, 0.07, 0.13, 0.21].forEach((delay, i) => {
    const base = 2400 + i * 180;
    toneContour(ctx, dest, now + delay, vol * 0.28, [
      { t: 0, f: base },
      { t: 0.03, f: base + 420 },
      { t: 0.07, f: base - 80 },
    ], 'sine');
  });
}

function playCow(ctx: AudioContext, dest: AudioNode, vol: number) {
  const now = ctx.currentTime;
  toneContour(
    ctx,
    dest,
    now,
    vol * 0.62,
    [
      { t: 0, f: 115 },
      { t: 0.25, f: 98 },
      { t: 0.85, f: 88 },
    ],
    'sawtooth',
    4.5,
    6
  );
  noiseBurst(ctx, dest, now, vol * 0.08, 0.75, 220, 0.7, 'lowpass');
}

function playSheep(ctx: AudioContext, dest: AudioNode, vol: number) {
  const now = ctx.currentTime;
  [0, 0.24].forEach((delay) => {
    toneContour(
      ctx,
      dest,
      now + delay,
      vol * 0.42,
      [
        { t: 0, f: 340 },
        { t: 0.08, f: 520 },
        { t: 0.18, f: 410 },
        { t: 0.28, f: 300 },
      ],
      'triangle',
      11,
      35
    );
  });
}

function playLion(ctx: AudioContext, dest: AudioNode, vol: number) {
  const now = ctx.currentTime;
  noiseBurst(ctx, dest, now, vol * 0.7, 0.95, 140, 0.55, 'lowpass');
  toneContour(
    ctx,
    dest,
    now,
    vol * 0.48,
    [
      { t: 0, f: 95 },
      { t: 0.35, f: 72 },
      { t: 0.9, f: 58 },
    ],
    'sawtooth',
    3,
    4
  );
  toneContour(ctx, dest, now + 0.08, vol * 0.22, [
    { t: 0, f: 180 },
    { t: 0.5, f: 120 },
    { t: 0.85, f: 90 },
  ], 'square');
}

/** يشغّل صوت حيوان طبيعيّاً أكثر عبر Web Audio */
export function playNaturalAnimalSound(
  ctx: AudioContext,
  destination: AudioNode,
  animalId: string,
  volume: number
) {
  const vol = Math.min(1.1, Math.max(0.15, volume * 1.15));
  switch (animalId) {
    case 'dog':
      playDog(ctx, destination, vol);
      break;
    case 'cat':
      playCat(ctx, destination, vol);
      break;
    case 'bird':
      playBird(ctx, destination, vol);
      break;
    case 'cow':
      playCow(ctx, destination, vol);
      break;
    case 'sheep':
      playSheep(ctx, destination, vol);
      break;
    case 'lion':
      playLion(ctx, destination, vol);
      break;
    default:
      noiseBurst(ctx, destination, ctx.currentTime, vol * 0.4, 0.15, 440, 1);
  }
}

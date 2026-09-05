/**
 * جناح الغرف الحسية والتنظيم الانفعالي — أنواع، حدود آمنة، ومقاييس الجلسة.
 */

export type SensoryRoomId =
  | 'bubbles'
  | 'stars'
  | 'tracing'
  | 'sand'
  | 'animals'
  | 'waves'
  | 'rain'
  | 'mirror'
  | 'classic';

export type SensoryHubSettings = {
  /** 0–1 — يُقيَّد بـ SENSORY_LIMITS.maxVolume */
  volume: number;
  /** 0–1 — سطوع الألوان والإضاءة */
  brightness: number;
  /** 0–1 — حساسية التفاعل (حجم الأهداف / سرعة الحركة) */
  sensitivity: number;
};

export const SENSORY_LIMITS = {
  maxVolume: 0.78,
  minVolume: 0.08,
  maxBrightness: 0.92,
  minBrightness: 0.38,
  maxSensitivity: 1,
  minSensitivity: 0.35,
  /** أقصى تشبّع لوني لمنع وميض قوي */
  maxColorSaturation: 0.72,
} as const;

export const DEFAULT_SENSORY_SETTINGS: SensoryHubSettings = {
  volume: 0.62,
  brightness: 0.72,
  sensitivity: 0.65,
};

export type SensoryHubSessionMetrics = {
  roomId: SensoryRoomId;
  childId: string;
  durationMs: number;
  interactions: number;
  /** تفاعلات/دقيقة */
  interactionRate: number;
  /** مجموعات تفاعل متقاربة (≥3 خلال 2ث) */
  interactionBursts: number;
  /** 0–1 — نسبة الوقت النشط */
  activeRatio: number;
  /** 0–100 — مؤشر الهدوء للربط بالملف */
  calmIndex: number;
  /** 0–100 — مؤشر المشاركة/الانخراط */
  engagementIndex: number;
  breathingCycles?: number;
  emergencyCalmCount?: number;
  settings: SensoryHubSettings;
  startedAt: string;
  endedAt: string;
};

export const SENSORY_HUB_STORAGE_KEY = 'taaluf.sensoryHub.v1';

export const SENSORY_ROOMS: Array<{
  id: SensoryRoomId;
  emoji: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  href: string;
  tone: string;
}> = [
  {
    id: 'bubbles',
    emoji: '🫧',
    titleAr: 'غرفة الفقاعات',
    titleEn: 'Bubble pop room',
    descAr: 'فقاعات عائمة تنفجر باللمس — ضغط مطول للتضخم قبل الانفجار.',
    descEn: 'Floating bubbles pop on touch — long-press to inflate first.',
    href: '/sensory-rooms/bubbles',
    tone: 'from-cyan-900/40 to-sky-950',
  },
  {
    id: 'stars',
    emoji: '🌌',
    titleAr: 'غرفة النجوم والتنفس',
    titleEn: 'Calming star room',
    descAr: 'سماء ليلية هادئة مع مؤقت تنفس دائري وزر طوارئ «اهدأ».',
    descEn: 'Calm night sky with a breathing circle and instant calm button.',
    href: '/sensory-rooms/stars',
    tone: 'from-indigo-950/50 to-slate-950',
  },
  {
    id: 'tracing',
    emoji: '✨',
    titleAr: 'غرفة الرسم الضوئي',
    titleEn: 'Light tracing room',
    descAr: 'تتبع مسارات متدرجة بتغذية بصرية مضيئة وناعمة.',
    descEn: 'Trace progressive paths with soft glowing visual feedback.',
    href: '/sensory-rooms/tracing',
    tone: 'from-violet-950/40 to-slate-950',
  },
  {
    id: 'sand',
    emoji: '🏖️',
    titleAr: 'الرمل السحري',
    titleEn: 'Magic sand room',
    descAr: 'مسارات رملية باللمس المتعدد وتلال بالضغط المستمر — أصوات احتكاك ناعمة.',
    descEn: 'Multi-touch sand trails and mounds — soft friction sounds.',
    href: '/sensory-rooms/sand',
    tone: 'from-amber-950/40 to-orange-950',
  },
  {
    id: 'animals',
    emoji: '🦁',
    titleAr: 'حديقة أصوات الحيوانات',
    titleEn: 'Animal sound garden',
    descAr: 'ست بطاقات كبيرة — نطق وصوت واضح لدعم المحاكاة السمعية.',
    descEn: 'Six large cards — clear speech and sounds for auditory modelling.',
    href: '/sensory-rooms/animals',
    tone: 'from-lime-950/30 to-emerald-950',
  },
  {
    id: 'waves',
    emoji: '⛵',
    titleAr: 'تأمل الموجة والقارب',
    titleEn: 'Wave & boat meditation',
    descAr: 'أمواج انسيابية وقارب متزن — إمالة الجهاز أو السحب باللمس.',
    descEn: 'Flowing waves and a balanced boat — tilt or drag to interact.',
    href: '/sensory-rooms/waves',
    tone: 'from-blue-950/50 to-teal-950',
  },
  {
    id: 'rain',
    emoji: '🌧️',
    titleAr: 'غرفة المطر التفاعلية',
    titleEn: 'Interactive rain room',
    descAr: 'مطر ناعم وتموجات مائية — اختيارياً يرتبط الهدوء بخفة المطر.',
    descEn: 'Soft rain and ripples — optional mic links calm voice to lighter rain.',
    href: '/sensory-rooms/rain',
    tone: 'from-slate-900/60 to-sky-950',
  },
  {
    id: 'mirror',
    emoji: '🪞',
    titleAr: 'المرآة السحرية',
    titleEn: 'Magic mirror',
    descAr: 'كاميرا محلية فقط مع فراشات وسحب — لا تسجيل ولا حفظ.',
    descEn: 'Local camera only with gentle overlays — no recording or saving.',
    href: '/sensory-rooms/mirror',
    tone: 'from-fuchsia-950/30 to-violet-950',
  },
  {
    id: 'classic',
    emoji: '🐟',
    titleAr: 'الغرفة الحسية الكلاسيكية',
    titleEn: 'Classic sensory sanctuary',
    descAr: 'بحيرة الأسماك وأنبوب الفقاعات — تجربة تآزر بصري حركي.',
    descEn: 'Fish pond and bubble tube — visual-motor synergy experience.',
    href: '/sensory-room',
    tone: 'from-teal-950/40 to-slate-950',
  },
];

export function clampSensorySettings(
  settings: Partial<SensoryHubSettings>
): SensoryHubSettings {
  return {
    volume: clamp(
      settings.volume ?? DEFAULT_SENSORY_SETTINGS.volume,
      SENSORY_LIMITS.minVolume,
      SENSORY_LIMITS.maxVolume
    ),
    brightness: clamp(
      settings.brightness ?? DEFAULT_SENSORY_SETTINGS.brightness,
      SENSORY_LIMITS.minBrightness,
      SENSORY_LIMITS.maxBrightness
    ),
    sensitivity: clamp(
      settings.sensitivity ?? DEFAULT_SENSORY_SETTINGS.sensitivity,
      SENSORY_LIMITS.minSensitivity,
      SENSORY_LIMITS.maxSensitivity
    ),
  };
}

export function effectiveVolume(settings: SensoryHubSettings) {
  return clamp(
    settings.volume,
    SENSORY_LIMITS.minVolume,
    SENSORY_LIMITS.maxVolume
  );
}

export function effectiveBrightness(settings: SensoryHubSettings) {
  return clamp(
    settings.brightness,
    SENSORY_LIMITS.minBrightness,
    SENSORY_LIMITS.maxBrightness
  );
}

/** saturation 0–100 → capped for overload protection */
export function safeSaturation(base: number, settings: SensoryHubSettings) {
  const cap = SENSORY_LIMITS.maxColorSaturation * 100;
  return Math.min(base * effectiveBrightness(settings), cap);
}

export function computeCalmIndex(metrics: {
  durationMs: number;
  interactions: number;
  breathingCycles?: number;
  emergencyCalmCount?: number;
  interactionRate?: number;
  interactionBursts?: number;
}) {
  if (metrics.durationMs < 800) return 0;
  const minutes = metrics.durationMs / 60000;
  const rate =
    metrics.interactionRate ??
    metrics.interactions / Math.max(metrics.durationMs / 1000, 1);
  let index = 48;
  index += Math.min(28, minutes * 7);
  index += Math.min(16, (metrics.breathingCycles ?? 0) * 4);
  index += Math.min(8, (metrics.emergencyCalmCount ?? 0) * 4);
  if (rate > 2.8) index -= Math.min(22, (rate - 2.8) * 6);
  if ((metrics.interactionBursts ?? 0) > minutes * 4) {
    index -= Math.min(12, ((metrics.interactionBursts ?? 0) - minutes * 4) * 2);
  }
  return Math.round(clamp(index, 0, 100));
}

export type InteractionPatternMetrics = {
  interactionRate: number;
  interactionBursts: number;
  longestIdleMs: number;
  activeRatio: number;
};

/** تحليل أنماط التفاعل لجلسة حسية */
export function analyzeInteractionPattern(
  timestamps: number[],
  durationMs: number,
  sessionStartMs: number
): InteractionPatternMetrics {
  if (durationMs < 800 || timestamps.length === 0) {
    return {
      interactionRate: 0,
      interactionBursts: 0,
      longestIdleMs: durationMs,
      activeRatio: 0,
    };
  }

  const minutes = durationMs / 60000;
  const interactionRate = timestamps.length / Math.max(minutes, 1 / 60);

  let interactionBursts = 0;
  for (let i = 0; i < timestamps.length; i += 1) {
    let j = i + 1;
    while (j < timestamps.length && timestamps[j] - timestamps[i] <= 2000) {
      j += 1;
    }
    if (j - i >= 3) {
      interactionBursts += 1;
      i = j - 1;
    }
  }

  const relative = timestamps.map((t) => t - sessionStartMs);
  let longestIdleMs = relative[0];
  for (let i = 1; i < relative.length; i += 1) {
    longestIdleMs = Math.max(longestIdleMs, relative[i] - relative[i - 1]);
  }
  longestIdleMs = Math.max(
    longestIdleMs,
    durationMs - relative[relative.length - 1]
  );

  const binMs = 10_000;
  const bins = Math.max(1, Math.ceil(durationMs / binMs));
  const activeBins = new Set<number>();
  for (const t of relative) {
    activeBins.add(Math.min(bins - 1, Math.floor(t / binMs)));
  }
  const activeRatio = activeBins.size / bins;

  return {
    interactionRate: Math.round(interactionRate * 10) / 10,
    interactionBursts,
    longestIdleMs,
    activeRatio: Math.round(activeRatio * 100) / 100,
  };
}

export function computeEngagementIndex(metrics: {
  durationMs: number;
  interactions: number;
  interactionRate: number;
  interactionBursts: number;
  activeRatio: number;
  breathingCycles?: number;
}): number {
  if (metrics.durationMs < 800) return 0;
  const minutes = metrics.durationMs / 60000;
  let score = 32;
  score += Math.min(28, metrics.activeRatio * 35);
  score += Math.min(
    18,
    metrics.interactions > 0 ? Math.log10(metrics.interactions + 1) * 14 : 0
  );
  score += Math.min(12, (metrics.breathingCycles ?? 0) * 4);
  if (metrics.interactionRate >= 6 && metrics.interactionRate <= 48) {
    score += 10;
  }
  const burstsPerMin = metrics.interactionBursts / Math.max(minutes, 1 / 60);
  if (burstsPerMin > 3) {
    score -= Math.min(16, (burstsPerMin - 3) * 3);
  }
  return Math.round(clamp(score, 0, 100));
}

/** يبني مقاييس الجلسة السريرية الموحّدة */
export function buildSensorySessionMetrics(input: {
  roomId: SensoryRoomId;
  childId: string;
  durationMs: number;
  interactions: number;
  interactionTimestamps: number[];
  sessionStartMs: number;
  breathingCycles?: number;
  emergencyCalmCount?: number;
  settings: SensoryHubSettings;
  startedAt: string;
  endedAt: string;
}): SensoryHubSessionMetrics {
  const pattern = analyzeInteractionPattern(
    input.interactionTimestamps,
    input.durationMs,
    input.sessionStartMs
  );
  const calmIndex = computeCalmIndex({
    durationMs: input.durationMs,
    interactions: input.interactions,
    breathingCycles: input.breathingCycles,
    emergencyCalmCount: input.emergencyCalmCount,
    interactionRate: pattern.interactionRate / 60,
    interactionBursts: pattern.interactionBursts,
  });
  const engagementIndex = computeEngagementIndex({
    durationMs: input.durationMs,
    interactions: input.interactions,
    interactionRate: pattern.interactionRate,
    interactionBursts: pattern.interactionBursts,
    activeRatio: pattern.activeRatio,
    breathingCycles: input.breathingCycles,
  });

  return {
    roomId: input.roomId,
    childId: input.childId,
    durationMs: input.durationMs,
    interactions: input.interactions,
    interactionRate: pattern.interactionRate,
    interactionBursts: pattern.interactionBursts,
    activeRatio: pattern.activeRatio,
    calmIndex,
    engagementIndex,
    breathingCycles: input.breathingCycles,
    emergencyCalmCount: input.emergencyCalmCount,
    settings: clampSensorySettings(input.settings),
    startedAt: input.startedAt,
    endedAt: input.endedAt,
  };
}

export function formatSessionClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

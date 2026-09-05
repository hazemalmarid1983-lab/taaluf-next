/**
 * مغامرة البطل الصغير — منطق المراحل والتقييم المشترك بين Unity وNext.js.
 * ليست تشخيصاً طبياً. الدرجات تُحوَّل لاحقاً إلى معايير تآلف (حاجة أعلى = درجة أعلى).
 */

export const LITTLE_HERO_GAME_CODE = 'little_hero' as const;

export const LITTLE_HERO_CRITERIA = {
  imitation: ['C15', 'C16', 'C11'] as const,
  visualTracking: ['C11', 'C12'] as const,
  emotions: ['C17', 'C32'] as const,
};

export const IMITATION_MOVES = [
  { id: 'hands_up', label: 'ارفع يديك' },
  { id: 'clap', label: 'صفّق' },
  { id: 'touch_nose', label: 'المس أنفك' },
  { id: 'wave', label: 'لوّح' },
  { id: 'smile', label: 'ابتسم' },
] as const;

export const CREATURES = [
  { id: 'bear', label: 'دبدوب', color: '#8B5A2B' },
  { id: 'rabbit', label: 'أرنب', color: '#F4E1C1' },
  { id: 'cat', label: 'قطة', color: '#E39B3D' },
  { id: 'bird', label: 'طائر', color: '#3D8BDA' },
] as const;

export const EMOTIONS = [
  { id: 'joy', label: 'فرح', emoji: '😊' },
  { id: 'sad', label: 'حزن', emoji: '😢' },
  { id: 'fear', label: 'خوف', emoji: '😨' },
  { id: 'anger', label: 'غضب', emoji: '😠' },
] as const;

export const SKIN_TONES = ['#F8D7B8', '#E8B98A', '#C68642', '#8D5524'] as const;
export const SHIRT_COLORS = ['#2D8B5A', '#3D8BDA', '#E39B3D', '#C45C7A'] as const;

export type LittleHeroStage = 'hub' | 'imitation' | 'tracking' | 'emotions' | 'results';
export type CreatureId = (typeof CREATURES)[number]['id'];
export type EmotionId = (typeof EMOTIONS)[number]['id'];
export type MoveId = (typeof IMITATION_MOVES)[number]['id'];

export type LittleHeroAppearance = {
  skin: number;
  shirt: number;
};

export type StageTrial = {
  stage: 'imitation' | 'tracking' | 'emotions';
  promptId: string;
  success: boolean;
  responseMs: number;
  distracted?: boolean;
  at: string;
};

export type LittleHeroMetrics = {
  imitationRate: number;
  trackingAccuracy: number;
  emotionAccuracy: number;
  avgResponseMs: number;
  distractionRate: number;
  linkedCriteria: string[];
  scoring: 'child_playable';
  gazeUsed: boolean;
};

export type LittleHeroResult = {
  score: number;
  levelReached: number;
  metrics: LittleHeroMetrics;
  trials: StageTrial[];
  startedAt: string;
  endedAt: string;
};

export function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function rateFromTrials(trials: StageTrial[], stage: StageTrial['stage']) {
  const rows = trials.filter((t) => t.stage === stage);
  if (!rows.length) return 0;
  return rows.filter((t) => t.success).length / rows.length;
}

export function distractionRate(trials: StageTrial[]) {
  const rows = trials.filter((t) => t.stage === 'tracking');
  if (!rows.length) return 0;
  return rows.filter((t) => t.distracted).length / rows.length;
}

export function avgResponseMs(trials: StageTrial[]) {
  if (!trials.length) return 0;
  return Math.round(
    trials.reduce((sum, t) => sum + Math.max(0, t.responseMs), 0) / trials.length
  );
}

/** معدل نجاح أعلى → حاجة دعم أقل → درجة معيار 0–3 */
export function concernFromSuccessRate(rate: number) {
  return Math.round((1 - clamp01(rate)) * 3);
}

export function buildLittleHeroResult(params: {
  trials: StageTrial[];
  startedAt: string;
  gazeUsed?: boolean;
}): LittleHeroResult {
  const imitationRate = rateFromTrials(params.trials, 'imitation');
  const trackingAccuracy = rateFromTrials(params.trials, 'tracking');
  const emotionAccuracy = rateFromTrials(params.trials, 'emotions');
  const distract = distractionRate(params.trials);
  const response = avgResponseMs(params.trials);
  const score = Math.round(
    imitationRate * 40 + trackingAccuracy * 35 + emotionAccuracy * 25
  );

  return {
    score,
    levelReached: 3,
    metrics: {
      imitationRate,
      trackingAccuracy,
      emotionAccuracy,
      avgResponseMs: response,
      distractionRate: distract,
      linkedCriteria: [
        ...LITTLE_HERO_CRITERIA.imitation,
        ...LITTLE_HERO_CRITERIA.visualTracking,
        ...LITTLE_HERO_CRITERIA.emotions,
      ],
      scoring: 'child_playable',
      gazeUsed: Boolean(params.gazeUsed),
    },
    trials: params.trials,
    startedAt: params.startedAt,
    endedAt: new Date().toISOString(),
  };
}

export const LITTLE_HERO_MESSAGE_SOURCE = 'taaluf-little-hero';

export type LittleHeroPageMessage =
  | { type: 'ready' }
  | { type: 'complete'; result: LittleHeroResult; childId?: string }
  | { type: 'gaze'; x: number; y: number; present: boolean };

export function isLittleHeroMessage(
  data: unknown
): data is { source: typeof LITTLE_HERO_MESSAGE_SOURCE; payload: LittleHeroPageMessage } {
  if (!data || typeof data !== 'object') return false;
  const row = data as { source?: string; payload?: unknown };
  return row.source === LITTLE_HERO_MESSAGE_SOURCE && Boolean(row.payload);
}

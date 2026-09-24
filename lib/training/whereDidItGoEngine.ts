/**
 * منطق وسيلة «أين اختفت؟» — visual memory — بلا واجهة.
 *
 * تفاعل: observe → hide → choose location (≠ matching).
 * Assistance يُقاس من بداية مرحلة الاختيار فقط — لا من observe/hide.
 *
 * ## Difficulty → memory level (activity-specific)
 * Generic `difficulty` (1–3) resolves to internal `memoryLevel` (1–6).
 * Optional `content.memoryLevel` overrides for explicit admin tuning only — not a second generic field.
 *
 * ## responseTimeMs semantics
 * Total trial duration: observe (display) + hide + choose elapsed.
 * NOT pure recall/decision latency — use `chooseElapsedMs` for choose-phase timing.
 */

import type { ResolvedMediaConfig } from '@/lib/training/engine/types';
import type { MatchVisualItem } from '@/lib/training/matchMeEngine';
import type { TrainingDifficulty, TrainingPromptLevel } from '@/lib/training/types';
import {
  resolveAssistanceStage,
  resolveTrialPromptLevel,
  type TrainingAssistanceSchedule,
  type TrainingAssistanceStage,
} from '@/lib/training/assistanceSemantics';

export type WhereDidItGoLocation = {
  id: string;
  labelAr: string;
  x: number;
  y: number;
};

export type WhereDidItGoLocationChoice = {
  id: string;
  location: WhereDidItGoLocation;
  isCorrect: boolean;
};

export type WhereDidItGoTrialSpec = {
  trialNumber: number;
  memoryLevel: number;
  target: MatchVisualItem;
  correctLocationId: string;
  /** موقع العرض أثناء observe */
  observeLocation: WhereDidItGoLocation;
  locations: WhereDidItGoLocationChoice[];
  displayDurationMs: number;
  hideDurationMs: number;
  chooseWindowMs: number;
  hideAnimation: 'fade' | 'instant';
};

export type WhereDidItGoRuntimeSettings = {
  trialCount: number;
  difficulty: TrainingDifficulty;
  memoryLevel: number;
  locationCount: number;
  prompting: boolean;
  reinforcement: boolean;
  displayDurationMs: number;
  hideDurationMs: number;
  chooseWindowMs: number;
  hideAnimation: 'fade' | 'instant';
  itemPool: string;
};

export type WhereDidItGoTrialOutcome = {
  correct: boolean;
  promptLevel: TrainingPromptLevel;
  responseTimeMs: number;
};

export type WhereDidItGoTrialPhase =
  | 'observe'
  | 'hide'
  | 'choose'
  | 'feedback';

/** عدد المواقع لكل مستوى ذاكرة 1–6 */
export const MEMORY_LEVEL_LOCATION_COUNT: Record<number, number> = {
  1: 2,
  2: 3,
  3: 3,
  4: 4,
  5: 4,
  6: 4,
};

const DEFAULT_CHOOSE_WINDOW_MS = 8000;
const DEFAULT_ITEM_POOL = 'basic_shapes';

/** تصعيد المساعدة — يبدأ من مرحلة choose فقط */
export const WHERE_DID_IT_GO_ASSISTANCE_SCHEDULE: TrainingAssistanceSchedule = {
  visualHintMs: 2800,
  reducedChoicesMs: 4500,
  directVisualMs: 6500,
};

const DISTINCT_LOCATIONS: WhereDidItGoLocation[] = [
  { id: 'far-left', labelAr: 'يسار', x: 22, y: 50 },
  { id: 'far-right', labelAr: 'يمين', x: 78, y: 50 },
];

const EXTENDED_LOCATIONS: WhereDidItGoLocation[] = [
  ...DISTINCT_LOCATIONS,
  { id: 'high-center', labelAr: 'أعلى', x: 50, y: 24 },
];

const FULL_LOCATIONS: WhereDidItGoLocation[] = [
  ...EXTENDED_LOCATIONS,
  { id: 'low-center', labelAr: 'أسفل', x: 50, y: 76 },
];

/** مواقع أقرب — لمستويات 4+ */
const SIMILAR_LOCATIONS: WhereDidItGoLocation[] = [
  { id: 'mid-left', labelAr: 'يسار', x: 34, y: 46 },
  { id: 'mid-right', labelAr: 'يمين', x: 66, y: 46 },
  { id: 'mid-top', labelAr: 'أعلى', x: 50, y: 36 },
  { id: 'mid-bottom', labelAr: 'أسفل', x: 50, y: 56 },
];

const TARGET_POOL: MatchVisualItem[] = [
  { id: 'mem-circle-teal', shape: 'circle', color: '#2E7D8E', size: 'lg', style: 'filled' },
  { id: 'mem-square-coral', shape: 'square', color: '#C94C4C', size: 'lg', style: 'filled' },
  { id: 'mem-triangle-gold', shape: 'triangle', color: '#E08A3C', size: 'lg', style: 'filled' },
  { id: 'mem-diamond-indigo', shape: 'diamond', color: '#4B5EB8', size: 'lg', style: 'filled' },
  { id: 'mem-circle-sage', shape: 'circle', color: '#3A9B6E', size: 'lg', style: 'filled' },
  { id: 'mem-square-plum', shape: 'square', color: '#7B5EA7', size: 'lg', style: 'filled' },
];

const LEVEL_DISPLAY_MS: Record<number, number> = {
  1: 2400,
  2: 2200,
  3: 2000,
  4: 2000,
  5: 1800,
  6: 1800,
};

const LEVEL_HIDE_MS: Record<number, number> = {
  1: 1100,
  2: 1400,
  3: 1700,
  4: 1900,
  5: 2200,
  6: 2400,
};

function clampMemoryLevel(level: number): number {
  return Math.min(6, Math.max(1, Math.floor(level)));
}

function seededIndex(seed: number, max: number): number {
  if (max <= 0) return 0;
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return Math.floor((x - Math.floor(x)) * max);
}

function resolveLocationCount(config: ResolvedMediaConfig, memoryLevel: number): number {
  if (typeof config.choices === 'number' && config.choices >= 2) {
    return Math.floor(config.choices);
  }
  return MEMORY_LEVEL_LOCATION_COUNT[memoryLevel] ?? 2;
}

/** تحويل صريح من مستوى التدريب العام إلى مستوى الذاكرة الداخلي */
export function memoryLevelFromDifficulty(
  difficulty: TrainingDifficulty
): number {
  if (difficulty === 1) return 1;
  if (difficulty === 2) return 3;
  return 4;
}

/**
 * يحلّ مستوى الذاكرة الداخلي من `difficulty` العام.
 * `content.memoryLevel` اختياري لتجاوز صريح فقط — لا يُستخدم `matchLevel` (خاص بـ match-me).
 */
export function resolveMemoryLevel(config: ResolvedMediaConfig): number {
  const fromContent = config.content?.memoryLevel;
  if (typeof fromContent === 'number') {
    return clampMemoryLevel(fromContent);
  }
  return clampMemoryLevel(memoryLevelFromDifficulty(config.difficulty));
}

function locationPoolForLevel(memoryLevel: number): WhereDidItGoLocation[] {
  if (memoryLevel >= 6) return FULL_LOCATIONS;
  if (memoryLevel >= 5) return FULL_LOCATIONS;
  if (memoryLevel >= 4) return SIMILAR_LOCATIONS.slice(0, 4);
  if (memoryLevel >= 3) return EXTENDED_LOCATIONS;
  if (memoryLevel >= 2) return EXTENDED_LOCATIONS.slice(0, 3);
  return DISTINCT_LOCATIONS;
}

/** توقيت observe/hide يُشتق من memoryLevel فقط — JSON العام لا يتجاوز تصعيد الصعوبة */
function resolveDisplayMs(memoryLevel: number): number {
  return LEVEL_DISPLAY_MS[memoryLevel] ?? 2000;
}

function resolveHideMs(memoryLevel: number): number {
  return LEVEL_HIDE_MS[memoryLevel] ?? 1500;
}

export function resolveWhereDidItGoRuntimeSettings(
  config: ResolvedMediaConfig
): WhereDidItGoRuntimeSettings {
  const memoryLevel = resolveMemoryLevel(config);
  const itemPool =
    typeof config.content?.itemPool === 'string'
      ? config.content.itemPool
      : DEFAULT_ITEM_POOL;
  const hideAnimation =
    config.content?.hideAnimation === 'instant' ? 'instant' : 'fade';

  return {
    trialCount: config.trialCount,
    difficulty: config.difficulty,
    memoryLevel,
    locationCount: resolveLocationCount(config, memoryLevel),
    prompting: config.prompting,
    reinforcement: config.reinforcement,
    displayDurationMs: resolveDisplayMs(memoryLevel),
    hideDurationMs: resolveHideMs(memoryLevel),
    chooseWindowMs: config.responseWindowMs ?? DEFAULT_CHOOSE_WINDOW_MS,
    hideAnimation,
    itemPool,
  };
}

/** يثبّت محتوى المحاولة على المستوى المفتوح فقط. */
export function whereDidItGoSettingsForLevel(
  settings: WhereDidItGoRuntimeSettings,
  level: number
): WhereDidItGoRuntimeSettings {
  const memoryLevel = clampMemoryLevel(level);
  return {
    ...settings,
    memoryLevel,
    locationCount: MEMORY_LEVEL_LOCATION_COUNT[memoryLevel] ?? 2,
    displayDurationMs: resolveDisplayMs(memoryLevel),
    hideDurationMs: resolveHideMs(memoryLevel),
  };
}

function pickTarget(trialNumber: number, memoryLevel: number): MatchVisualItem {
  const base = TARGET_POOL[seededIndex(trialNumber * 11, TARGET_POOL.length)];

  if (memoryLevel >= 6) {
    return {
      ...base,
      id: `${base.id}-gen-${trialNumber}`,
      style: trialNumber % 2 === 0 ? 'outline' : 'filled',
      theme: 'generalized',
    };
  }

  if (memoryLevel >= 5) {
    return { ...base, id: `${base.id}-ctx-${trialNumber}`, theme: 'context_shift' };
  }

  return { ...base, id: `${base.id}-t${trialNumber}` };
}

/** يبني مواصفات محاولة — deterministic */
export function buildWhereDidItGoTrialSpec(
  settings: WhereDidItGoRuntimeSettings,
  trialNumber: number
): WhereDidItGoTrialSpec {
  const pool = locationPoolForLevel(settings.memoryLevel);
  const count = Math.min(settings.locationCount, pool.length);
  const shuffledPool = [...pool].sort(
    (a, b) =>
      seededIndex(trialNumber * 19 + a.id.length, 100) -
      seededIndex(trialNumber * 19 + b.id.length, 100)
  );
  const selectedLocations = shuffledPool.slice(0, count);
  const correctIndex = seededIndex(trialNumber * 13, selectedLocations.length);
  const correctLocation = selectedLocations[correctIndex];

  const locations: WhereDidItGoLocationChoice[] = selectedLocations.map(
    (location, index) => ({
      id: `loc-choice-${trialNumber}-${index}`,
      location,
      isCorrect: location.id === correctLocation.id,
    })
  );

  const orderedLocations = [...locations].sort(
    (a, b) =>
      seededIndex(trialNumber * 29 + a.id.length, 100) -
      seededIndex(trialNumber * 29 + b.id.length, 100)
  );

  return {
    trialNumber,
    memoryLevel: settings.memoryLevel,
    target: pickTarget(trialNumber, settings.memoryLevel),
    correctLocationId: correctLocation.id,
    observeLocation: correctLocation,
    locations: orderedLocations,
    displayDurationMs: settings.displayDurationMs,
    hideDurationMs: settings.hideDurationMs,
    chooseWindowMs: settings.chooseWindowMs,
    hideAnimation: settings.hideAnimation,
  };
}

export function getWhereDidItGoDisplayedLocations(
  spec: WhereDidItGoTrialSpec,
  assistanceStage: TrainingAssistanceStage
): WhereDidItGoLocationChoice[] {
  const all = spec.locations;
  if (assistanceStage === 'none' || assistanceStage === 'visual_hint') {
    return all;
  }

  const correct = all.find((choice) => choice.isCorrect);
  if (!correct) return all;

  const distractors = all.filter((choice) => !choice.isCorrect);

  if (assistanceStage === 'reduced_choices') {
    const keep = Math.max(2, all.length - 1);
    const reduced = [correct, ...distractors.slice(0, keep - 1)];
    return reduced.sort(
      (a, b) =>
        seededIndex(spec.trialNumber * 31 + a.id.length, 100) -
        seededIndex(spec.trialNumber * 31 + b.id.length, 100)
    );
  }

  if (assistanceStage === 'direct_visual_assistance') {
    const hardest = distractors[0];
    const pair = hardest ? [correct, hardest] : [correct];
    return pair.sort(
      (a, b) =>
        seededIndex(spec.trialNumber * 37 + a.id.length, 100) -
        seededIndex(spec.trialNumber * 37 + b.id.length, 100)
    );
  }

  return all;
}

export function resolveWhereDidItGoAssistanceStage(
  chooseElapsedMs: number,
  promptingEnabled: boolean
): TrainingAssistanceStage {
  return resolveAssistanceStage(
    chooseElapsedMs,
    WHERE_DID_IT_GO_ASSISTANCE_SCHEDULE,
    promptingEnabled
  );
}

export function isWhereDidItGoSelectionCorrect(
  locationChoiceId: string,
  spec: WhereDidItGoTrialSpec
): boolean {
  const choice = spec.locations.find((item) => item.id === locationChoiceId);
  return choice?.isCorrect === true;
}

/**
 * `responseTimeMs` = display + hide + chooseElapsedMs (total trial duration).
 * Assistance/prompting uses chooseElapsedMs only.
 */
export function resolveWhereDidItGoTrialOutcome(input: {
  promptingEnabled: boolean;
  selected: boolean;
  locationChoiceId?: string;
  spec: WhereDidItGoTrialSpec;
  /** elapsed from start of choose phase — not persisted on TrainingTrial */
  chooseElapsedMs: number;
}): WhereDidItGoTrialOutcome {
  const correct =
    input.selected && input.locationChoiceId
      ? isWhereDidItGoSelectionCorrect(input.locationChoiceId, input.spec)
      : false;

  const promptLevel = resolveTrialPromptLevel({
    responded: input.selected,
    promptingEnabled: input.promptingEnabled,
    elapsedMs: input.chooseElapsedMs,
    schedule: WHERE_DID_IT_GO_ASSISTANCE_SCHEDULE,
  });

  const totalTrialElapsedMs = Math.max(
    0,
    Math.round(
      input.spec.displayDurationMs +
        input.spec.hideDurationMs +
        input.chooseElapsedMs
    )
  );
  const responseTimeMs = totalTrialElapsedMs;

  return { correct, promptLevel, responseTimeMs };
}

export function shouldPulseWhereDidItGoScene(
  assistanceStage: TrainingAssistanceStage
): boolean {
  return assistanceStage === 'visual_hint';
}

export function shouldHighlightWhereDidItGoCorrectLocation(
  assistanceStage: TrainingAssistanceStage,
  feedbackPhase: boolean
): boolean {
  return feedbackPhase || assistanceStage === 'direct_visual_assistance';
}

export function getWhereDidItGoLocationById(
  spec: WhereDidItGoTrialSpec,
  locationId: string
): WhereDidItGoLocation | undefined {
  return spec.locations.find((choice) => choice.location.id === locationId)?.location;
}

/**
 * منطق وسيلة «طابق مثلي» — matching / visual discrimination — بلا واجهة.
 *
 * Assistance Stage (داخلي): none → visual_hint → reduced_choices → direct_visual_assistance
 * TrainingPromptLevel (Trial): يُشتق من المساعدة الفعلية — لا من latency وحده.
 *
 * ## responseTimeMs semantics
 * Choose/decision latency from trial presentation — no preceding observe phase.
 * `elapsedMs` / choose-phase timing only; NOT comparable to follow-star total-task duration.
 */

import type { ResolvedMediaConfig } from '@/lib/training/engine/types';
import type { TrainingDifficulty, TrainingPromptLevel } from '@/lib/training/types';
import {
  resolveAssistanceDelivered,
  resolveAssistanceStage,
  resolveTrialPromptLevel,
  type TrainingAssistanceSchedule,
  type TrainingAssistanceStage,
} from '@/lib/training/assistanceSemantics';

export type MatchVisualShape = 'circle' | 'square' | 'triangle' | 'diamond';
export type MatchVisualSize = 'sm' | 'md' | 'lg';
export type MatchVisualStyle = 'filled' | 'outline';

/** عنصر بصري — يُعرض عبر SVG/CSS وليس emoji */
export type MatchVisualItem = {
  id: string;
  shape: MatchVisualShape;
  color: string;
  size: MatchVisualSize;
  style: MatchVisualStyle;
  /** سياق بصري — لمستوى 5+ (generalization) */
  theme?: string;
};

export type MatchMeChoice = {
  id: string;
  item: MatchVisualItem;
  isCorrect: boolean;
};

export type MatchMeTrialSpec = {
  trialNumber: number;
  matchLevel: number;
  target: MatchVisualItem;
  /** كل الخيارات قبل تطبيق prompting */
  choices: MatchMeChoice[];
  responseWindowMs: number;
};

export type MatchMeRuntimeSettings = {
  trialCount: number;
  difficulty: TrainingDifficulty;
  matchLevel: number;
  choiceCount: number;
  prompting: boolean;
  reinforcement: boolean;
  responseWindowMs: number;
  itemPool: string;
};

export type MatchMeTrialOutcome = {
  correct: boolean;
  promptLevel: TrainingPromptLevel;
  responseTimeMs: number;
};

/** عدد الخيارات الافتراضي لكل مستوى مطابقة 1–6 */
export const MATCH_LEVEL_CHOICE_COUNT: Record<number, number> = {
  1: 2,
  2: 3,
  3: 3,
  4: 4,
  5: 3,
  6: 4,
};

const DEFAULT_RESPONSE_WINDOW_MS = 8000;
const DEFAULT_ITEM_POOL = 'basic_shapes';

/** جدول تصعيد المساعدة الرقمية — يتحكم بالـAssistance Stage فقط */
export const MATCH_ME_ASSISTANCE_SCHEDULE: TrainingAssistanceSchedule = {
  visualHintMs: 2500,
  reducedChoicesMs: 4000,
  directVisualMs: 7000,
};

/** مجموعة أشكال أساسية — قابلة للتوسع عبر content.itemPool */
const BASIC_SHAPE_ITEMS: MatchVisualItem[] = [
  { id: 'circle-red', shape: 'circle', color: '#C94C4C', size: 'md', style: 'filled' },
  { id: 'circle-blue', shape: 'circle', color: '#3D7DD6', size: 'md', style: 'filled' },
  { id: 'square-red', shape: 'square', color: '#C94C4C', size: 'md', style: 'filled' },
  { id: 'square-blue', shape: 'square', color: '#3D7DD6', size: 'md', style: 'filled' },
  { id: 'triangle-green', shape: 'triangle', color: '#3A9B6E', size: 'md', style: 'filled' },
  { id: 'diamond-purple', shape: 'diamond', color: '#7B5EA7', size: 'md', style: 'filled' },
  { id: 'circle-orange', shape: 'circle', color: '#E08A3C', size: 'md', style: 'filled' },
  { id: 'square-green', shape: 'square', color: '#3A9B6E', size: 'md', style: 'filled' },
  { id: 'triangle-blue', shape: 'triangle', color: '#3D7DD6', size: 'md', style: 'filled' },
  { id: 'diamond-teal', shape: 'diamond', color: '#2E7D8E', size: 'md', style: 'filled' },
];

/** مشتتات أقرب تشابهاً — للمستويات 3–4 */
const SIMILAR_PAIRS: Array<[string, string]> = [
  ['circle-red', 'circle-orange'],
  ['circle-blue', 'triangle-blue'],
  ['square-red', 'square-green'],
  ['square-blue', 'diamond-teal'],
  ['diamond-purple', 'diamond-teal'],
];

function clampMatchLevel(level: number): number {
  return Math.min(6, Math.max(1, Math.floor(level)));
}

function seededIndex(seed: number, max: number): number {
  if (max <= 0) return 0;
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return Math.floor((x - Math.floor(x)) * max);
}

function cloneItem(item: MatchVisualItem, overrides?: Partial<MatchVisualItem>): MatchVisualItem {
  return { ...item, ...overrides, id: overrides?.id ?? item.id };
}

function getItemPool(poolId: string): MatchVisualItem[] {
  if (poolId === 'basic_shapes') return BASIC_SHAPE_ITEMS;
  return BASIC_SHAPE_ITEMS;
}

function itemSimilarity(a: MatchVisualItem, b: MatchVisualItem): number {
  let score = 0;
  if (a.shape === b.shape) score += 3;
  if (a.color === b.color) score += 3;
  if (a.size === b.size) score += 1;
  if (a.style === b.style) score += 1;
  if (a.theme === b.theme) score += 1;
  return score;
}

function resolveChoiceCount(config: ResolvedMediaConfig, matchLevel: number): number {
  if (typeof config.choices === 'number' && config.choices >= 2) {
    return Math.floor(config.choices);
  }
  return MATCH_LEVEL_CHOICE_COUNT[matchLevel] ?? 2;
}

export function resolveMatchLevel(config: ResolvedMediaConfig): number {
  if (typeof config.matchLevel === 'number') {
    return clampMatchLevel(config.matchLevel);
  }
  if (config.difficulty === 1) return 1;
  if (config.difficulty === 2) return 3;
  return 4;
}

export function resolveMatchMeRuntimeSettings(
  config: ResolvedMediaConfig
): MatchMeRuntimeSettings {
  const matchLevel = resolveMatchLevel(config);
  const itemPool =
    typeof config.content?.itemPool === 'string'
      ? config.content.itemPool
      : typeof config.content?.category === 'string'
        ? config.content.category
        : DEFAULT_ITEM_POOL;

  return {
    trialCount: config.trialCount,
    difficulty: config.difficulty,
    matchLevel,
    choiceCount: resolveChoiceCount(config, matchLevel),
    prompting: config.prompting,
    reinforcement: config.reinforcement,
    responseWindowMs: config.responseWindowMs ?? DEFAULT_RESPONSE_WINDOW_MS,
    itemPool,
  };
}

export function matchMeSettingsForLevel(
  settings: MatchMeRuntimeSettings,
  level: number
): MatchMeRuntimeSettings {
  const matchLevel = clampMatchLevel(level);
  return {
    ...settings,
    matchLevel,
    choiceCount: MATCH_LEVEL_CHOICE_COUNT[matchLevel] ?? 2,
  };
}

function pickTarget(pool: MatchVisualItem[], trialNumber: number, matchLevel: number): MatchVisualItem {
  const base = pool[seededIndex(trialNumber * 7, pool.length)];

  if (matchLevel >= 5) {
    const theme = matchLevel >= 6 ? 'generalized' : 'context_shift';
    return cloneItem(base, {
      style: trialNumber % 2 === 0 ? 'outline' : 'filled',
      theme,
      id: `${base.id}-${theme}`,
    });
  }

  return cloneItem(base);
}

function findSimilarItem(
  pool: MatchVisualItem[],
  target: MatchVisualItem,
  excludeIds: Set<string>,
  trialNumber: number
): MatchVisualItem | null {
  const pair = SIMILAR_PAIRS.find(
    ([a, b]) =>
      (target.id.startsWith(a) || target.id.startsWith(b)) &&
      !excludeIds.has(a) &&
      !excludeIds.has(b)
  );

  if (pair) {
    const otherId = target.id.startsWith(pair[0]) ? pair[1] : pair[0];
    const found = pool.find((item) => item.id === otherId);
    if (found && !excludeIds.has(found.id)) {
      return cloneItem(found, { id: `${found.id}-d${trialNumber}` });
    }
  }

  const candidates = pool
    .filter((item) => !excludeIds.has(item.id))
    .map((item) => ({ item, score: itemSimilarity(item, target) }))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.item ?? null;
}

function pickDistinctDistractor(
  pool: MatchVisualItem[],
  target: MatchVisualItem,
  excludeIds: Set<string>,
  trialNumber: number,
  preferSimilar: boolean
): MatchVisualItem {
  if (preferSimilar) {
    const similar = findSimilarItem(pool, target, excludeIds, trialNumber);
    if (similar) return similar;
  }

  const sorted = [...pool]
    .filter((item) => !excludeIds.has(item.id))
    .sort(
      (a, b) =>
        itemSimilarity(a, target) - itemSimilarity(b, target) ||
        seededIndex(trialNumber + a.id.length, 100) -
          seededIndex(trialNumber + b.id.length, 100)
    );

  const picked = sorted[0] ?? pool[0];
  return cloneItem(picked, { id: `${picked.id}-d${trialNumber}-${excludeIds.size}` });
}

/** يبني مواصفات محاولة واحدة — deterministic حسب trialNumber */
export function buildMatchMeTrialSpec(
  settings: MatchMeRuntimeSettings,
  trialNumber: number
): MatchMeTrialSpec {
  const pool = getItemPool(settings.itemPool);
  const matchLevel = settings.matchLevel;
  const choiceCount = settings.choiceCount;
  const target = pickTarget(pool, trialNumber, matchLevel);
  const usedIds = new Set<string>([target.id.split('-d')[0]?.split('-generalized')[0] ?? target.id]);

  const distractors: MatchVisualItem[] = [];
  const preferSimilar = matchLevel >= 3;

  while (distractors.length < choiceCount - 1) {
    const distractor = pickDistinctDistractor(
      pool,
      target,
      usedIds,
      trialNumber + distractors.length,
      preferSimilar && distractors.length > 0 ? true : matchLevel >= 2
    );
    usedIds.add(distractor.id);
    distractors.push(distractor);
  }

  const choices: MatchMeChoice[] = [
    { id: `choice-correct-${trialNumber}`, item: target, isCorrect: true },
    ...distractors.map((item, index) => ({
      id: `choice-distractor-${trialNumber}-${index}`,
      item,
      isCorrect: false,
    })),
  ];

  const shuffled = [...choices].sort(
    (a, b) =>
      seededIndex(trialNumber * 31 + a.id.charCodeAt(0), 100) -
      seededIndex(trialNumber * 31 + b.id.charCodeAt(0), 100)
  );

  return {
    trialNumber,
    matchLevel,
    target,
    choices: shuffled,
    responseWindowMs: settings.responseWindowMs,
  };
}

function sortBySimilarityToTarget(
  choices: MatchMeChoice[],
  target: MatchVisualItem
): MatchMeChoice[] {
  return [...choices].sort((a, b) => {
    if (a.isCorrect) return 1;
    if (b.isCorrect) return -1;
    return itemSimilarity(b.item, target) - itemSimilarity(a.item, target);
  });
}

/** يُرجع الخيارات المعروضة بعد تطبيق Assistance Stage */
export function getMatchMeDisplayedChoices(
  spec: MatchMeTrialSpec,
  assistanceStage: TrainingAssistanceStage
): MatchMeChoice[] {
  const all = spec.choices;
  if (
    assistanceStage === 'none' ||
    assistanceStage === 'visual_hint'
  ) {
    return all;
  }

  const correct = all.find((c) => c.isCorrect);
  if (!correct) return all;

  const distractors = sortBySimilarityToTarget(
    all.filter((c) => !c.isCorrect),
    spec.target
  );

  if (assistanceStage === 'reduced_choices') {
    const keep = Math.max(2, all.length - 1);
    const reduced = [correct, ...distractors.slice(0, keep - 1)];
    return reduced.sort(
      (a, b) =>
        seededIndex(spec.trialNumber * 17 + a.id.length, 100) -
        seededIndex(spec.trialNumber * 17 + b.id.length, 100)
    );
  }

  if (assistanceStage === 'direct_visual_assistance') {
    const hardest = distractors[0];
    const pair = hardest ? [correct, hardest] : [correct];
    return pair.sort(
      (a, b) =>
        seededIndex(spec.trialNumber * 23 + a.id.length, 100) -
        seededIndex(spec.trialNumber * 23 + b.id.length, 100)
    );
  }

  return all;
}

export function wereMatchMeChoicesReduced(
  spec: MatchMeTrialSpec,
  assistanceStage: TrainingAssistanceStage
): boolean {
  if (
    assistanceStage === 'none' ||
    assistanceStage === 'visual_hint'
  ) {
    return false;
  }
  return (
    getMatchMeDisplayedChoices(spec, assistanceStage).length < spec.choices.length
  );
}

export function isMatchMeSelectionCorrect(
  choiceId: string,
  spec: MatchMeTrialSpec
): boolean {
  const choice = spec.choices.find((c) => c.id === choiceId);
  return choice?.isCorrect === true;
}

export function resolveMatchMeAssistanceStage(
  elapsedMs: number,
  promptingEnabled: boolean
): TrainingAssistanceStage {
  return resolveAssistanceStage(
    elapsedMs,
    MATCH_ME_ASSISTANCE_SCHEDULE,
    promptingEnabled
  );
}

/** @deprecated استخدم resolveMatchMeAssistanceStage — للتوافق مع الاختبارات القديمة */
export function resolveMatchMePromptStage(
  elapsedMs: number,
  promptingEnabled: boolean
): TrainingAssistanceStage {
  return resolveMatchMeAssistanceStage(elapsedMs, promptingEnabled);
}

export function resolveMatchMeTrialOutcome(input: {
  promptingEnabled: boolean;
  selected: boolean;
  choiceId?: string;
  spec: MatchMeTrialSpec;
  /** choose/decision elapsed — maps to responseTimeMs; not persisted separately */
  elapsedMs: number;
}): MatchMeTrialOutcome {
  const correct =
    input.selected && input.choiceId
      ? isMatchMeSelectionCorrect(input.choiceId, input.spec)
      : false;

  const promptLevel = resolveTrialPromptLevel({
    responded: input.selected,
    promptingEnabled: input.promptingEnabled,
    elapsedMs: input.elapsedMs,
    schedule: MATCH_ME_ASSISTANCE_SCHEDULE,
  });

  return {
    correct,
    promptLevel,
    responseTimeMs: Math.max(0, Math.round(input.elapsedMs)),
  };
}

export function shouldHighlightMatchMeModel(
  assistanceStage: TrainingAssistanceStage
): boolean {
  return (
    assistanceStage === 'visual_hint' ||
    assistanceStage === 'reduced_choices'
  );
}

export function shouldHighlightMatchMeCorrectChoice(
  assistanceStage: TrainingAssistanceStage,
  feedbackPhase: boolean
): boolean {
  return feedbackPhase || assistanceStage === 'direct_visual_assistance';
}

export { resolveAssistanceDelivered as resolveMatchMeAssistanceDelivered };

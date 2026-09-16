/**
 * منطق وسيلة «ابحث عن الهدف» — visual search — بلا واجهة.
 *
 * ## Difficulty → search level (activity-specific)
 * Generic `difficulty` (1–3) resolves to internal `searchLevel` (1–6).
 * Optional `content.searchLevel` overrides for explicit tuning only.
 *
 * ## responseTimeMs semantics
 * Search/decision latency from start of SEARCH phase only.
 * Target-preview duration is excluded (`targetPreviewElapsedMs` internal only).
 * NOT comparable to follow-star total-task or where-did-it-go observe+hide+choose.
 *
 * ## Assistance
 * Measured from search phase only — latency alone is NOT a prompt.
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

export type FindTheTargetRegion =
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se'
  | 'center'
  | 'north'
  | 'south'
  | 'east'
  | 'west';

export type FindTheTargetFieldItem = {
  id: string;
  item: MatchVisualItem;
  isTarget: boolean;
  x: number;
  y: number;
  region: FindTheTargetRegion;
};

export type FindTheTargetTrialSpec = {
  trialNumber: number;
  searchLevel: number;
  target: MatchVisualItem;
  targetItemId: string;
  targetPreviewMs: number;
  fieldItems: FindTheTargetFieldItem[];
  searchWindowMs: number;
  itemSizePx: number;
};

export type FindTheTargetRuntimeSettings = {
  trialCount: number;
  difficulty: TrainingDifficulty;
  searchLevel: number;
  /** typical count — actual per-trial may vary at levels 4–6 */
  itemCount: number;
  choicesOverride?: number;
  prompting: boolean;
  reinforcement: boolean;
  targetPreviewMs: number;
  searchWindowMs: number;
  itemPool: string;
};

export type FindTheTargetTrialOutcome = {
  correct: boolean;
  promptLevel: TrainingPromptLevel;
  responseTimeMs: number;
};

export type FindTheTargetTrialPhase = 'target' | 'search' | 'feedback';

/** عدد عناصر الحقل لكل مستوى بحث 1–6 */
export const SEARCH_LEVEL_ITEM_COUNT: Record<number, number> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 7,
  6: 8,
};

/** للمستوى 4 — يمكن 5 أو 6 عناصر */
export const SEARCH_LEVEL_ITEM_COUNT_RANGE: Record<
  number,
  { min: number; max: number }
> = {
  4: { min: 5, max: 6 },
  5: { min: 6, max: 8 },
  6: { min: 6, max: 8 },
};

const DEFAULT_SEARCH_WINDOW_MS = 10000;
const DEFAULT_ITEM_POOL = 'basic_shapes';

export const FIND_THE_TARGET_ASSISTANCE_SCHEDULE: TrainingAssistanceSchedule = {
  visualHintMs: 3000,
  reducedChoicesMs: 5000,
  directVisualMs: 7500,
};

const LEVEL_TARGET_PREVIEW_MS: Record<number, number> = {
  1: 2400,
  2: 2200,
  3: 2000,
  4: 1800,
  5: 1600,
  6: 1500,
};

const LEVEL_ITEM_SIZE_PX: Record<number, number> = {
  1: 112,
  2: 104,
  3: 92,
  4: 84,
  5: 76,
  6: 72,
};

const POSITION_SLOTS: Array<{ x: number; y: number; region: FindTheTargetRegion }> = [
  { x: 22, y: 28, region: 'nw' },
  { x: 78, y: 26, region: 'ne' },
  { x: 24, y: 72, region: 'sw' },
  { x: 76, y: 74, region: 'se' },
  { x: 50, y: 48, region: 'center' },
  { x: 50, y: 22, region: 'north' },
  { x: 50, y: 78, region: 'south' },
  { x: 14, y: 50, region: 'west' },
  { x: 86, y: 50, region: 'east' },
];

const BASIC_POOL: MatchVisualItem[] = [
  { id: 'search-circle-teal', shape: 'circle', color: '#2E7D8E', size: 'md', style: 'filled' },
  { id: 'search-square-coral', shape: 'square', color: '#C94C4C', size: 'md', style: 'filled' },
  { id: 'search-triangle-gold', shape: 'triangle', color: '#E08A3C', size: 'md', style: 'filled' },
  { id: 'search-diamond-indigo', shape: 'diamond', color: '#4B5EB8', size: 'md', style: 'filled' },
  { id: 'search-circle-sage', shape: 'circle', color: '#3A9B6E', size: 'md', style: 'filled' },
  { id: 'search-square-plum', shape: 'square', color: '#7B5EA7', size: 'md', style: 'filled' },
  { id: 'search-triangle-blue', shape: 'triangle', color: '#3D7DD6', size: 'md', style: 'filled' },
  { id: 'search-diamond-orange', shape: 'diamond', color: '#E08A3C', size: 'md', style: 'filled' },
];

/** مشتتات مشابهة — للمستويات 3+ */
const SIMILAR_DISTRACTOR_PAIRS: Array<[string, string]> = [
  ['search-circle-teal', 'search-circle-sage'],
  ['search-square-coral', 'search-square-plum'],
  ['search-triangle-gold', 'search-triangle-blue'],
  ['search-diamond-indigo', 'search-diamond-orange'],
];

function clampSearchLevel(level: number): number {
  return Math.min(6, Math.max(1, Math.floor(level)));
}

function seededIndex(seed: number, max: number): number {
  if (max <= 0) return 0;
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return Math.floor((x - Math.floor(x)) * max);
}

function cloneItem(
  item: MatchVisualItem,
  overrides?: Partial<MatchVisualItem>
): MatchVisualItem {
  return { ...item, ...overrides, id: overrides?.id ?? item.id };
}

function getItemPool(poolId: string): MatchVisualItem[] {
  if (poolId === 'basic_shapes') return BASIC_POOL;
  return BASIC_POOL;
}

function itemDissimilarity(a: MatchVisualItem, b: MatchVisualItem): number {
  let score = 0;
  if (a.shape !== b.shape) score += 4;
  if (a.color !== b.color) score += 4;
  if (a.size !== b.size) score += 1;
  if (a.style !== b.style) score += 1;
  return score;
}

function itemSimilarity(a: MatchVisualItem, b: MatchVisualItem): number {
  let score = 0;
  if (a.shape === b.shape) score += 3;
  if (a.color === b.color) score += 3;
  if (a.size === b.size) score += 1;
  if (a.style === b.style) score += 1;
  return score;
}

export function searchLevelFromDifficulty(
  difficulty: TrainingDifficulty
): number {
  if (difficulty === 1) return 1;
  if (difficulty === 2) return 3;
  return 4;
}

export function resolveSearchLevel(config: ResolvedMediaConfig): number {
  const fromContent = config.content?.searchLevel;
  if (typeof fromContent === 'number') {
    return clampSearchLevel(fromContent);
  }
  return clampSearchLevel(searchLevelFromDifficulty(config.difficulty));
}

function resolveItemCount(
  searchLevel: number,
  trialNumber: number,
  fieldSeed: number,
  choicesOverride?: number
): number {
  if (typeof choicesOverride === 'number' && choicesOverride >= 2) {
    return Math.floor(choicesOverride);
  }

  const range = SEARCH_LEVEL_ITEM_COUNT_RANGE[searchLevel];
  if (range) {
    const span = range.max - range.min + 1;
    return range.min + seededIndex(trialNumber * 41 + fieldSeed, span);
  }

  return SEARCH_LEVEL_ITEM_COUNT[searchLevel] ?? 2;
}

function resolveTargetPreviewMs(searchLevel: number): number {
  return LEVEL_TARGET_PREVIEW_MS[searchLevel] ?? 2000;
}

function resolveItemSizePx(searchLevel: number): number {
  return LEVEL_ITEM_SIZE_PX[searchLevel] ?? 88;
}

export function resolveFindTheTargetRuntimeSettings(
  config: ResolvedMediaConfig
): FindTheTargetRuntimeSettings {
  const searchLevel = resolveSearchLevel(config);
  const itemPool =
    typeof config.content?.itemPool === 'string'
      ? config.content.itemPool
      : DEFAULT_ITEM_POOL;

  return {
    trialCount: config.trialCount,
    difficulty: config.difficulty,
    searchLevel,
    itemCount: SEARCH_LEVEL_ITEM_COUNT[searchLevel] ?? 2,
    choicesOverride:
      typeof config.choices === 'number' ? Math.floor(config.choices) : undefined,
    prompting: config.prompting,
    reinforcement: config.reinforcement,
    targetPreviewMs: resolveTargetPreviewMs(searchLevel),
    searchWindowMs: config.responseWindowMs ?? DEFAULT_SEARCH_WINDOW_MS,
    itemPool,
  };
}

export function deriveFindTheTargetFieldSeed(sessionId: string): number {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i += 1) {
    hash = (hash * 37 + sessionId.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

/** يمنع تكرار موقع الهدف في محاولتين متتاليتين */
export function resolveTargetSlotIndex(
  itemCount: number,
  trialNumber: number,
  fieldSeed: number
): number {
  const count = Math.max(1, itemCount);
  let slot = seededIndex(trialNumber * 13 + fieldSeed * 7, count);

  if (trialNumber > 1 && count > 1) {
    const previous = seededIndex((trialNumber - 1) * 13 + fieldSeed * 7, count);
    if (slot === previous) {
      slot = (slot + 1) % count;
    }
  }

  return slot;
}

function pickTarget(
  pool: MatchVisualItem[],
  trialNumber: number,
  searchLevel: number,
  fieldSeed: number
): MatchVisualItem {
  const base = pool[seededIndex(trialNumber * 11 + fieldSeed, pool.length)];

  if (searchLevel >= 6) {
    return cloneItem(base, {
      id: `${base.id}-gen-${trialNumber}`,
      style: trialNumber % 2 === 0 ? 'outline' : 'filled',
      theme: 'generalized',
      size: 'sm',
    });
  }

  if (searchLevel >= 5) {
    return cloneItem(base, {
      id: `${base.id}-ctx-${trialNumber}`,
      theme: 'context_shift',
      size: 'sm',
    });
  }

  const size =
    searchLevel <= 1 ? 'lg' : searchLevel <= 2 ? 'lg' : searchLevel <= 3 ? 'md' : 'md';

  return cloneItem(base, {
    id: `${base.id}-t${trialNumber}`,
    size,
  });
}

function findSimilarDistractor(
  pool: MatchVisualItem[],
  target: MatchVisualItem,
  excludeIds: Set<string>,
  trialNumber: number,
  index: number,
  searchLevel: number
): MatchVisualItem {
  for (const [aId, bId] of SIMILAR_DISTRACTOR_PAIRS) {
    if (target.id.startsWith(aId) || target.id.includes(aId)) {
      const similar = pool.find((item) => item.id === bId);
      if (similar && !excludeIds.has(similar.id)) {
        return cloneItem(similar, {
          id: `${similar.id}-d${trialNumber}-${index}`,
          size: target.size,
        });
      }
    }
    if (target.id.startsWith(bId) || target.id.includes(bId)) {
      const similar = pool.find((item) => item.id === aId);
      if (similar && !excludeIds.has(similar.id)) {
        return cloneItem(similar, {
          id: `${similar.id}-d${trialNumber}-${index}`,
          size: target.size,
        });
      }
    }
  }

  const candidates = pool
    .filter((item) => !excludeIds.has(item.id))
    .sort(
      (a, b) =>
        itemSimilarity(b, target) - itemSimilarity(a, target) ||
        seededIndex(trialNumber * 19 + a.id.length + index, 100) -
          seededIndex(trialNumber * 19 + b.id.length + index, 100)
    );

  const picked = candidates[0] ?? pool[0];
  const sameShape = searchLevel >= 4 && index % 2 === 0;
  return cloneItem(picked, {
    id: `${picked.id}-sim-${trialNumber}-${index}`,
    size: target.size,
    shape: sameShape ? target.shape : picked.shape,
    color:
      target.color === picked.color
        ? pool.find((p) => p.color !== target.color)?.color ?? picked.color
        : picked.color,
  });
}

function pickDistinctDistractor(
  pool: MatchVisualItem[],
  target: MatchVisualItem,
  excludeIds: Set<string>,
  trialNumber: number,
  index: number
): MatchVisualItem {
  const candidates = pool
    .filter((item) => !excludeIds.has(item.id))
    .sort(
      (a, b) =>
        itemDissimilarity(b, target) - itemDissimilarity(a, target) ||
        seededIndex(trialNumber * 23 + a.id.length + index, 100) -
          seededIndex(trialNumber * 23 + b.id.length + index, 100)
    );

  const picked = candidates[0] ?? pool[(index + 1) % pool.length];
  return cloneItem(picked, {
    id: `${picked.id}-dist-${trialNumber}-${index}`,
    size: target.size,
  });
}

function buildDistractors(
  pool: MatchVisualItem[],
  target: MatchVisualItem,
  count: number,
  searchLevel: number,
  trialNumber: number
): MatchVisualItem[] {
  const distractors: MatchVisualItem[] = [];
  const usedIds = new Set<string>([target.id.split('-t')[0], target.id]);

  for (let i = 0; i < count; i += 1) {
    const preferSimilar =
      searchLevel >= 4 ||
      (searchLevel >= 3 && i >= 1);

    const distractor = preferSimilar
      ? findSimilarDistractor(pool, target, usedIds, trialNumber, i, searchLevel)
      : pickDistinctDistractor(pool, target, usedIds, trialNumber, i);

    usedIds.add(distractor.id);
    distractors.push(distractor);
  }

  return distractors;
}

function assignFieldPositions(
  items: MatchVisualItem[],
  targetIndex: number,
  trialNumber: number,
  fieldSeed: number
): FindTheTargetFieldItem[] {
  const shuffledSlots = [...POSITION_SLOTS].sort(
    (a, b) =>
      seededIndex(trialNumber * 29 + fieldSeed + a.x, 100) -
      seededIndex(trialNumber * 29 + fieldSeed + b.x, 100)
  );
  const slots = shuffledSlots.slice(0, items.length);

  return items.map((item, index) => ({
    id: `field-${trialNumber}-${index}`,
    item,
    isTarget: index === targetIndex,
    x: slots[index].x,
    y: slots[index].y,
    region: slots[index].region,
  }));
}

/** يبني محاولة بحث — deterministic مع تباين عبر fieldSeed */
export function buildFindTheTargetTrialSpec(
  settings: FindTheTargetRuntimeSettings,
  trialNumber: number,
  fieldSeed = 1
): FindTheTargetTrialSpec {
  const pool = getItemPool(settings.itemPool);
  const searchLevel = settings.searchLevel;
  const itemCount = resolveItemCount(
    searchLevel,
    trialNumber,
    fieldSeed,
    settings.choicesOverride
  );
  const target = pickTarget(pool, trialNumber, searchLevel, fieldSeed);
  const distractorCount = Math.max(0, itemCount - 1);
  const distractors = buildDistractors(
    pool,
    target,
    distractorCount,
    searchLevel,
    trialNumber
  );

  const targetSlotIndex = resolveTargetSlotIndex(
    itemCount,
    trialNumber,
    fieldSeed
  );
  const shuffledDistractors = [...distractors].sort(
    (a, b) =>
      seededIndex(trialNumber * 37 + fieldSeed + a.id.length, 100) -
      seededIndex(trialNumber * 37 + fieldSeed + b.id.length, 100)
  );

  const fieldOrder: MatchVisualItem[] = [];
  let distractorIndex = 0;
  for (let slot = 0; slot < itemCount; slot += 1) {
    if (slot === targetSlotIndex) {
      fieldOrder.push(target);
    } else {
      fieldOrder.push(shuffledDistractors[distractorIndex]);
      distractorIndex += 1;
    }
  }

  const fieldItems = assignFieldPositions(
    fieldOrder,
    targetSlotIndex,
    trialNumber,
    fieldSeed
  );
  const targetFieldItem = fieldItems.find((entry) => entry.isTarget)!;

  return {
    trialNumber,
    searchLevel,
    target,
    targetItemId: targetFieldItem.id,
    targetPreviewMs: settings.targetPreviewMs,
    fieldItems,
    searchWindowMs: settings.searchWindowMs,
    itemSizePx: resolveItemSizePx(searchLevel),
  };
}

export function getFindTheTargetTargetFieldItem(
  spec: FindTheTargetTrialSpec
): FindTheTargetFieldItem | undefined {
  return spec.fieldItems.find((entry) => entry.isTarget);
}

function sortFieldBySimilarity(
  items: FindTheTargetFieldItem[],
  target: MatchVisualItem
): FindTheTargetFieldItem[] {
  return [...items].sort((a, b) => {
    if (a.isTarget) return 1;
    if (b.isTarget) return -1;
    return itemSimilarity(b.item, target) - itemSimilarity(a.item, target);
  });
}

export function getFindTheTargetDisplayedItems(
  spec: FindTheTargetTrialSpec,
  assistanceStage: TrainingAssistanceStage
): FindTheTargetFieldItem[] {
  const all = spec.fieldItems;

  if (assistanceStage === 'none' || assistanceStage === 'visual_hint') {
    return all;
  }

  const target = all.find((entry) => entry.isTarget);
  if (!target) return all;

  const distractors = sortFieldBySimilarity(
    all.filter((entry) => !entry.isTarget),
    spec.target
  );

  if (assistanceStage === 'reduced_choices') {
    const keep = Math.max(2, all.length - 1);
    const reduced = [target, ...distractors.slice(0, keep - 1)];
    return reduced.sort(
      (a, b) =>
        seededIndex(spec.trialNumber * 43 + a.id.length, 100) -
        seededIndex(spec.trialNumber * 43 + b.id.length, 100)
    );
  }

  if (assistanceStage === 'direct_visual_assistance') {
    const hardest = distractors[0];
    const pair = hardest ? [target, hardest] : [target];
    return pair.sort(
      (a, b) =>
        seededIndex(spec.trialNumber * 47 + a.id.length, 100) -
        seededIndex(spec.trialNumber * 47 + b.id.length, 100)
    );
  }

  return all;
}

export function getFindTheTargetHintRegion(
  spec: FindTheTargetTrialSpec,
  assistanceStage: TrainingAssistanceStage
): FindTheTargetRegion | null {
  if (assistanceStage !== 'visual_hint') return null;
  return getFindTheTargetTargetFieldItem(spec)?.region ?? null;
}

export function shouldHighlightFindTheTargetItem(
  assistanceStage: TrainingAssistanceStage,
  feedbackPhase: boolean
): boolean {
  return feedbackPhase || assistanceStage === 'direct_visual_assistance';
}

export function isFindTheTargetSelectionCorrect(
  fieldItemId: string,
  spec: FindTheTargetTrialSpec
): boolean {
  const entry = spec.fieldItems.find((item) => item.id === fieldItemId);
  return entry?.isTarget === true;
}

export function resolveFindTheTargetAssistanceStage(
  searchElapsedMs: number,
  promptingEnabled: boolean
): TrainingAssistanceStage {
  return resolveAssistanceStage(
    searchElapsedMs,
    FIND_THE_TARGET_ASSISTANCE_SCHEDULE,
    promptingEnabled
  );
}

/**
 * `responseTimeMs` = searchElapsedMs only (excludes target preview).
 */
export function resolveFindTheTargetTrialOutcome(input: {
  promptingEnabled: boolean;
  selected: boolean;
  fieldItemId?: string;
  spec: FindTheTargetTrialSpec;
  /** elapsed from start of SEARCH phase — maps to responseTimeMs */
  searchElapsedMs: number;
}): FindTheTargetTrialOutcome {
  const correct =
    input.selected && input.fieldItemId
      ? isFindTheTargetSelectionCorrect(input.fieldItemId, input.spec)
      : false;

  const promptLevel = resolveTrialPromptLevel({
    responded: input.selected,
    promptingEnabled: input.promptingEnabled,
    elapsedMs: input.searchElapsedMs,
    schedule: FIND_THE_TARGET_ASSISTANCE_SCHEDULE,
  });

  const searchElapsedMs = Math.max(0, Math.round(input.searchElapsedMs));

  return {
    correct,
    promptLevel,
    responseTimeMs: searchElapsedMs,
  };
}

export function getFindTheTargetTargetSlotIndex(
  spec: FindTheTargetTrialSpec
): number {
  return spec.fieldItems.findIndex((entry) => entry.isTarget);
}

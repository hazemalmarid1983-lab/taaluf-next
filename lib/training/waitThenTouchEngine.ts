/**
 * منطق وسيلة «انتظر ثم المس» — response control / inhibition — بلا واجهة.
 *
 * ## Difficulty → control level (activity-specific)
 * Generic `difficulty` (1–3) → internal `controlLevel` (1–6).
 * Optional `content.controlLevel` override only.
 *
 * ## responseTimeMs semantics
 * - **correct:** GO cue → touch (`responseLatencyMs`). Excludes READY/WAIT.
 * - **premature:** WAIT start → early touch. NOT comparable to correct latency.
 * - **timeout:** `responseWindowMs` (GO phase elapsed at expiry).
 *
 * ## TrainingTrial mapping (schema unchanged)
 * - correct: true only for post-GO target touch.
 * - premature: correct=false, promptLevel≠no_response (typically independent).
 * - timeout: correct=false, promptLevel=no_response.
 * - `outcomeKind` on engine outcome is internal — not persisted on TrainingTrial.
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

export type WaitThenTouchTrialPhase =
  | 'ready'
  | 'wait'
  | 'go'
  | 'response'
  | 'feedback';

export type WaitThenTouchOutcomeKind = 'correct' | 'premature' | 'timeout';

export type WaitThenTouchGoCueStyle = 'glow' | 'ring' | 'scale';

export type WaitThenTouchDistractorSpec = {
  id: string;
  item: MatchVisualItem;
  x: number;
  y: number;
  /** decorative only — never a GO cue */
  interactive: boolean;
};

export type WaitThenTouchTrialSpec = {
  trialNumber: number;
  controlLevel: number;
  target: MatchVisualItem;
  readyDurationMs: number;
  waitDurationMs: number;
  responseWindowMs: number;
  targetSizePx: number;
  goCueStyle: WaitThenTouchGoCueStyle;
  distractors: WaitThenTouchDistractorSpec[];
};

export type WaitThenTouchRuntimeSettings = {
  trialCount: number;
  difficulty: TrainingDifficulty;
  controlLevel: number;
  prompting: boolean;
  reinforcement: boolean;
  responseWindowMs: number;
  readyDurationMs: number;
  itemPool: string;
  goCueStyle: WaitThenTouchGoCueStyle;
};

export type WaitThenTouchTrialOutcome = {
  correct: boolean;
  promptLevel: TrainingPromptLevel;
  responseTimeMs: number;
  /** Internal behavioral kind — not stored on TrainingTrial */
  outcomeKind: WaitThenTouchOutcomeKind;
};

/** مستويات 1–6 — MVP 1–4 */
export const CONTROL_LEVEL_DISTRACTOR_COUNT: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 2,
  5: 2,
  6: 3,
};

const DEFAULT_RESPONSE_WINDOW_MS = 6000;
const DEFAULT_READY_MS = 600;
const DEFAULT_ITEM_POOL = 'basic_shapes';

export const WAIT_THEN_TOUCH_ASSISTANCE_SCHEDULE: TrainingAssistanceSchedule = {
  visualHintMs: 2200,
  directVisualMs: 4500,
};

const LEVEL_TARGET_SIZE_PX: Record<number, number> = {
  1: 120,
  2: 112,
  3: 104,
  4: 96,
  5: 88,
  6: 84,
};

const LEVEL_WAIT_MS: Record<number, number | { min: number; max: number }> = {
  1: 1200,
  2: 1800,
  3: { min: 1500, max: 2800 },
  4: { min: 2200, max: 3600 },
  5: { min: 2800, max: 4200 },
  6: { min: 3200, max: 4800 },
};

const TARGET_POOL: MatchVisualItem[] = [
  { id: 'wait-circle-teal', shape: 'circle', color: '#2E7D8E', size: 'lg', style: 'filled' },
  { id: 'wait-square-coral', shape: 'square', color: '#C94C4C', size: 'lg', style: 'filled' },
  { id: 'wait-triangle-gold', shape: 'triangle', color: '#E08A3C', size: 'lg', style: 'filled' },
  { id: 'wait-diamond-indigo', shape: 'diamond', color: '#4B5EB8', size: 'lg', style: 'filled' },
  { id: 'wait-circle-sage', shape: 'circle', color: '#3A9B6E', size: 'lg', style: 'filled' },
];

const DISTRACTOR_POOL: MatchVisualItem[] = [
  { id: 'wait-distractor-plum', shape: 'square', color: '#7B5EA7', size: 'md', style: 'outline' },
  { id: 'wait-distractor-blue', shape: 'triangle', color: '#3D7DD6', size: 'md', style: 'outline' },
  { id: 'wait-distractor-orange', shape: 'diamond', color: '#E08A3C', size: 'sm', style: 'outline' },
];

/** Explicit phase transitions for tests */
export const WAIT_THEN_TOUCH_VALID_TRANSITIONS: Record<
  WaitThenTouchTrialPhase,
  WaitThenTouchTrialPhase[]
> = {
  ready: ['wait'],
  wait: ['go', 'feedback'],
  go: ['response', 'feedback'],
  response: ['feedback'],
  feedback: [],
};

export function canTransitionWaitThenTouchPhase(
  from: WaitThenTouchTrialPhase,
  to: WaitThenTouchTrialPhase
): boolean {
  return WAIT_THEN_TOUCH_VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

function clampControlLevel(level: number): number {
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
  if (poolId === 'basic_shapes') return TARGET_POOL;
  return TARGET_POOL;
}

export function controlLevelFromDifficulty(
  difficulty: TrainingDifficulty
): number {
  if (difficulty === 1) return 1;
  if (difficulty === 2) return 3;
  return 4;
}

export function resolveControlLevel(config: ResolvedMediaConfig): number {
  const fromContent = config.content?.controlLevel;
  if (typeof fromContent === 'number') {
    return clampControlLevel(fromContent);
  }
  return clampControlLevel(controlLevelFromDifficulty(config.difficulty));
}

export function deriveWaitThenTouchSessionSeed(sessionId: string): number {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i += 1) {
    hash = (hash * 41 + sessionId.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

function resolveWaitDurationMs(
  controlLevel: number,
  trialNumber: number,
  sessionSeed: number
): number {
  const table = LEVEL_WAIT_MS[controlLevel] ?? 1500;
  if (typeof table === 'number') return table;

  const span = table.max - table.min + 1;
  return table.min + seededIndex(trialNumber * 17 + sessionSeed * 3, span);
}

function resolveReadyDurationMs(controlLevel: number): number {
  return controlLevel <= 1 ? 700 : DEFAULT_READY_MS;
}

function resolveGoCueStyle(
  config: ResolvedMediaConfig
): WaitThenTouchGoCueStyle {
  const style = config.content?.goCueStyle;
  if (style === 'ring' || style === 'scale' || style === 'glow') return style;
  return controlLevelFromDifficulty(config.difficulty) <= 2 ? 'scale' : 'glow';
}

export function resolveWaitThenTouchRuntimeSettings(
  config: ResolvedMediaConfig
): WaitThenTouchRuntimeSettings {
  const controlLevel = resolveControlLevel(config);
  const itemPool =
    typeof config.content?.itemPool === 'string'
      ? config.content.itemPool
      : DEFAULT_ITEM_POOL;

  return {
    trialCount: config.trialCount,
    difficulty: config.difficulty,
    controlLevel,
    prompting: config.prompting,
    reinforcement: config.reinforcement,
    responseWindowMs: config.responseWindowMs ?? DEFAULT_RESPONSE_WINDOW_MS,
    readyDurationMs: resolveReadyDurationMs(controlLevel),
    itemPool,
    goCueStyle: resolveGoCueStyle(config),
  };
}

export function waitThenTouchSettingsForLevel(
  settings: WaitThenTouchRuntimeSettings,
  level: number
): WaitThenTouchRuntimeSettings {
  const controlLevel = clampControlLevel(level);
  return {
    ...settings,
    controlLevel,
    readyDurationMs: resolveReadyDurationMs(controlLevel),
  };
}

function pickTarget(
  pool: MatchVisualItem[],
  trialNumber: number,
  controlLevel: number,
  sessionSeed: number
): MatchVisualItem {
  const base = pool[seededIndex(trialNumber * 11 + sessionSeed, pool.length)];

  if (controlLevel >= 6) {
    return cloneItem(base, {
      id: `${base.id}-gen-${trialNumber}`,
      style: trialNumber % 2 === 0 ? 'outline' : 'filled',
      theme: 'generalized',
    });
  }

  if (controlLevel >= 5) {
    return cloneItem(base, {
      id: `${base.id}-ctx-${trialNumber}`,
      theme: 'context_shift',
    });
  }

  const size =
    controlLevel <= 1 ? 'lg' : controlLevel <= 2 ? 'lg' : controlLevel <= 3 ? 'md' : 'md';

  return cloneItem(base, { id: `${base.id}-t${trialNumber}`, size });
}

function buildDistractors(
  controlLevel: number,
  trialNumber: number,
  sessionSeed: number
): WaitThenTouchDistractorSpec[] {
  const count = CONTROL_LEVEL_DISTRACTOR_COUNT[controlLevel] ?? 0;
  if (count <= 0) return [];

  const slots = [
    { x: 22, y: 28 },
    { x: 78, y: 30 },
    { x: 28, y: 72 },
    { x: 74, y: 70 },
  ];

  return Array.from({ length: count }, (_, index) => {
    const item =
      DISTRACTOR_POOL[
        seededIndex(trialNumber * 23 + sessionSeed + index, DISTRACTOR_POOL.length)
      ];
    const slot = slots[seededIndex(trialNumber * 29 + index + sessionSeed, slots.length)];

    return {
      id: `distractor-${trialNumber}-${index}`,
      item: cloneItem(item, {
        id: `${item.id}-d${trialNumber}-${index}`,
        size: 'sm',
      }),
      x: slot.x,
      y: slot.y,
      interactive: controlLevel >= 5,
    };
  });
}

export function buildWaitThenTouchTrialSpec(
  settings: WaitThenTouchRuntimeSettings,
  trialNumber: number,
  sessionSeed = 1
): WaitThenTouchTrialSpec {
  const pool = getItemPool(settings.itemPool);
  const controlLevel = settings.controlLevel;

  return {
    trialNumber,
    controlLevel,
    target: pickTarget(pool, trialNumber, controlLevel, sessionSeed),
    readyDurationMs: settings.readyDurationMs,
    waitDurationMs: resolveWaitDurationMs(
      controlLevel,
      trialNumber,
      sessionSeed
    ),
    responseWindowMs: settings.responseWindowMs,
    targetSizePx: LEVEL_TARGET_SIZE_PX[controlLevel] ?? 100,
    goCueStyle: settings.goCueStyle,
    distractors: buildDistractors(controlLevel, trialNumber, sessionSeed),
  };
}

export function resolveWaitThenTouchAssistanceStage(
  goPhaseElapsedMs: number,
  promptingEnabled: boolean
): TrainingAssistanceStage {
  return resolveAssistanceStage(
    goPhaseElapsedMs,
    WAIT_THEN_TOUCH_ASSISTANCE_SCHEDULE,
    promptingEnabled
  );
}

/** Assistance only during GO — never during WAIT */
export function shouldApplyWaitThenTouchAssistance(
  phase: WaitThenTouchTrialPhase
): boolean {
  return phase === 'go';
}

export function shouldStrengthenGoCueVisual(
  assistanceStage: TrainingAssistanceStage,
  phase: WaitThenTouchTrialPhase
): boolean {
  if (phase !== 'go') return false;
  return (
    assistanceStage === 'visual_hint' ||
    assistanceStage === 'direct_visual_assistance'
  );
}

export function isWaitThenTouchPrematurePhase(phase: WaitThenTouchTrialPhase): boolean {
  return phase === 'wait';
}

export function isWaitThenTouchGoPhase(phase: WaitThenTouchTrialPhase): boolean {
  return phase === 'go';
}

export function isWaitThenTouchTargetTouchValid(
  phase: WaitThenTouchTrialPhase
): boolean {
  return phase === 'go';
}

/**
 * Maps behavioral outcome to TrainingTrial-compatible fields + internal outcomeKind.
 */
export function resolveWaitThenTouchTrialOutcome(input: {
  promptingEnabled: boolean;
  outcomeKind: WaitThenTouchOutcomeKind;
  /** GO → touch (correct only) */
  responseLatencyMs?: number;
  /** WAIT → premature touch */
  waitElapsedMs?: number;
  /** GO phase elapsed — assistance + timeout */
  goPhaseElapsedMs?: number;
  responseWindowMs: number;
}): WaitThenTouchTrialOutcome {
  if (input.outcomeKind === 'correct') {
    const responseLatencyMs = Math.max(0, Math.round(input.responseLatencyMs ?? 0));
    const goPhaseElapsedMs = Math.max(0, Math.round(input.goPhaseElapsedMs ?? responseLatencyMs));

    return {
      correct: true,
      outcomeKind: 'correct',
      responseTimeMs: responseLatencyMs,
      promptLevel: resolveTrialPromptLevel({
        responded: true,
        promptingEnabled: input.promptingEnabled,
        elapsedMs: goPhaseElapsedMs,
        schedule: WAIT_THEN_TOUCH_ASSISTANCE_SCHEDULE,
      }),
    };
  }

  if (input.outcomeKind === 'premature') {
    const waitElapsedMs = Math.max(0, Math.round(input.waitElapsedMs ?? 0));

    return {
      correct: false,
      outcomeKind: 'premature',
      responseTimeMs: waitElapsedMs,
      promptLevel: 'independent',
    };
  }

  const goPhaseElapsedMs = Math.max(
    0,
    Math.round(input.goPhaseElapsedMs ?? input.responseWindowMs)
  );

  return {
    correct: false,
    outcomeKind: 'timeout',
    responseTimeMs: goPhaseElapsedMs,
    promptLevel: 'no_response',
  };
}

export function waitDurationIncreasesWithControlLevel(
  sessionSeed: number,
  trialNumber: number
): boolean {
  const level1 = resolveWaitDurationMs(1, trialNumber, sessionSeed);
  const level4 = resolveWaitDurationMs(4, trialNumber, sessionSeed);
  return level4 >= level1;
}

export function waitDurationVariesAcrossTrials(
  controlLevel: number,
  sessionSeed: number,
  trialCount: number
): boolean {
  if (typeof LEVEL_WAIT_MS[controlLevel] === 'number') return false;
  const durations = new Set<number>();
  for (let t = 1; t <= trialCount; t += 1) {
    durations.add(resolveWaitDurationMs(controlLevel, t, sessionSeed));
  }
  return durations.size > 1;
}

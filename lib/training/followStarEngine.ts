/**
 * منطق وسيلة «اتبع النجمة» — قابل للاختبار، بلا واجهة.
 *
 * ## responseTimeMs semantics
 * Complete task response duration: movementElapsedMs + readyElapsedMs.
 * Includes movement/tracking phase and ready-window wait — NOT pure reaction latency.
 */

import type { ResolvedMediaConfig } from '@/lib/training/engine/types';
import type { TrainingDifficulty, TrainingPromptLevel } from '@/lib/training/types';
import {
  resolveAssistanceStage,
  resolveTrialPromptLevel,
  type TrainingAssistanceSchedule,
  type TrainingAssistanceStage,
} from '@/lib/training/assistanceSemantics';

export type FollowStarPoint = {
  x: number;
  y: number;
};

export type FollowStarRuntimeSettings = {
  trialCount: number;
  difficulty: TrainingDifficulty;
  movementDurationMs: number;
  readyWindowMs: number;
  prompting: boolean;
  reinforcement: boolean;
  hitRadiusPercent: number;
};

export type FollowStarTrialOutcome = {
  correct: boolean;
  promptLevel: TrainingPromptLevel;
  responseTimeMs: number;
};

const DEFAULT_HIT_RADIUS = 14;

/** جدول تصعيد المساعدة الرقمية — إبراز بصري فقط */
export const FOLLOW_STAR_ASSISTANCE_SCHEDULE: TrainingAssistanceSchedule = {
  visualHintMs: 1200,
};

/** مسارات بسيطة داخل مساحة اللعب (0–100) */
const FOLLOW_STAR_PATHS: FollowStarPoint[][] = [
  [
    { x: 18, y: 72 },
    { x: 50, y: 28 },
  ],
  [
    { x: 82, y: 68 },
    { x: 48, y: 38 },
  ],
  [
    { x: 24, y: 32 },
    { x: 76, y: 58 },
  ],
  [
    { x: 50, y: 78 },
    { x: 50, y: 24 },
  ],
  [
    { x: 14, y: 50 },
    { x: 86, y: 50 },
  ],
];

export function resolveFollowStarRuntimeSettings(
  config: ResolvedMediaConfig
): FollowStarRuntimeSettings {
  const speed = config.movementSpeed ?? 1;
  const difficultyFactor =
    config.difficulty === 1 ? 1.15 : config.difficulty === 2 ? 1 : 0.88;
  const movementDurationMs = Math.round((1900 / Math.max(0.5, speed)) * difficultyFactor);
  const readyWindowMs = config.displayDurationMs ?? 3000;
  const hitRadiusPercent =
    typeof config.content?.hitRadiusPercent === 'number'
      ? config.content.hitRadiusPercent
      : DEFAULT_HIT_RADIUS;

  return {
    trialCount: config.trialCount,
    difficulty: config.difficulty,
    movementDurationMs,
    readyWindowMs,
    prompting: config.prompting,
    reinforcement: config.reinforcement,
    hitRadiusPercent,
  };
}

function seededIndex(seed: number, max: number): number {
  if (max <= 0) return 0;
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return Math.floor((x - Math.floor(x)) * max);
}

/** Fisher–Yates shuffle deterministically — يمنع تكرار trialNumber % 5 المتوقع */
export function buildFollowStarPathOrder(pathOrderSeed: number): number[] {
  const order = FOLLOW_STAR_PATHS.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = seededIndex(pathOrderSeed * 17 + i * 31, i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function deriveFollowStarPathOrderSeed(sessionId: string): number {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i += 1) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

export function getFollowStarPathIndex(
  trialNumber: number,
  pathOrderSeed = 1
): number {
  const order = buildFollowStarPathOrder(pathOrderSeed);
  return order[(Math.max(1, trialNumber) - 1) % order.length];
}

export function getFollowStarPath(
  trialNumber: number,
  pathOrderSeed = 1
): FollowStarPoint[] {
  return FOLLOW_STAR_PATHS[getFollowStarPathIndex(trialNumber, pathOrderSeed)];
}

export function getFollowStarTargetPoint(path: FollowStarPoint[]): FollowStarPoint {
  return path[path.length - 1];
}

/** أبعاد مساحة اللعب بالبكسل — لتحويل النسب المئوية إلى مسافات حقيقية */
export type ArenaDimensions = {
  widthPx: number;
  heightPx: number;
};

/** نصف قطر الإصابة بالبكسل — نسبة من أقصر بعد في المستطيل */
export function hitRadiusPixels(
  hitRadiusPercent: number,
  arena: ArenaDimensions
): number {
  const minDim = Math.min(Math.abs(arena.widthPx), Math.abs(arena.heightPx));
  return Math.round((hitRadiusPercent / 100) * minDim);
}

/** مسافة euclidean بالبكسل بين نقطتين بنسب مئوية (0–100) */
export function distanceInArenaPixels(
  a: FollowStarPoint,
  b: FollowStarPoint,
  arena: ArenaDimensions
): number {
  const dx = ((a.x - b.x) / 100) * arena.widthPx;
  const dy = ((a.y - b.y) / 100) * arena.heightPx;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * يتحقق من لمس/نقر داخل نطاق الهدف.
 * يحوّل X/Y المئويين إلى بكسل قبل قياس المسافة — فيصبح hitRadiusPercent
 * دائرة بصرية متقاربة على phone/tablet/desktop وportrait/landscape.
 */
export function isFollowStarHit(
  tap: FollowStarPoint,
  target: FollowStarPoint,
  hitRadiusPercent: number,
  arena: ArenaDimensions
): boolean {
  if (arena.widthPx <= 0 || arena.heightPx <= 0) return false;
  const radiusPx = hitRadiusPixels(hitRadiusPercent, arena);
  const distancePx = distanceInArenaPixels(tap, target, arena);
  return distancePx <= radiusPx + 1e-6;
}

export function resolveFollowStarAssistanceStage(
  elapsedReadyMs: number,
  promptingEnabled: boolean
): TrainingAssistanceStage {
  return resolveAssistanceStage(
    elapsedReadyMs,
    FOLLOW_STAR_ASSISTANCE_SCHEDULE,
    promptingEnabled
  );
}

/** @deprecated استخدم resolveFollowStarAssistanceStage */
export function resolveFollowStarPromptStage(
  elapsedReadyMs: number,
  promptingEnabled: boolean
): TrainingAssistanceStage | null {
  const stage = resolveFollowStarAssistanceStage(
    elapsedReadyMs,
    promptingEnabled
  );
  return stage === 'none' ? null : stage;
}

/**
 * `responseTimeMs` = movementElapsedMs + readyElapsedMs (full task duration, not reaction-only).
 */
export function resolveFollowStarTrialOutcome(input: {
  promptingEnabled: boolean;
  tapped: boolean;
  hit: boolean;
  /** ready-window elapsed after star stopped — not persisted on TrainingTrial */
  elapsedReadyMs: number;
  /** movement phase elapsed — not persisted on TrainingTrial */
  movementMs: number;
}): FollowStarTrialOutcome {
  const promptLevel = resolveTrialPromptLevel({
    responded: input.tapped,
    promptingEnabled: input.promptingEnabled,
    elapsedMs: input.elapsedReadyMs,
    schedule: FOLLOW_STAR_ASSISTANCE_SCHEDULE,
  });

  const movementElapsedMs = Math.max(0, Math.round(input.movementMs));
  const readyElapsedMs = Math.max(0, Math.round(input.elapsedReadyMs));
  const totalTaskElapsedMs = movementElapsedMs + readyElapsedMs;

  return {
    correct: input.hit,
    promptLevel,
    responseTimeMs: totalTaskElapsedMs,
  };
}

export function shouldShowFollowStarVisualCue(
  assistanceStage: TrainingAssistanceStage
): boolean {
  return assistanceStage === 'visual_hint';
}

export function childFacingStars(accuracy: number): number {
  if (accuracy >= 80) return 3;
  if (accuracy >= 50) return 2;
  return 1;
}

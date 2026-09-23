/**
 * محرك observer-imitation (C15) — إعدادات الجلسة والمحاولات فقط.
 * لا يقيّم التقليد تلقائياً ولا يخصص promptLevel من latency أو replays.
 */

import type { ResolvedMediaConfig } from '@/lib/training/engine/types';
import type { TrainingDifficulty, TrainingPromptLevel } from '@/lib/training/types';
import { resolveMovementIdsForC15TargetSkills } from '@/lib/training/c15SkillMovementMap';
import { filterObserverImitationTargetSkillIds } from '@/lib/training/c15SkillClassification';
import {
  buildObserverImitationTrialMovements,
  getObserverImitationMovement,
  type ObserverImitationMovementDefinition,
} from '@/lib/training/observerImitationCatalog';

export const OBSERVER_IMITATION_MEDIA_ID = 'observer-imitation';

export type ObserverImitationRuntimeSettings = {
  difficulty: TrainingDifficulty;
  trialCount: number;
  modelDurationMs: number;
  replayAllowedDefault: boolean;
  reinforcement: boolean;
  trials: ObserverImitationMovementDefinition[];
  sessionSeed: string;
};

export type ObserverImitationTrialOutcome = {
  correct: boolean;
  promptLevel: TrainingPromptLevel;
  responseTimeMs: number;
  movementId: string;
  movementCategory: ObserverImitationMovementDefinition['category'];
  modelReplays: number;
};

export function resolveObserverImitationRuntimeSettings(input: {
  config: ResolvedMediaConfig;
  sessionId: string;
  /** Target skills من الخطة/الجلسة — عند الغياب يُستخدم pool الفصل/الصعوبة (legacy) */
  skillIds?: string[];
}): ObserverImitationRuntimeSettings {
  const content = input.config.content ?? {};
  const modelDurationMs =
    typeof content.modelDurationMs === 'number' && content.modelDurationMs > 0
      ? Math.floor(content.modelDurationMs)
      : typeof input.config.displayDurationMs === 'number' &&
          input.config.displayDurationMs > 0
        ? Math.floor(input.config.displayDurationMs)
        : 3500;

  const configMovementIds = Array.isArray(content.movementIds)
    ? content.movementIds.filter((id): id is string => typeof id === 'string')
    : undefined;

  const targetSkillIds = filterObserverImitationTargetSkillIds(input.skillIds);
  const skillScopedMovementIds = targetSkillIds?.length
    ? resolveMovementIdsForC15TargetSkills(targetSkillIds)
    : undefined;

  const movementIdsOverride =
    skillScopedMovementIds && skillScopedMovementIds.length > 0
      ? skillScopedMovementIds
      : configMovementIds;

  const difficulty = input.config.difficulty;
  const trials = buildObserverImitationTrialMovements({
    sessionSeed: input.sessionId,
    trialCount: input.config.trialCount,
    difficulty,
    movementIdsOverride,
  });

  return {
    difficulty,
    trialCount: input.config.trialCount,
    modelDurationMs,
    replayAllowedDefault:
      content.replayAllowed !== undefined
        ? Boolean(content.replayAllowed)
        : true,
    reinforcement: input.config.reinforcement,
    trials,
    sessionSeed: input.sessionId,
  };
}

export function resolveObserverImitationTrialMovement(
  settings: ObserverImitationRuntimeSettings,
  trialNumber: number
): ObserverImitationMovementDefinition | null {
  const index = trialNumber - 1;
  if (index < 0 || index >= settings.trials.length) {
    return null;
  }
  return settings.trials[index] ?? null;
}

export function assertKnownMovementId(movementId: string): void {
  if (!getObserverImitationMovement(movementId)) {
    throw new Error(`حركة غير معروفة: ${movementId}`);
  }
}

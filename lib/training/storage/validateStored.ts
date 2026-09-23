/**
 * التحقق من كيانات التدريب المخزّنة محلياً.
 */

import { validateTrainingPlanDocument } from '@/lib/training/validatePlan';
import { isValidTrainingDifficulty } from '@/lib/training/engine/mediaLoader';
import { validateTrainingSessionRuntime } from '@/lib/training/engine/validate';
import type {
  TrainingPlan,
  TrainingProgress,
  TrainingValidationResult,
} from '@/lib/training/types';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';

const MASTERY_LEVELS: NonNullable<TrainingProgress['masteryLevel']>[] = [
  'not_started',
  'emerging',
  'developing',
  'mastered',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  return !Number.isNaN(Date.parse(value));
}

export function validateTrainingPlan(input: unknown): TrainingValidationResult {
  return validateTrainingPlanDocument(input);
}

export function validateTrainingProgress(input: unknown): TrainingValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ['TrainingProgress يجب أن يكون كائناً'] };
  }

  if (typeof input.childId !== 'string' || !input.childId.trim()) {
    errors.push('childId مطلوب');
  }
  if (typeof input.chapterId !== 'string' || !input.chapterId.trim()) {
    errors.push('chapterId مطلوب');
  }
  if (typeof input.mediaId !== 'string' || !input.mediaId.trim()) {
    errors.push('mediaId مطلوب');
  }

  const completed = Number(input.completedSessions);
  if (!Number.isInteger(completed) || completed < 0) {
    errors.push('completedSessions يجب أن يكون عدداً صحيحاً غير سالب');
  }

  if (!isValidTrainingDifficulty(Number(input.lastDifficulty))) {
    errors.push('lastDifficulty يجب أن يكون 1 أو 2 أو 3');
  }

  if (input.independenceRate !== undefined) {
    const rate = Number(input.independenceRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      errors.push('independenceRate يجب أن يكون بين 0 و 100');
    }
  }

  if (input.lastSessionAt !== undefined && !isIsoDate(input.lastSessionAt)) {
    errors.push('lastSessionAt يجب أن يكون تاريخاً صالحاً');
  }

  if (
    input.masteryLevel !== undefined &&
    !MASTERY_LEVELS.includes(
      input.masteryLevel as NonNullable<TrainingProgress['masteryLevel']>
    )
  ) {
    errors.push('masteryLevel غير صالح');
  }

  return { valid: errors.length === 0, errors };
}

export function validateStoredTrainingSession(
  input: unknown
): TrainingValidationResult {
  return validateTrainingSessionRuntime(input);
}

export function sanitizeTrainingPlan(input: unknown): TrainingPlan | null {
  const result = validateTrainingPlan(input);
  if (!result.valid || !isRecord(input)) return null;
  return input as TrainingPlan;
}

export function sanitizeTrainingProgress(input: unknown): TrainingProgress | null {
  const result = validateTrainingProgress(input);
  if (!result.valid || !isRecord(input)) return null;
  return input as TrainingProgress;
}

export function sanitizeStoredTrainingSession(
  input: unknown
): TrainingSessionRuntime | null {
  const result = validateStoredTrainingSession(input);
  if (!result.valid || !isRecord(input)) return null;
  return input as TrainingSessionRuntime;
}

export function trainingProgressKey(
  progress: Pick<TrainingProgress, 'childId' | 'chapterId' | 'mediaId'>
): string {
  return `${progress.childId}::${progress.chapterId}::${progress.mediaId}`;
}

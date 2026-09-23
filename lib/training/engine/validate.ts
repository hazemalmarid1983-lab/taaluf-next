/**
 * التحقق من صحة المحاولات والجلسات في محرك التدريب.
 */

import {
  type TrainingSession,
  type TrainingTrial,
  type TrainingValidationResult,
} from '@/lib/training/types';
import { isTrainingPromptLevel } from '@/lib/training/engine/promptLevels';
import { isValidTrainingDifficulty } from '@/lib/training/engine/mediaLoader';
import type { RecordTrainingTrialInput } from '@/lib/training/engine/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  return !Number.isNaN(Date.parse(value));
}

const TAP_TO_REQUEST_RESPONSE_MODES = new Set([
  'child_tap',
  'observer_no_response',
]);

const OBSERVER_IMITATION_CATEGORIES = new Set(['gross', 'fine', 'social']);

function validateOptionalTapToRequestTrialFields(
  input: Record<string, unknown>,
  errors: string[]
) {
  if (input.targetId !== undefined) {
    if (typeof input.targetId !== 'string' || !input.targetId.trim()) {
      errors.push('targetId يجب أن يكون نصاً غير فارغ');
    }
  }

  if (input.responseChoiceId !== undefined && input.responseChoiceId !== null) {
    if (
      typeof input.responseChoiceId !== 'string' ||
      !input.responseChoiceId.trim()
    ) {
      errors.push('responseChoiceId يجب أن يكون null أو نصاً غير فارغ');
    }
  }

  if (input.responseMode !== undefined) {
    if (
      typeof input.responseMode !== 'string' ||
      !TAP_TO_REQUEST_RESPONSE_MODES.has(input.responseMode)
    ) {
      errors.push('responseMode غير صالح');
    }
  }
}

function validateOptionalObserverImitationTrialFields(
  input: Record<string, unknown>,
  errors: string[]
) {
  if (input.movementId !== undefined) {
    if (typeof input.movementId !== 'string' || !input.movementId.trim()) {
      errors.push('movementId يجب أن يكون نصاً غير فارغ');
    }
  }

  if (input.movementCategory !== undefined) {
    if (
      typeof input.movementCategory !== 'string' ||
      !OBSERVER_IMITATION_CATEGORIES.has(input.movementCategory)
    ) {
      errors.push('movementCategory غير صالح');
    }
  }

  if (input.modelReplays !== undefined) {
    const replays = Number(input.modelReplays);
    if (!Number.isInteger(replays) || replays < 0) {
      errors.push('modelReplays يجب أن يكون عدداً صحيحاً غير سالب');
    }
  }
}

export function validateTrainingTrial(input: unknown): TrainingValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ['TrainingTrial يجب أن يكون كائناً'] };
  }

  const trialNumber = input.trialNumber;
  if (typeof trialNumber !== 'number' || !Number.isInteger(trialNumber) || trialNumber < 1) {
    errors.push('trialNumber يجب أن يكون عدداً صحيحاً موجباً');
  }

  if (typeof input.correct !== 'boolean') {
    errors.push('correct يجب أن يكون boolean');
  }

  if (
    typeof input.promptLevel !== 'string' ||
    !isTrainingPromptLevel(input.promptLevel)
  ) {
    errors.push('promptLevel غير صالح');
  }

  if (input.responseTimeMs !== undefined) {
    const rt = Number(input.responseTimeMs);
    if (!Number.isFinite(rt) || rt < 0) {
      errors.push('responseTimeMs يجب أن يكون عدداً غير سالب');
    }
  }

  if (!isIsoTimestamp(input.recordedAt)) {
    errors.push('recordedAt يجب أن يكون طابعاً زمنياً ISO صالحاً');
  }

  validateOptionalTapToRequestTrialFields(input, errors);
  validateOptionalObserverImitationTrialFields(input, errors);

  return { valid: errors.length === 0, errors };
}

export function validateRecordTrainingTrialInput(
  input: unknown
): TrainingValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ['مدخلات المحاولة يجب أن تكون كائناً'] };
  }

  if (typeof input.correct !== 'boolean') {
    errors.push('correct يجب أن يكون boolean');
  }

  if (
    typeof input.promptLevel !== 'string' ||
    !isTrainingPromptLevel(input.promptLevel)
  ) {
    errors.push('promptLevel غير صالح');
  }

  if (input.responseTimeMs !== undefined) {
    const rt = Number(input.responseTimeMs);
    if (!Number.isFinite(rt) || rt < 0) {
      errors.push('responseTimeMs يجب أن يكون عدداً غير سالب');
    }
  }

  if (
    input.recordedAt !== undefined &&
    !isIsoTimestamp(input.recordedAt)
  ) {
    errors.push('recordedAt يجب أن يكون طابعاً زمنياً ISO صالحاً');
  }

  validateOptionalTapToRequestTrialFields(input, errors);
  validateOptionalObserverImitationTrialFields(input, errors);

  return { valid: errors.length === 0, errors };
}

export function validateTrainingSession(input: unknown): TrainingValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ['TrainingSession يجب أن يكون كائناً'] };
  }

  if (typeof input.id !== 'string' || !input.id.trim()) {
    errors.push('id مطلوب');
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

  const difficulty = Number(input.difficulty);
  if (!isValidTrainingDifficulty(difficulty)) {
    errors.push('difficulty يجب أن يكون 1 أو 2 أو 3');
  }

  if (!isIsoTimestamp(input.startedAt)) {
    errors.push('startedAt يجب أن يكون طابعاً زمنياً ISO صالحاً');
  }

  if (input.endedAt !== undefined && !isIsoTimestamp(input.endedAt)) {
    errors.push('endedAt يجب أن يكون طابعاً زمنياً ISO صالحاً');
  }

  if (!Array.isArray(input.trials)) {
    errors.push('trials يجب أن يكون مصفوفة');
  } else {
    input.trials.forEach((trial, index) => {
      const result = validateTrainingTrial(trial);
      if (!result.valid) {
        errors.push(
          ...result.errors.map((err) => `trials[${index}].${err}`)
        );
      }
    });

    const numbers = input.trials
      .map((trial) =>
        isRecord(trial) && typeof trial.trialNumber === 'number'
          ? trial.trialNumber
          : null
      )
      .filter((n): n is number => n !== null);

    if (new Set(numbers).size !== numbers.length) {
      errors.push('trialNumber مكرر داخل الجلسة');
    }
  }

  if (input.independenceRate !== undefined) {
    const rate = Number(input.independenceRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      errors.push('independenceRate يجب أن يكون بين 0 و 100');
    }
  }

  if (input.goalIds !== undefined) {
    if (!Array.isArray(input.goalIds)) {
      errors.push('goalIds يجب أن يكون مصفوفة');
    } else if (!input.goalIds.every((item) => typeof item === 'string')) {
      errors.push('goalIds يجب أن يكون مصفوفة نصوص');
    } else if (new Set(input.goalIds).size !== input.goalIds.length) {
      errors.push('goalIds يجب أن تكون فريدة');
    }
  }

  if (input.protocolRevision !== undefined) {
    if (
      typeof input.protocolRevision !== 'string' ||
      !input.protocolRevision.trim()
    ) {
      errors.push('protocolRevision يجب أن يكون نصاً غير فارغ');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateTrainingSessionRuntime(
  input: unknown
): TrainingValidationResult {
  const base = validateTrainingSession(input);
  const errors = [...base.errors];

  if (!isRecord(input)) {
    return base;
  }

  if (input.status !== 'active' && input.status !== 'completed') {
    errors.push('status يجب أن يكون active أو completed');
  }

  const target = Number(input.targetTrialCount);
  if (!Number.isInteger(target) || target < 1) {
    errors.push('targetTrialCount يجب أن يكون عدداً صحيحاً موجباً');
  }

  if (input.activeTrialNumber !== undefined) {
    const active = Number(input.activeTrialNumber);
    if (!Number.isInteger(active) || active < 1) {
      errors.push('activeTrialNumber يجب أن يكون عدداً صحيحاً موجباً');
    }
  }

  if (
    input.status === 'completed' &&
    input.activeTrialNumber !== undefined &&
    input.activeTrialNumber !== null
  ) {
    errors.push('الجلسة المكتملة لا يجب أن تحتوي محاولة نشطة');
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidTrainingTrial(
  input: unknown
): asserts input is TrainingTrial {
  const result = validateTrainingTrial(input);
  if (!result.valid) {
    throw new Error(result.errors.join('; '));
  }
}

export function assertValidRecordTrainingTrialInput(
  input: unknown
): asserts input is RecordTrainingTrialInput {
  const result = validateRecordTrainingTrialInput(input);
  if (!result.valid) {
    throw new Error(result.errors.join('; '));
  }
}

export function assertValidTrainingSession(
  input: unknown
): asserts input is TrainingSession {
  const result = validateTrainingSession(input);
  if (!result.valid) {
    throw new Error(result.errors.join('; '));
  }
}

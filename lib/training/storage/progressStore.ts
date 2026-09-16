/**
 * تخزين تقدم التدريب — localStorage / TRAINING_STORAGE.progress
 */

import { TRAINING_STORAGE } from '@/lib/tracks/storageKeys';
import type { TrainingProgress } from '@/lib/training/types';
import {
  getTrainingStorageAdapter,
  readJsonArray,
  writeJsonArray,
} from '@/lib/training/storage/adapter';
import { TRAINING_STORAGE_LIMITS } from '@/lib/training/storage/constants';
import {
  sanitizeTrainingProgress,
  trainingProgressKey,
  validateTrainingProgress,
} from '@/lib/training/storage/validateStored';

const KEY = TRAINING_STORAGE.progress;

function readAll(): TrainingProgress[] {
  return readJsonArray(
    getTrainingStorageAdapter(),
    KEY,
    sanitizeTrainingProgress
  );
}

function writeAll(progressItems: TrainingProgress[]) {
  writeJsonArray(
    getTrainingStorageAdapter(),
    KEY,
    progressItems,
    TRAINING_STORAGE_LIMITS.progress
  );
}

export function listTrainingProgress(childId?: string): TrainingProgress[] {
  const all = readAll();
  if (!childId) return all;
  return all.filter((item) => item.childId === childId);
}

export function getTrainingProgress(
  childId: string,
  chapterId: string,
  mediaId: string
): TrainingProgress | null {
  const key = trainingProgressKey({ childId, chapterId, mediaId });
  return (
    readAll().find((item) => trainingProgressKey(item) === key) ?? null
  );
}

export function saveTrainingProgress(
  progress: TrainingProgress
): TrainingProgress {
  const validation = validateTrainingProgress(progress);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  const items = readAll();
  const key = trainingProgressKey(progress);
  const index = items.findIndex((item) => trainingProgressKey(item) === key);
  if (index >= 0) {
    items[index] = progress;
  } else {
    items.unshift(progress);
  }
  writeAll(items);
  return progress;
}

export function deleteTrainingProgress(
  childId: string,
  chapterId: string,
  mediaId: string
): boolean {
  const key = trainingProgressKey({ childId, chapterId, mediaId });
  const items = readAll();
  const next = items.filter((item) => trainingProgressKey(item) !== key);
  if (next.length === items.length) return false;
  writeAll(next);
  return true;
}

export function clearTrainingProgress() {
  getTrainingStorageAdapter().removeItem(KEY);
}

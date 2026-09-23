/**
 * تخزين جلسات التدريب — localStorage / TRAINING_STORAGE.sessions
 */

import { TRAINING_STORAGE } from '@/lib/tracks/storageKeys';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';
import {
  getTrainingStorageAdapter,
  readJsonArray,
  writeJsonArray,
} from '@/lib/training/storage/adapter';
import { TRAINING_STORAGE_LIMITS } from '@/lib/training/storage/constants';
import {
  sanitizeStoredTrainingSession,
  validateStoredTrainingSession,
} from '@/lib/training/storage/validateStored';

const KEY = TRAINING_STORAGE.sessions;

function readAll(): TrainingSessionRuntime[] {
  return readJsonArray(
    getTrainingStorageAdapter(),
    KEY,
    sanitizeStoredTrainingSession
  );
}

function writeAll(sessions: TrainingSessionRuntime[]) {
  writeJsonArray(
    getTrainingStorageAdapter(),
    KEY,
    sessions,
    TRAINING_STORAGE_LIMITS.sessions
  );
}

export function listTrainingSessions(childId?: string): TrainingSessionRuntime[] {
  const all = readAll();
  if (!childId) return all;
  return all.filter((session) => session.childId === childId);
}

export function getTrainingSession(id: string): TrainingSessionRuntime | null {
  return readAll().find((session) => session.id === id) ?? null;
}

export function saveTrainingSession(
  session: TrainingSessionRuntime
): TrainingSessionRuntime {
  const validation = validateStoredTrainingSession(session);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  const sessions = readAll();
  const index = sessions.findIndex((item) => item.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  writeAll(sessions);
  return session;
}

export function deleteTrainingSession(id: string): boolean {
  const sessions = readAll();
  const next = sessions.filter((session) => session.id !== id);
  if (next.length === sessions.length) return false;
  writeAll(next);
  return true;
}

export function clearTrainingSessions() {
  getTrainingStorageAdapter().removeItem(KEY);
}

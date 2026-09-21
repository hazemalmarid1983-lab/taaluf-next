/**
 * Ledger: side effects applied per completed session.id (localStorage, no transactions).
 */

import { TRAINING_STORAGE } from '@/lib/tracks/storageKeys';
import {
  getTrainingStorageAdapter,
  readJsonArray,
  writeJsonArray,
} from '@/lib/training/storage/adapter';

const KEY = `${TRAINING_STORAGE.sessions}.completionApply.v1`;

export type CompletionApplyRecord = {
  sessionId: string;
  progressApplied: boolean;
  goalsApplied: boolean;
  planAdvanceApplied: boolean;
};

function readAll(): CompletionApplyRecord[] {
  return readJsonArray(
    getTrainingStorageAdapter(),
    KEY,
    (input): CompletionApplyRecord | null => {
      if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        return null;
      }
      const row = input as Record<string, unknown>;
      const sessionId = row.sessionId;
      if (typeof sessionId !== 'string' || !sessionId.trim()) return null;
      return {
        sessionId,
        progressApplied: row.progressApplied === true,
        goalsApplied: row.goalsApplied === true,
        planAdvanceApplied: row.planAdvanceApplied === true,
      };
    }
  );
}

function writeAll(records: CompletionApplyRecord[]) {
  writeJsonArray(getTrainingStorageAdapter(), KEY, records, 500);
}

export function getCompletionApplyRecord(
  sessionId: string
): CompletionApplyRecord | null {
  return readAll().find((item) => item.sessionId === sessionId) ?? null;
}

function upsertRecord(
  sessionId: string,
  patch: Partial<Omit<CompletionApplyRecord, 'sessionId'>>
): CompletionApplyRecord {
  const records = readAll();
  const index = records.findIndex((item) => item.sessionId === sessionId);
  const base: CompletionApplyRecord =
    index >= 0
      ? records[index]!
      : {
          sessionId,
          progressApplied: false,
          goalsApplied: false,
          planAdvanceApplied: false,
        };
  const next: CompletionApplyRecord = { ...base, ...patch, sessionId };
  if (index >= 0) {
    records[index] = next;
  } else {
    records.unshift(next);
  }
  writeAll(records);
  return next;
}

export function markCompletionProgressApplied(sessionId: string): void {
  upsertRecord(sessionId, { progressApplied: true });
}

export function markCompletionGoalsApplied(sessionId: string): void {
  upsertRecord(sessionId, { goalsApplied: true });
}

export function markCompletionPlanAdvanceApplied(sessionId: string): void {
  upsertRecord(sessionId, { planAdvanceApplied: true });
}

export function ensureCompletionApplyRecord(
  sessionId: string
): CompletionApplyRecord {
  const existing = getCompletionApplyRecord(sessionId);
  if (existing) return existing;
  return upsertRecord(sessionId, {});
}

export function clearCompletionApplyRecords() {
  getTrainingStorageAdapter().removeItem(KEY);
}

/** Legacy sessions persisted before PR-01 — no ledger row. */
export function inferLegacyCompletionFullyApplied(
  sessionId: string,
  storedCompleted: boolean
): boolean {
  if (getCompletionApplyRecord(sessionId)) return false;
  return storedCompleted;
}

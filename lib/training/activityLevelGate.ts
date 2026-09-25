/**
 * تخزين مستوى الوسيلة. الحساب نفسه في masteryEngine.checkLevelMastery.
 */

import { getTrainingStorageAdapter } from '@/lib/training/storage/adapter';
import {
  ACTIVITY_LEVEL_MAX,
  ACTIVITY_LEVEL_MIN,
  initialActivityLevelRecord,
  type ActivityLevelRecord,
  type MasteryTrialResult,
} from '@/lib/training/masteryEngine';

const STORAGE_KEY = 'taaluf.activityLevel.v2';

export type { ActivityLevelRecord, MasteryTrialResult };
export {
  ACTIVITY_LEVEL_MAX,
  ACTIVITY_LEVEL_MIN,
  checkLevelMastery,
  initialActivityLevelRecord,
  INDEPENDENT_SESSIONS_TO_UNLOCK,
  isFullyIndependentSession,
} from '@/lib/training/masteryEngine';

type StoredMap = Record<string, ActivityLevelRecord>;

function storageKey(childId: string, mediaId: string): string {
  return `${childId}:${mediaId}`;
}

function readMap(): StoredMap {
  const raw = getTrainingStorageAdapter().getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as StoredMap;
  } catch {
    return {};
  }
}

function writeMap(map: StoredMap) {
  getTrainingStorageAdapter().setItem(STORAGE_KEY, JSON.stringify(map));
}

function clampLevel(level: number): number {
  return Math.min(ACTIVITY_LEVEL_MAX, Math.max(ACTIVITY_LEVEL_MIN, Math.floor(level)));
}

function sanitize(value: unknown): ActivityLevelRecord | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<ActivityLevelRecord>;
  if (typeof row.level !== 'number') return null;
  return {
    level: clampLevel(row.level),
    consecutiveIndependentSessions:
      typeof row.consecutiveIndependentSessions === 'number'
        ? Math.max(0, Math.floor(row.consecutiveIndependentSessions))
        : 0,
  };
}

export function readActivityLevel(
  childId: string,
  mediaId: string
): ActivityLevelRecord {
  return sanitize(readMap()[storageKey(childId, mediaId)]) ?? initialActivityLevelRecord();
}

export function saveActivityLevel(
  childId: string,
  mediaId: string,
  record: ActivityLevelRecord
) {
  const map = readMap();
  map[storageKey(childId, mediaId)] = record;
  writeMap(map);
}

export function loadStoredActivityLevel(input: {
  childId: string;
  mediaId: string;
}): ActivityLevelRecord {
  return readActivityLevel(input.childId, input.mediaId);
}

/**
 * تدرّج مستوى الوسيلة.
 * المستوى الأعلى لا يُفتح إلا بعد 3 إجابات صحيحة باستقلال تام متتالية،
 * أو بعد إتقان مسجّل سابقاً على تقدم الوسيلة (مرة واحدة).
 * المساعدة أو الخطأ يبقيان التدريب في المستوى الحالي.
 * هذا قفل تقدّم داخل الوسيلة، وليس قرار إتقان معياري سريري ولا تشخيصاً.
 */

import { getTrainingProgress } from '@/lib/training/storage/progressStore';
import { getTrainingStorageAdapter } from '@/lib/training/storage/adapter';

export const ACTIVITY_LEVEL_MIN = 1;
export const ACTIVITY_LEVEL_MAX = 6;
export const INDEPENDENT_STREAK_TO_UNLOCK = 3;

const STORAGE_KEY = 'taaluf.activityLevel.v1';

export type ActivityLevelRecord = {
  level: number;
  independentStreak: number;
  criterionUnlockApplied: boolean;
};

export type ActivityLevelAttempt = {
  correct: boolean;
  promptLevel: string;
  criterionMastered?: boolean;
};

export function initialActivityLevelRecord(): ActivityLevelRecord {
  return { level: ACTIVITY_LEVEL_MIN, independentStreak: 0, criterionUnlockApplied: false };
}

export function isIndependentSuccess(attempt: {
  correct: boolean;
  promptLevel: string;
}): boolean {
  return attempt.correct && attempt.promptLevel === 'independent';
}

function clampLevel(level: number, maxLevel: number): number {
  return Math.min(maxLevel, Math.max(ACTIVITY_LEVEL_MIN, Math.floor(level)));
}

export function applyActivityLevelAttempt(
  state: ActivityLevelRecord,
  attempt: ActivityLevelAttempt,
  maxLevel = ACTIVITY_LEVEL_MAX
): { record: ActivityLevelRecord; advanced: boolean } {
  const ceiling = clampLevel(maxLevel, ACTIVITY_LEVEL_MAX);

  if (attempt.criterionMastered && !state.criterionUnlockApplied) {
    if (state.level < ceiling) {
      return {
        record: {
          level: state.level + 1,
          independentStreak: 0,
          criterionUnlockApplied: true,
        },
        advanced: true,
      };
    }
    return {
      record: { ...state, criterionUnlockApplied: true },
      advanced: false,
    };
  }

  if (!isIndependentSuccess(attempt)) {
    return {
      record: { ...state, independentStreak: 0 },
      advanced: false,
    };
  }

  const streak = state.independentStreak + 1;
  if (streak >= INDEPENDENT_STREAK_TO_UNLOCK && state.level < ceiling) {
    return {
      record: {
        level: state.level + 1,
        independentStreak: 0,
        criterionUnlockApplied: state.criterionUnlockApplied,
      },
      advanced: true,
    };
  }

  return {
    record: {
      ...state,
      independentStreak: state.level < ceiling ? streak : 0,
    },
    advanced: false,
  };
}

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

function sanitize(value: unknown): ActivityLevelRecord | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Partial<ActivityLevelRecord>;
  if (typeof row.level !== 'number') return null;
  return {
    level: clampLevel(row.level, ACTIVITY_LEVEL_MAX),
    independentStreak:
      typeof row.independentStreak === 'number'
        ? Math.max(0, Math.floor(row.independentStreak))
        : 0,
    criterionUnlockApplied: row.criterionUnlockApplied === true,
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
  chapterId?: string;
  maxLevel?: number;
}): ActivityLevelRecord {
  const saved = readActivityLevel(input.childId, input.mediaId);
  const mastered =
    input.chapterId !== undefined &&
    getTrainingProgress(input.childId, input.chapterId, input.mediaId)?.masteryLevel ===
      'mastered';
  if (!mastered) return saved;
  const next = applyActivityLevelAttempt(
    saved,
    { correct: false, promptLevel: 'no_response', criterionMastered: true },
    input.maxLevel
  );
  if (next.advanced || next.record.criterionUnlockApplied !== saved.criterionUnlockApplied) {
    saveActivityLevel(input.childId, input.mediaId, next.record);
  }
  return next.record;
}

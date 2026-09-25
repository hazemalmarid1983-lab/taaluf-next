/**
 * قانون التدرّج الموحّد لكل الوسائل.
 * الجلسة الكاملة = كل محاولات التمرين معاً، مهما كان عددها.
 * تُحسب جلسة مستقلة فقط إذا سُجّل «استقلال تام» في كل محاولة.
 * الترفيع يحتاج 3 جلسات كاملة متتالية بهذا الشرط، في اليوم نفسه أو في أيام لاحقة.
 * أي مساعدة أو عدم استجابة داخل الجلسة يعيد العداد إلى صفر ويبقي المستوى.
 * هذا قفل فتح المستوى داخل الوسيلة، وليس حكم إتقان معياري سريري ولا تشخيصاً.
 */

export const ACTIVITY_LEVEL_MIN = 1;
export const ACTIVITY_LEVEL_MAX = 6;
export const INDEPENDENT_SESSIONS_TO_UNLOCK = 3;

export type MasteryTrialResult = {
  promptLevel: string;
};

export type ActivityLevelRecord = {
  level: number;
  consecutiveIndependentSessions: number;
};

export type LevelMasteryDecision = {
  record: ActivityLevelRecord;
  advanced: boolean;
  sessionIndependent: boolean;
};

export function initialActivityLevelRecord(): ActivityLevelRecord {
  return {
    level: ACTIVITY_LEVEL_MIN,
    consecutiveIndependentSessions: 0,
  };
}

/** استقلال تام فقط. المساعدة اللفظية أو الجسدية أو عدم الاستجابة تُسقط الجلسة. */
export function isFullyIndependentSession(
  sessionResults: ReadonlyArray<MasteryTrialResult>
): boolean {
  if (sessionResults.length === 0) return false;
  return sessionResults.every((trial) => trial.promptLevel === 'independent');
}

function clampLevel(level: number, maxLevel: number): number {
  return Math.min(maxLevel, Math.max(ACTIVITY_LEVEL_MIN, Math.floor(level)));
}

/**
 * يطبّق نتيجة جلسة كاملة على عداد الترفيع.
 * sessionResults هي محاولات الجلسة بعد إنهائها كلها.
 */
export function checkLevelMastery(
  sessionResults: ReadonlyArray<MasteryTrialResult>,
  state: ActivityLevelRecord = initialActivityLevelRecord(),
  maxLevel = ACTIVITY_LEVEL_MAX
): LevelMasteryDecision {
  const ceiling = clampLevel(maxLevel, ACTIVITY_LEVEL_MAX);
  const level = clampLevel(state.level, ceiling);
  const sessionIndependent = isFullyIndependentSession(sessionResults);

  if (!sessionIndependent) {
    return {
      record: { level, consecutiveIndependentSessions: 0 },
      advanced: false,
      sessionIndependent: false,
    };
  }

  if (level >= ceiling) {
    return {
      record: { level: ceiling, consecutiveIndependentSessions: 0 },
      advanced: false,
      sessionIndependent: true,
    };
  }

  const consecutiveIndependentSessions = state.consecutiveIndependentSessions + 1;
  if (consecutiveIndependentSessions >= INDEPENDENT_SESSIONS_TO_UNLOCK) {
    return {
      record: {
        level: level + 1,
        consecutiveIndependentSessions: 0,
      },
      advanced: true,
      sessionIndependent: true,
    };
  }

  return {
    record: { level, consecutiveIndependentSessions },
    advanced: false,
    sessionIndependent: true,
  };
}

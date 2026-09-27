/**
 * قاعدة الإتقان السريري الموحّدة (CLINICAL_RULES):
 * لا يُعلَن إتقان هدف ولا يُوصى بتصعيده إلا بعد 3 جلسات متتالية
 * باستقلال تام 100% — أي مساعدة (Prompt) أو عدم استجابة في أي محاولة يُسقط الجلسة
 * ويعيد العداد إلى صفر.
 *
 * الحكم يُبنى على علم «استقلال تام» لكل جلسة، لا على نسبة مئوية مقرّبة،
 * لأن 199/200 تُقرَّب إلى 100%.
 */

import {
  INDEPENDENT_SESSIONS_TO_UNLOCK,
  isFullyIndependentSession,
  type MasteryTrialResult,
} from '@/lib/training/masteryEngine';

export const CLINICAL_MASTERY_CONSECUTIVE_SESSIONS = INDEPENDENT_SESSIONS_TO_UNLOCK;
export const CLINICAL_MASTERY_INDEPENDENCE_PERCENT = 100;

export type ClinicalSessionEvidence = {
  fullyIndependent?: boolean;
};

export { isFullyIndependentSession };

export function isFullyIndependentCounts(
  independentCount: number,
  totalTrials: number
): boolean {
  return totalTrials > 0 && independentCount === totalTrials;
}

/** عدد الجلسات المستقلة تماماً المتتالية في نهاية السجل (مرتّب زمنياً) */
export function trailingIndependentStreak(
  sessions: ReadonlyArray<ClinicalSessionEvidence>
): number {
  let streak = 0;
  for (let i = sessions.length - 1; i >= 0; i -= 1) {
    if (sessions[i].fullyIndependent !== true) break;
    streak += 1;
  }
  return streak;
}

export function nextIndependentStreak(
  previousStreak: number,
  sessionTrials: ReadonlyArray<MasteryTrialResult>
): number {
  return isFullyIndependentSession(sessionTrials)
    ? Math.max(0, Math.floor(previousStreak)) + 1
    : 0;
}

export function meetsClinicalMastery(streak: number): boolean {
  return streak >= CLINICAL_MASTERY_CONSECUTIVE_SESSIONS;
}

export function hasClinicalMastery(
  sessions: ReadonlyArray<ClinicalSessionEvidence>
): boolean {
  return meetsClinicalMastery(trailingIndependentStreak(sessions));
}

/**
 * مؤقت صرف المعزز وبطاقة الإنجاز — منطق خالص قابل للاختبار.
 */

import type { HomeSessionSummary, MasteryBand } from './homeClassroomEngine';
import { summarizePromptLevels, type PromptBreakdown } from './promptHierarchy';

export type ReinforcerReward = {
  emoji: string;
  labelAr: string;
  labelEn: string;
};

export const REINFORCER_DURATION_MINUTES = [2, 5] as const;

export type ReinforcerDurationMinutes =
  (typeof REINFORCER_DURATION_MINUTES)[number];

export function formatReinforcerClock(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** عبارة «حان وقت …» بصيغة طبيعية للنطق والعرض */
export function reinforcerDeliveryPhrase(reward: ReinforcerReward, isAr: boolean) {
  const label = isAr ? reward.labelAr : reward.labelEn;
  return isAr ? `حان وقت ${label}` : `Time for ${label}`;
}

export function reinforcerCelebrationLine(reward: ReinforcerReward, isAr: boolean) {
  return isAr
    ? `أحسنت! أنهيت التدريب — ${reinforcerDeliveryPhrase(reward, true)} ${reward.emoji}`
    : `Well done! Training is complete — ${reinforcerDeliveryPhrase(reward, false)} ${reward.emoji}`;
}

/** 1–5 نجوم حسب نسبة الاستقلالية */
export function milestoneStarCount(masteryPercentage: number) {
  if (masteryPercentage >= 90) return 5;
  if (masteryPercentage >= 75) return 4;
  if (masteryPercentage >= 55) return 3;
  if (masteryPercentage >= 35) return 2;
  if (masteryPercentage > 0) return 1;
  return 0;
}

export function milestoneBadge(band: MasteryBand, isAr: boolean) {
  switch (band) {
    case 'mastered':
      return {
        emoji: '🏆',
        label: isAr ? 'نجم الجلسة' : 'Session star',
      };
    case 'emerging':
      return {
        emoji: '🌱',
        label: isAr ? 'في تقدّم' : 'Growing skill',
      };
    default:
      return {
        emoji: '💪',
        label: isAr ? 'محاولة شجاعة' : 'Brave effort',
      };
  }
}

export function buildMilestoneShareText(
  summary: Pick<
    HomeSessionSummary,
    | 'goalTitleAr'
    | 'masteryPercentage'
    | 'independentCount'
    | 'totalTrials'
    | 'sessionDate'
  >,
  childName: string | undefined,
  promptBreakdown: PromptBreakdown | undefined,
  isAr: boolean
) {
  const name = childName?.trim() || (isAr ? 'الطفل' : 'the child');
  const promptLine = promptBreakdown
    ? summarizePromptLevels(promptBreakdown, isAr)
    : '';
  const date = new Date(summary.sessionDate).toLocaleDateString(
    isAr ? 'ar-AE' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );

  if (isAr) {
    return [
      '🎉 إنجاز جلسة تدريب منزلية — تآلف',
      `${name} · ${summary.goalTitleAr}`,
      `الاستقلالية: ${summary.masteryPercentage}% (${summary.independentCount}/${summary.totalTrials} محاولات مستقلة)`,
      promptLine,
      `التاريخ: ${date}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    '🎉 Home training milestone — Taaluf',
    `${name} · ${summary.goalTitleAr}`,
    `Independence: ${summary.masteryPercentage}% (${summary.independentCount}/${summary.totalTrials} independent trials)`,
    promptLine,
    `Date: ${date}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function whatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

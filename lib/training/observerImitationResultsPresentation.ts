/**
 * عرض نتائج جلسات observer-imitation — لغة أداء الجلسة فقط (لا إتقان C15).
 */

export const OBSERVER_IMITATION_SESSION_DISCLAIMER_AR =
  'مؤشرات تدريب هذه الجلسة — لا تُ equated بإتقان معيار C15 في الحياة اليومية. PROVISIONAL DESIGN.';

export const OBSERVER_IMITATION_SESSION_TITLE_AR = 'أداء الطفل في هذه الجلسة';

export function formatObserverImitationSessionSummary(input: {
  accuracy: number;
  independence: number;
  totalTrials: number;
}): string {
  return `مؤشرات التدريب: ${input.totalTrials} محاولات · الدقة ${input.accuracy}% · الاستقلالية ${input.independence}%`;
}

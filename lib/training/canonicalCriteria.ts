/**
 * معايير التقييم المعتمدة لطبقة التدريب.
 * المصدر الوحيد: data/taalof_criteria_v3.json عبر CRITERIA_LIST.
 *
 * ملاحظة: data/taalof_unified_criteria.json ملف legacy لسكربت البناء فقط —
 * لا يُستخدم في وقت التشغيل ولا في trainingCandidates.
 */

import { CRITERIA_LIST, getCriterionById } from '@/types/taalof';

export const CANONICAL_CRITERIA_SOURCE = 'data/taalof_criteria_v3.json';

export const CANONICAL_CRITERIA_IDS = new Set(
  CRITERIA_LIST.map((criterion) => criterion.id)
);

export { getCriterionById };

export function isCanonicalCriterionId(id: string): boolean {
  return CANONICAL_CRITERIA_IDS.has(id);
}

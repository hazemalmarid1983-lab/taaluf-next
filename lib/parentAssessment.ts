import parentData from '@/data/taalof_parent_criteria.json';

export type ParentAnswer = { id: string; value: number };

export type MappedParentScore = {
  criterionId: string;
  score: number;
  source: 'parent';
  parentItemId: string;
};

export const PARENT_ITEMS = parentData.items;
export const PARENT_SCALE = parentData.scale;

/**
 * تحويل إجابات الأهل (0–4) إلى درجات معايير الأخصائي (0–3).
 * الأسئلة الإيجابية (reverse) تُعكس قبل التحويل حتى تبقى الدرجة الأعلى = حاجة دعم أكبر.
 */
export function mapParentToCriteria(
  parentAnswers: ParentAnswer[]
): MappedParentScore[] {
  const byId = new Map(parentAnswers.map((a) => [a.id, a.value]));

  return PARENT_ITEMS.map((item) => {
    const raw = Math.min(4, Math.max(0, Number(byId.get(item.id) ?? 0)));
    const concern04 = item.reverse ? 4 - raw : raw;
    const score = Math.min(3, Math.max(0, Math.round(concern04 * 0.75)));
    return {
      criterionId: item.mappedCriterion,
      score,
      source: 'parent' as const,
      parentItemId: item.id,
    };
  });
}

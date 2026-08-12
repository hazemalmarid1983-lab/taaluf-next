import parentData from '@/data/taalof_parent_criteria.json';

export type ParentAnswer = { id: string; value: number };

export type MappedParentScore = {
  criterionId: string;
  score: number;
  source: 'parent';
  parentItemId: string;
};

export type ParentOption = {
  score: number;
  label: string;
  description: string;
};

export type ParentItem = {
  id: string;
  question?: string;
  text: string;
  mappedCriterion: string;
  domain: string;
  is_reverse?: boolean;
  reverse?: boolean;
  options?: ParentOption[];
};

export const PARENT_ITEMS = parentData.items as ParentItem[];
export const PARENT_SCALE = parentData.scale;

/**
 * تحويل إجابات الأهل (0–3 موحّد) إلى درجات معايير الأخصائي (0–3).
 * الخيارات مكتوبة أصلاً من مستقر→شديد جداً؛ لا حاجة لعكس الدرجة.
 */
export function mapParentToCriteria(
  parentAnswers: ParentAnswer[]
): MappedParentScore[] {
  const byId = new Map(parentAnswers.map((a) => [a.id, a.value]));

  return PARENT_ITEMS.map((item) => {
    const raw = Math.min(3, Math.max(0, Number(byId.get(item.id) ?? 0)));
    return {
      criterionId: item.mappedCriterion,
      score: raw,
      source: 'parent' as const,
      parentItemId: item.id,
    };
  });
}

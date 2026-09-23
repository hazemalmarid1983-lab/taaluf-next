/**
 * C15 — تصنيف المهارات (منهجي، Pass 01).
 *
 * Target Skills (ماذا يقلد الطفل؟) → assignment.skillIds / Plan Builder فقط.
 * Progression Dimensions (كيف يُدرَّب؟) → metadata في الفصل؛ لا تدخل skillIds الجديدة.
 *
 * S4/S5 ليسا protocol منفذًا سريريًا في المحرك بعد.
 */

export const C15_TARGET_SKILL_IDS = [
  'skill-c15-s1-gross',
  'skill-c15-s2-fine',
  'skill-c15-s3-social',
] as const;

export const C15_PROGRESSION_DIMENSION_SKILL_IDS = [
  'skill-c15-s4-replay',
  'skill-c15-s5-fading',
] as const;

export type C15TargetSkillId = (typeof C15_TARGET_SKILL_IDS)[number];
export type C15ProgressionDimensionSkillId =
  (typeof C15_PROGRESSION_DIMENSION_SKILL_IDS)[number];

const TARGET_SET = new Set<string>(C15_TARGET_SKILL_IDS);
const PROGRESSION_SET = new Set<string>(C15_PROGRESSION_DIMENSION_SKILL_IDS);

export function isC15TargetSkillId(skillId: string): skillId is C15TargetSkillId {
  return TARGET_SET.has(skillId);
}

export function isC15ProgressionDimensionSkillId(
  skillId: string
): skillId is C15ProgressionDimensionSkillId {
  return PROGRESSION_SET.has(skillId);
}

/** مهارات target القابلة للحفظ في assignment.skillIds لوسيلة C15 */
export function filterObserverImitationTargetSkillIds(
  skillIds: string[] | undefined
): string[] | undefined {
  if (!skillIds?.length) return undefined;
  const filtered = [...new Set(skillIds)].filter((id) => isC15TargetSkillId(id));
  return filtered.length > 0 ? filtered : undefined;
}

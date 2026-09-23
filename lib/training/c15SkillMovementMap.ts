/**
 * C15 Pass 02 — ربط Target Skills بحركات observer-imitation.
 * S4/S5 لا يدخلان في اختيار الحركة (Progression Dimensions فقط).
 */

import {
  C15_TARGET_SKILL_IDS,
  filterObserverImitationTargetSkillIds,
  type C15TargetSkillId,
} from '@/lib/training/c15SkillClassification';

export const C15_SKILL_MOVEMENT_IDS: Record<
  C15TargetSkillId,
  readonly string[]
> = {
  'skill-c15-s1-gross': ['hands_up', 'clap', 'wave'],
  'skill-c15-s2-fine': ['touch_nose', 'touch_head'],
  'skill-c15-s3-social': ['smile'],
};

/** اتحاد movementIds للمهارات target المختارة — ترتيب ثابت للاختبار */
export function resolveMovementIdsForC15TargetSkills(
  skillIds: string[]
): string[] {
  const targets = filterObserverImitationTargetSkillIds(skillIds);
  if (!targets?.length) {
    return [];
  }

  const ordered: string[] = [];
  const seen = new Set<string>();

  for (const targetId of C15_TARGET_SKILL_IDS) {
    if (!targets.includes(targetId)) continue;
    for (const movementId of C15_SKILL_MOVEMENT_IDS[targetId]) {
      if (!seen.has(movementId)) {
        seen.add(movementId);
        ordered.push(movementId);
      }
    }
  }

  return ordered;
}

export function isMovementAllowedForC15TargetSkills(
  movementId: string,
  skillIds: string[] | undefined
): boolean {
  const pool = skillIds?.length
    ? resolveMovementIdsForC15TargetSkills(skillIds)
    : null;

  if (!pool?.length) {
    // Legacy: no target skills → لا يقيّد pool (الفصل/الصعوبة)
    return true;
  }

  return pool.includes(movementId);
}

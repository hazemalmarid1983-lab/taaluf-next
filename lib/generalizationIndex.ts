/**
 * مؤشر درجة التعميم المركّب (Generalization Index).
 *
 * - المجس ناجح عند استقلالية ≥ 80%، ويُحتسب فقط إذا اختبر ظرفاً جديداً فعلاً:
 *   الشخص ≠ الأخصائي الأساسي، المكان ≠ العيادة، المادة جديدة (is_novel_material).
 * - الأشخاص: 3 أشخاص مختلفين = 100%. الأماكن: 3 أماكن مختلفة = 100%.
 *   المواد: 3 تجارب ناجحة بمواد جديدة = 100%.
 * - المؤشر = 0.34 × الأشخاص + 0.33 × الأماكن + 0.33 × المواد.
 *   ≥85 معمَّم بالكامل، ≥50 تعميم جزئي، وإلا غير معمَّم.
 */

import type {
  GeneralizationDimension,
  GeneralizationIndexResult,
  GeneralizationProbe,
  GeneralizationStatus,
} from '@/types/clinical';

export type {
  GeneralizationDimension,
  GeneralizationIndexResult,
  GeneralizationProbe,
  GeneralizationStatus,
};

export const GENERALIZATION_FULL_THRESHOLD = 85;
export const GENERALIZATION_PARTIAL_THRESHOLD = 50;
export const GENERALIZATION_PROBE_SUCCESS_PCT = 80;
export const GENERALIZATION_DISTINCT_TARGET = 3;
export const GENERALIZATION_WEIGHTS: Record<GeneralizationDimension, number> = {
  person: 0.34,
  place: 0.33,
  material_stimulus: 0.33,
};

export function probeTestsNovelCondition(probe: GeneralizationProbe): boolean {
  switch (probe.dimension) {
    case 'person':
      return Boolean(probe.details.person_type) && probe.details.person_type !== 'primary_specialist';
    case 'place':
      return Boolean(probe.details.setting) && probe.details.setting !== 'clinic';
    case 'material_stimulus':
      return probe.details.is_novel_material === true;
    default:
      return false;
  }
}

export function generalizationStatus(index: number): GeneralizationStatus {
  if (index >= GENERALIZATION_FULL_THRESHOLD) return 'معمَّم بالكامل ✅';
  if (index >= GENERALIZATION_PARTIAL_THRESHOLD) return 'تعميم جزئي ⚠️';
  return 'غير معمَّم بعد ❌ (مقتصر على بيئة التدريب)';
}

function coverage(count: number): number {
  return Math.min(count / GENERALIZATION_DISTINCT_TARGET, 1) * 100;
}

export function calculateGeneralizationIndex(
  probes: ReadonlyArray<GeneralizationProbe>,
  goalId?: string
): GeneralizationIndexResult {
  const successful = (goalId ? probes.filter((p) => p.goal_id === goalId) : probes).filter(
    (p) => p.independence_pct >= GENERALIZATION_PROBE_SUCCESS_PCT && probeTestsNovelCondition(p)
  );

  const distinctPersons = new Set(
    successful
      .filter((p) => p.dimension === 'person')
      .map((p) => p.details.person_id || p.details.person_type)
      .filter(Boolean)
  ).size;
  const distinctSettings = new Set(
    successful
      .filter((p) => p.dimension === 'place')
      .map((p) => p.details.setting)
      .filter(Boolean)
  ).size;
  const novelMaterialSuccesses = successful.filter(
    (p) => p.dimension === 'material_stimulus'
  ).length;

  const scores: Record<GeneralizationDimension, number> = {
    person: coverage(distinctPersons),
    place: coverage(distinctSettings),
    material_stimulus: coverage(novelMaterialSuccesses),
  };
  const index = Math.round(
    scores.person * GENERALIZATION_WEIGHTS.person +
      scores.place * GENERALIZATION_WEIGHTS.place +
      scores.material_stimulus * GENERALIZATION_WEIGHTS.material_stimulus
  );
  const weak = (['person', 'place', 'material_stimulus'] as const).reduce((min, d) =>
    scores[d] < scores[min] ? d : min
  );

  return {
    generalization_index: index,
    gen_status: generalizationStatus(index),
    breakdown: {
      person_score: Math.round(scores.person),
      place_score: Math.round(scores.place),
      material_score: Math.round(scores.material_stimulus),
    },
    weak_dimension: weak,
  };
}

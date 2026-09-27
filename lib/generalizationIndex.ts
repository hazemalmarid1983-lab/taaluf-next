/**
 * مؤشر التعميم: هل تنتقل المهارة المتقنة خارج ظروف التدريب؟
 *
 * الصيغة (مقترح موثّق للمراجعة العلمية):
 * - ثلاثة أبعاد بأوزان متساوية: الشخص، المكان، المادة/المثير.
 * - درجة البعد = متوسط independence_pct لمجسات التعميم المؤهلة في هذا البعد؛
 *   بعد بلا مجسات مؤهلة = 0.
 * - المجس مؤهل فقط إذا اختبر ظرفاً جديداً فعلاً:
 *   الشخص ≠ الأخصائي الأساسي، المكان ≠ العيادة، المادة جديدة (is_novel_material).
 * - المؤشر = متوسط الأبعاد الثلاثة. ≥85 معمَّم بالكامل، ≥50 تعميم جزئي، وإلا غير معمَّم.
 */

export interface GeneralizationProbe {
  probe_id: string;
  goal_id: string;
  date: string;
  dimension: 'person' | 'place' | 'material_stimulus';
  details: {
    person_type?: 'primary_specialist' | 'secondary_specialist' | 'parent' | 'teacher' | 'peer';
    person_id?: string;
    setting?: 'clinic' | 'home' | 'school' | 'public_place';
    material_used?: string;
    is_novel_material?: boolean;
  };
  independence_pct: number;
  prompt_level: 'Independent' | 'Verbal' | 'Gestural' | 'Partial Physical' | 'Full Physical';
  is_first_trial_cold_probe: boolean;
  mood_state?: string;
  reported_by: 'professional' | 'parent_report';
  notes?: string;
}

export type GeneralizationStatus =
  | 'معمَّم بالكامل ✅'
  | 'تعميم جزئي ⚠️'
  | 'غير معمَّم بعد ❌ (مقتصر على بيئة التدريب)';

export type GeneralizationDimension = GeneralizationProbe['dimension'];

export interface GeneralizationIndexResult {
  generalization_index: number;
  gen_status: GeneralizationStatus;
  breakdown: {
    person_score: number;
    place_score: number;
    material_score: number;
  };
  weak_dimension: GeneralizationDimension;
}

export const GENERALIZATION_FULL_THRESHOLD = 85;
export const GENERALIZATION_PARTIAL_THRESHOLD = 50;

const DIMENSIONS: GeneralizationDimension[] = ['person', 'place', 'material_stimulus'];

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

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function dimensionScore(
  probes: ReadonlyArray<GeneralizationProbe>,
  dimension: GeneralizationDimension
): number {
  const eligible = probes.filter((p) => p.dimension === dimension && probeTestsNovelCondition(p));
  if (eligible.length === 0) return 0;
  const sum = eligible.reduce((acc, p) => acc + clampPct(p.independence_pct), 0);
  return Math.round(sum / eligible.length);
}

export function generalizationStatus(index: number): GeneralizationStatus {
  if (index >= GENERALIZATION_FULL_THRESHOLD) return 'معمَّم بالكامل ✅';
  if (index >= GENERALIZATION_PARTIAL_THRESHOLD) return 'تعميم جزئي ⚠️';
  return 'غير معمَّم بعد ❌ (مقتصر على بيئة التدريب)';
}

export function calculateGeneralizationIndex(
  probes: ReadonlyArray<GeneralizationProbe>,
  goalId?: string
): GeneralizationIndexResult {
  const scoped = goalId ? probes.filter((p) => p.goal_id === goalId) : probes;
  const scores: Record<GeneralizationDimension, number> = {
    person: dimensionScore(scoped, 'person'),
    place: dimensionScore(scoped, 'place'),
    material_stimulus: dimensionScore(scoped, 'material_stimulus'),
  };
  const index = Math.round(
    (scores.person + scores.place + scores.material_stimulus) / DIMENSIONS.length
  );
  const weak = DIMENSIONS.reduce((min, d) => (scores[d] < scores[min] ? d : min), DIMENSIONS[0]);

  return {
    generalization_index: index,
    gen_status: generalizationStatus(index),
    breakdown: {
      person_score: scores.person,
      place_score: scores.place,
      material_score: scores.material_stimulus,
    },
    weak_dimension: weak,
  };
}

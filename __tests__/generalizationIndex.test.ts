import type { TrackedGoal } from '../lib/goalsEngine';
import {
  GENERALIZATION_FULL_THRESHOLD,
  GENERALIZATION_PARTIAL_THRESHOLD,
  GENERALIZATION_PROBE_SUCCESS_PCT,
  GENERALIZATION_WEIGHTS,
  calculateGeneralizationIndex,
  generalizationStatus,
  probeTestsNovelCondition,
  type GeneralizationProbe,
} from '../lib/generalizationIndex';
import { summarizeGoalTracking } from '../lib/progressTracker';

let seq = 0;
const probe = (
  dimension: GeneralizationProbe['dimension'],
  independence_pct: number,
  details: GeneralizationProbe['details'],
  goal_id = 'g'
): GeneralizationProbe => {
  seq += 1;
  return {
    probe_id: `p${seq}`,
    goal_id,
    date: '2026-03-01',
    dimension,
    details,
    independence_pct,
    prompt_level: independence_pct === 100 ? 'Independent' : 'Verbal',
    is_first_trial_cold_probe: true,
    reported_by: 'professional',
  };
};
const person = (id: string, pct = 90, goal?: string) =>
  probe('person', pct, { person_type: 'teacher', person_id: id }, goal);
const place = (setting: 'home' | 'school' | 'public_place' | 'clinic', pct = 90, goal?: string) =>
  probe('place', pct, { setting }, goal);
const material = (pct = 90, goal?: string) =>
  probe('material_stimulus', pct, { is_novel_material: true, material_used: 'x' }, goal);

const FULL = [
  person('a'),
  person('b'),
  person('c'),
  place('home'),
  place('school'),
  place('public_place'),
  material(),
  material(),
  material(),
];

describe('generalization index formula', () => {
  it('uses the approved constants', () => {
    expect(GENERALIZATION_FULL_THRESHOLD).toBe(85);
    expect(GENERALIZATION_PARTIAL_THRESHOLD).toBe(50);
    expect(GENERALIZATION_PROBE_SUCCESS_PCT).toBe(80);
    expect(GENERALIZATION_WEIGHTS).toEqual({ person: 0.34, place: 0.33, material_stimulus: 0.33 });
  });

  it('maps the index to status at 85 / 50', () => {
    expect(generalizationStatus(85)).toBe('معمَّم بالكامل ✅');
    expect(generalizationStatus(84)).toBe('تعميم جزئي ⚠️');
    expect(generalizationStatus(50)).toBe('تعميم جزئي ⚠️');
    expect(generalizationStatus(49)).toBe('غير معمَّم بعد ❌ (مقتصر على بيئة التدريب)');
  });

  it('reaches 100 with three distinct successes in every dimension', () => {
    const result = calculateGeneralizationIndex(FULL);
    expect(result.breakdown).toEqual({ person_score: 100, place_score: 100, material_score: 100 });
    expect(result.generalization_index).toBe(100);
    expect(result.gen_status).toBe('معمَّم بالكامل ✅');
  });

  it('scores each dimension by distinct successes out of three', () => {
    const result = calculateGeneralizationIndex([person('a'), person('a'), place('home'), place('school')]);
    expect(result.breakdown).toEqual({ person_score: 33, place_score: 67, material_score: 0 });
    expect(result.generalization_index).toBe(Math.round((100 / 3) * 0.34 + (200 / 3) * 0.33));
    expect(result.weak_dimension).toBe('material_stimulus');
  });

  it('counts repeated novel-material successes, not distinct materials', () => {
    expect(calculateGeneralizationIndex([material(), material()]).breakdown.material_score).toBe(67);
  });

  it('ignores probes below 80% independence', () => {
    const result = calculateGeneralizationIndex([person('a', 79), place('home', 79), material(79)]);
    expect(result.generalization_index).toBe(0);
    expect(calculateGeneralizationIndex([person('a', 80)]).breakdown.person_score).toBe(33);
  });

  it('ignores probes that do not test a novel condition', () => {
    const primary = probe('person', 100, { person_type: 'primary_specialist', person_id: 'x' });
    const clinic = place('clinic', 100);
    const sameMaterial = probe('material_stimulus', 100, { is_novel_material: false });
    for (const p of [primary, clinic, sameMaterial]) expect(probeTestsNovelCondition(p)).toBe(false);
    expect(calculateGeneralizationIndex([primary, clinic, sameMaterial]).generalization_index).toBe(0);
  });

  it('falls back to person_type when no person_id is given', () => {
    const result = calculateGeneralizationIndex([
      probe('person', 90, { person_type: 'parent' }),
      probe('person', 90, { person_type: 'teacher' }),
      probe('person', 90, { person_type: 'teacher' }),
    ]);
    expect(result.breakdown.person_score).toBe(67);
  });

  it('reports not generalized when there are no probes', () => {
    const result = calculateGeneralizationIndex([]);
    expect(result.generalization_index).toBe(0);
    expect(result.gen_status).toBe('غير معمَّم بعد ❌ (مقتصر على بيئة التدريب)');
    expect(result.weak_dimension).toBe('person');
  });

  it('scopes probes to the requested goal', () => {
    const other = FULL.map((p) => ({ ...p, goal_id: 'other' }));
    expect(calculateGeneralizationIndex([...other, person('a', 90, 'g')], 'g').generalization_index).toBe(
      Math.round((100 / 3) * 0.34)
    );
  });
});

describe('generalization in goal tracking', () => {
  const goal = (id: string): TrackedGoal => ({
    id,
    childId: 'child',
    criterionId: 'C1',
    domain: 'x',
    title: 't',
    smartText: 's',
    baseline: 0,
    target: 30,
    current: 10,
    startDate: '2026-01-01',
    targetDate: '2026-04-01',
    status: 'active',
  });

  it('attaches the index only to goals that have probes', () => {
    const { items } = summarizeGoalTracking(
      [goal('a'), goal('b')],
      FULL.map((p) => ({ ...p, goal_id: 'a' }))
    );
    expect(items[0].generalization?.gen_status).toBe('معمَّم بالكامل ✅');
    expect(items[1].generalization).toBeUndefined();
  });
});

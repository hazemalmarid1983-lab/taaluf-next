import type { TrackedGoal } from '../lib/goalsEngine';
import {
  GENERALIZATION_FULL_THRESHOLD,
  GENERALIZATION_PARTIAL_THRESHOLD,
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
const person = (pct: number, goal?: string) => probe('person', pct, { person_type: 'parent' }, goal);
const place = (pct: number, goal?: string) => probe('place', pct, { setting: 'home' }, goal);
const material = (pct: number, goal?: string) =>
  probe('material_stimulus', pct, { is_novel_material: true }, goal);

describe('generalization index formula', () => {
  it('uses the 85 / 50 cut-offs', () => {
    expect(GENERALIZATION_FULL_THRESHOLD).toBe(85);
    expect(GENERALIZATION_PARTIAL_THRESHOLD).toBe(50);
    expect(generalizationStatus(85)).toBe('معمَّم بالكامل ✅');
    expect(generalizationStatus(84)).toBe('تعميم جزئي ⚠️');
    expect(generalizationStatus(50)).toBe('تعميم جزئي ⚠️');
    expect(generalizationStatus(49)).toBe('غير معمَّم بعد ❌ (مقتصر على بيئة التدريب)');
  });

  it('weights the three dimensions equally', () => {
    const result = calculateGeneralizationIndex([person(90), place(60), material(30)]);
    expect(result.breakdown).toEqual({ person_score: 90, place_score: 60, material_score: 30 });
    expect(result.generalization_index).toBe(60);
    expect(result.gen_status).toBe('تعميم جزئي ⚠️');
    expect(result.weak_dimension).toBe('material_stimulus');
  });

  it('averages multiple probes inside a dimension', () => {
    const result = calculateGeneralizationIndex([
      person(100),
      person(80),
      place(90),
      material(90),
    ]);
    expect(result.breakdown.person_score).toBe(90);
    expect(result.generalization_index).toBe(90);
    expect(result.gen_status).toBe('معمَّم بالكامل ✅');
  });

  it('scores a dimension with no probes as 0 so it cannot be skipped', () => {
    const result = calculateGeneralizationIndex([person(100), place(100)]);
    expect(result.breakdown.material_score).toBe(0);
    expect(result.generalization_index).toBe(67);
    expect(result.gen_status).toBe('تعميم جزئي ⚠️');
    expect(result.weak_dimension).toBe('material_stimulus');
  });

  it('reports not generalized when there are no probes', () => {
    const result = calculateGeneralizationIndex([]);
    expect(result.generalization_index).toBe(0);
    expect(result.gen_status).toBe('غير معمَّم بعد ❌ (مقتصر على بيئة التدريب)');
  });

  it('ignores probes that do not test a novel condition', () => {
    const primary = probe('person', 100, { person_type: 'primary_specialist' });
    const clinic = probe('place', 100, { setting: 'clinic' });
    const sameMaterial = probe('material_stimulus', 100, { is_novel_material: false });
    for (const p of [primary, clinic, sameMaterial]) expect(probeTestsNovelCondition(p)).toBe(false);
    expect(calculateGeneralizationIndex([primary, clinic, sameMaterial]).generalization_index).toBe(0);
  });

  it('clamps out-of-range independence values', () => {
    const result = calculateGeneralizationIndex([person(150), place(-20), material(100)]);
    expect(result.breakdown).toEqual({ person_score: 100, place_score: 0, material_score: 100 });
  });

  it('scopes probes to the requested goal', () => {
    const result = calculateGeneralizationIndex(
      [person(100, 'a'), place(100, 'a'), material(100, 'a'), person(0, 'b')],
      'a'
    );
    expect(result.generalization_index).toBe(100);
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
      [person(90, 'a'), place(90, 'a'), material(90, 'a')]
    );
    expect(items[0].generalization?.gen_status).toBe('معمَّم بالكامل ✅');
    expect(items[1].generalization).toBeUndefined();
  });
});

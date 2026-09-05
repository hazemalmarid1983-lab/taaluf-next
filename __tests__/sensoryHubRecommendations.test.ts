import { recommendSensoryRoomsForGoals } from '../lib/sensoryHubRecommendations';
import type { TrackedGoal } from '../lib/goalsEngine';

describe('sensory hub recommendations', () => {
  const baseGoal = (patch: Partial<TrackedGoal>): TrackedGoal => ({
    id: 'g1',
    childId: 'c1',
    criterionId: 'c1',
    domain: 'التواصل الاستجابي والتعبيري',
    title: 'تحسين النطق',
    smartText: 'نطق ومحاكاة صوتية',
    baseline: 20,
    target: 80,
    current: 30,
    status: 'active',
    sessions: [],
    lastUpdate: '',
    ...patch,
  });

  it('suggests animals for communication goals', () => {
    const recs = recommendSensoryRoomsForGoals([baseGoal({})], 2);
    expect(recs.some((r) => r.id === 'animals')).toBe(true);
  });

  it('suggests tracing and sand for pre-writing goals', () => {
    const recs = recommendSensoryRoomsForGoals(
      [
        baseGoal({
          title: 'مهارات ما قبل الكتابة',
          smartText: 'إمساك القلم والرسم',
          domain: 'المهارات الأكاديمية المبكرة',
        }),
      ],
      2
    );
    expect(recs.map((r) => r.id)).toEqual(
      expect.arrayContaining(['tracing', 'sand'])
    );
  });
});

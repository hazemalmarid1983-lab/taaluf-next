import {
  calculateDevelopmentGrowth,
  identifyRedFlags,
  inferTrackingPlan,
  needPercentFromAverage,
  sliceHistoryByPlan,
  snapshotFromStored,
  toGoalTrackingItem,
} from '../lib/progressTracker';
import type { TrackedGoal } from '../lib/goalsEngine';

const baseline = snapshotFromStored({
  id: 'a1',
  savedAt: '2026-01-10T00:00:00.000Z',
  percentage: 60,
  evaluationRound: 1,
  domainAverages: {
    'التواصل الاستجابي والتعبيري': 2.4,
    'التفاعل والاندماج الاجتماعي واللعب': 1.8,
    'النمو المعرفي والحلول الإدراكية': 1.2,
    'السلوك والتكيف والحواس واستقلالية الذات': 2.1,
  },
});

const latest = snapshotFromStored({
  id: 'a2',
  savedAt: '2026-04-10T00:00:00.000Z',
  percentage: 44,
  evaluationRound: 2,
  domainAverages: {
    'التواصل الاستجابي والتعبيري': 1.5,
    'التفاعل والاندماج الاجتماعي واللعب': 1.2,
    'النمو المعرفي والحلول الإدراكية': 1.0,
    'السلوك والتكيف والحواس واستقلالية الذات': 1.8,
  },
});

describe('progress tracker', () => {
  it('treats a drop in need percentage as improvement', () => {
    const growth = calculateDevelopmentGrowth(baseline, latest);
    expect(growth.isImproved).toBe(true);
    expect(growth.overallDiffPercentage).toBe(16);
    expect(growth.roundsCount).toBe(2);
    const comm = growth.domainComparison.find((d) =>
      d.domain.includes('التواصل')
    );
    expect(comm?.improvementDelta).toBeGreaterThan(0);
  });

  it('converts a 0–3 domain average into a need percentage', () => {
    expect(needPercentFromAverage(3)).toBe(100);
    expect(needPercentFromAverage(1.5)).toBe(50);
  });

  it('maps SMART goals to mastered / in-progress counts', () => {
    const goal: TrackedGoal = {
      id: 'g1',
      childId: 'child_1',
      criterionId: 'C1',
      domain: 'التواصل الاستجابي والتعبيري',
      title: 'الطلب',
      smartText: 'أن يطلب بكلمة',
      baseline: 40,
      target: 70,
      current: 70,
      startDate: '2026-01-01',
      targetDate: '2026-04-01',
      status: 'done',
      sessions: [],
    };
    const item = toGoalTrackingItem(goal);
    expect(item.status).toBe('mastered');
    expect(item.currentProgress).toBe(100);
  });

  it('infers the tracking plan from the number of rounds', () => {
    expect(inferTrackingPlan(1)).toBe('single');
    expect(inferTrackingPlan(2)).toBe('half_year');
    expect(inferTrackingPlan(4)).toBe('annual');
  });

  it('slices history to the selected tracking window', () => {
    const rows = [1, 2, 3, 4];
    expect(sliceHistoryByPlan(rows, 'single')).toEqual([4]);
    expect(sliceHistoryByPlan(rows, 'half_year')).toEqual([3, 4]);
    expect(sliceHistoryByPlan(rows, 'annual')).toEqual([1, 2, 3, 4]);
  });

  it('lists observational red flags without medical diagnosis wording', () => {
    const flags = identifyRedFlags([
      { criterionId: 'C1', score: 3 },
      { criterionId: 'C2', score: 1 },
    ]);
    expect(flags.length).toBe(1);
    expect(flags[0]).toMatch(/مؤشر سلوكي/);
    expect(flags.join(' ')).not.toMatch(/تشخيص|دواء|توحد/);
  });
});

import { isEmptySyncPlan, planGoalSync, replaceChildGoals, replaceGoalProbes } from '../lib/clinicalSyncPlan';
import type { GeneralizationProbe } from '../lib/generalizationIndex';
import type { TrackedGoal } from '../lib/goalsEngine';

const goal = (id: string, childId = 'c1', sessionsAt: string[] = []): TrackedGoal => ({
  id,
  childId,
  criterionId: 'C1',
  domain: '',
  title: id,
  smartText: '',
  baseline: 0,
  target: 100,
  current: 0,
  startDate: '2026-01-01T00:00:00.000Z',
  targetDate: '2026-03-01T00:00:00.000Z',
  status: 'active',
  sessions: sessionsAt.map((at) => ({ at })),
});

const probe = (probeId: string, goalId: string) =>
  ({ probe_id: probeId, goal_id: goalId }) as GeneralizationProbe;

describe('planGoalSync', () => {
  it('imports local-only goals and probes and pushes sessions missing on the server', () => {
    const local = [goal('g1', 'c1', ['2026-01-02T00:00:00.000Z', '2026-01-03T00:00:00.000Z']), goal('g2')];
    const server = [goal('g1', 'c1', ['2026-01-02T00:00:00.000Z'])];
    const plan = planGoalSync(local, server, [probe('p1', 'g2'), probe('p2', 'g1'), probe('px', 'other')], [probe('p2', 'g1')]);
    expect(plan.goalsToImport.map((g) => g.id)).toEqual(['g2']);
    expect(plan.probesToImport.map((p) => p.probe_id)).toEqual(['p1']);
    expect(plan.sessionsToPush).toEqual([{ goalId: 'g1', session: { at: '2026-01-03T00:00:00.000Z' } }]);
  });

  it('is empty when the browser matches the server', () => {
    const g = goal('g1', 'c1', ['2026-01-02T00:00:00.000Z']);
    expect(isEmptySyncPlan(planGoalSync([g], [g], [], []))).toBe(true);
  });
});

describe('cache replacement', () => {
  it('replaces only the synced child goals and those goals probes', () => {
    const all = [goal('old', 'c1'), goal('x', 'c2')];
    expect(replaceChildGoals(all, 'c1', [goal('new', 'c1')]).map((g) => g.id)).toEqual(['new', 'x']);
    const probes = [probe('a', 'old'), probe('b', 'x')];
    expect(replaceGoalProbes(probes, new Set(['old', 'new']), [probe('c', 'new')]).map((p) => p.probe_id)).toEqual([
      'b',
      'c',
    ]);
  });
});

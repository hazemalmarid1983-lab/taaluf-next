import { diffGoalAuditEvents } from '../lib/clinicalAudit';
import type { GoalSession, TrackedGoal } from '../lib/goalsEngine';
import { recordMaintenanceProbe } from '../lib/maintenanceSchedule';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse('2026-01-01T09:00:00.000Z');
const at = (days: number) => new Date(T0 + days * DAY);
const iso = (days: number) => at(days).toISOString();

const independent = (day: number): GoalSession => ({
  at: iso(day),
  independencePct: 100,
  fullyIndependent: true,
  firstTrialIndependent: true,
  promptLevel: 'Independent',
});

function goal(sessions: GoalSession[]): TrackedGoal {
  return {
    id: 'g1',
    childId: 'c1',
    criterionId: 'C3',
    domain: 'التواصل',
    developmentalDomain: 'receptive_language',
    title: 'تنفيذ تعليم من خطوة',
    smartText: '',
    baseline: 0,
    target: 100,
    current: 100,
    startDate: iso(0),
    targetDate: iso(90),
    status: 'active',
    sessions,
  };
}

const events = (drafts: ReturnType<typeof diffGoalAuditEvents>) => drafts.map((d) => d.event);

describe('diffGoalAuditEvents', () => {
  it('logs creation and deletion', () => {
    expect(events(diffGoalAuditEvents(null, goal([])))).toEqual(['goal_created']);
    expect(events(diffGoalAuditEvents(goal([]), null))).toEqual(['goal_deleted']);
  });

  it('logs status transitions', () => {
    const drafts = diffGoalAuditEvents(goal([]), { ...goal([]), status: 'paused' });
    expect(drafts).toEqual([
      { goalId: 'g1', event: 'goal_status_changed', details: { from: 'active', to: 'paused' } },
    ]);
  });

  it('logs the session that achieves mastery and the phase change', () => {
    const before = goal([independent(1), independent(2)]);
    const after = goal([independent(1), independent(2), independent(3)]);
    expect(events(diffGoalAuditEvents(before, after, at(3)))).toEqual([
      'session_recorded',
      'mastery_achieved',
      'phase_changed',
    ]);
  });

  it('logs maintenance probe outcomes and mastery withdrawal', () => {
    const mastered = goal([independent(1), independent(2), independent(3)]);
    const first = recordMaintenanceProbe(mastered, { independencePct: 60 }, at(10), 'm1');
    if (!first.ok) throw new Error('probe');
    const second = recordMaintenanceProbe(first.goal, { independencePct: 50 }, at(11), 'm2');
    if (!second.ok) throw new Error('probe');

    const firstDiff = diffGoalAuditEvents(mastered, first.goal, at(10));
    expect(firstDiff[0]).toEqual({
      goalId: 'g1',
      event: 'maintenance_probe_recorded',
      details: { probeId: 'm1', independencePct: 60, passed: false },
    });

    const secondDiff = events(diffGoalAuditEvents(first.goal, second.goal, at(11)));
    expect(secondDiff).toContain('maintenance_probe_recorded');
    expect(secondDiff).toContain('mastery_withdrawn');
    expect(secondDiff).toContain('phase_changed');
  });
});

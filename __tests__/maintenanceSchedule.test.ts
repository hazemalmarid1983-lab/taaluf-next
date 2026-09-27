import type { GoalSession, TrackedGoal } from '../lib/goalsEngine';
import {
  MAINTENANCE_SCHEDULE_WEEKS,
  evaluateGoalLifecycle,
  recordMaintenanceProbe,
} from '../lib/maintenanceSchedule';
import { toGoalTrackingItem } from '../lib/progressTracker';
import { evaluateGoalMastery } from '../lib/skillMastery';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse('2026-01-01T09:00:00.000Z');
const at = (days: number) => new Date(T0 + days * DAY);
const iso = (days: number) => at(days).toISOString();

const masteredSession = (day: number): GoalSession => ({
  at: iso(day),
  independencePct: 100,
  fullyIndependent: true,
  firstTrialIndependent: true,
  promptLevel: 'Independent',
});

function masteredGoal(): TrackedGoal {
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
    sessions: [masteredSession(1), masteredSession(2), masteredSession(3)],
  };
}

function probe(goal: TrackedGoal, day: number, pct: number, id: string) {
  const result = recordMaintenanceProbe(goal, { independencePct: pct }, at(day), id);
  if (!result.ok) throw new Error(result.errors.join(','));
  return result;
}

describe('spaced maintenance schedule', () => {
  it('schedules probes at 1, 2, 4 and 8 weeks after the mastery date', () => {
    const life = evaluateGoalLifecycle(masteredGoal(), at(3));
    expect(life.phase).toBe('maintenance');
    expect(life.mastered_at).toBe(iso(3));
    expect(life.steps.map((s) => s.due_at)).toEqual(
      MAINTENANCE_SCHEDULE_WEEKS.map((w) => iso(3 + w * 7))
    );
    expect(life.next_probe_kind).toBe('scheduled');
    expect(life.next_probe_due_at).toBe(iso(10));
    expect(life.probe_due_now).toBe(false);
    expect(evaluateGoalLifecycle(masteredGoal(), at(10)).probe_due_now).toBe(true);
  });

  it('keeps mastery after a later non-qualifying practice session', () => {
    const goal = masteredGoal();
    goal.sessions.push({ at: iso(4), independencePct: 40, fullyIndependent: false });
    expect(evaluateGoalMastery(goal).mastered).toBe(true);
  });

  it('ignores an early passing probe and advances on an on-time pass', () => {
    const early = probe(masteredGoal(), 5, 100, 'p-early');
    expect(early.lifecycle.steps[0].status).not.toBe('passed');
    const onTime = probe(early.goal, 10, 90, 'p1');
    expect(onTime.lifecycle.steps[0]).toMatchObject({ status: 'passed', probe_id: 'p1' });
    expect(onTime.lifecycle.next_probe_due_at).toBe(iso(17));
  });

  it('asks for a confirmation probe within 48 hours after one probe below 80%', () => {
    const fail = probe(masteredGoal(), 10, 60, 'p1');
    expect(fail.passed).toBe(false);
    expect(fail.withdrawn).toBe(false);
    expect(fail.lifecycle.phase).toBe('maintenance');
    expect(fail.lifecycle.next_probe_kind).toBe('confirmation');
    expect(fail.lifecycle.next_probe_due_at).toBe(iso(12));
    const confirmed = probe(fail.goal, 11, 85, 'p2');
    expect(confirmed.lifecycle.steps[0]).toMatchObject({ status: 'passed', probe_id: 'p2' });
    expect(confirmed.lifecycle.next_probe_kind).toBe('scheduled');
  });

  it('withdraws mastery after two consecutive probes below 80% and logs the reason', () => {
    const first = probe(masteredGoal(), 10, 70, 'p1');
    const second = probe(first.goal, 11, 50, 'p2');
    expect(second.withdrawn).toBe(true);
    expect(second.goal.masteryWithdrawals).toEqual([
      {
        at: iso(11),
        reason: 'consecutive_maintenance_probes_below_threshold',
        probe_ids: ['p1', 'p2'],
      },
    ]);
    expect(second.lifecycle.phase).toBe('re_acquisition');
    const item = toGoalTrackingItem(second.goal, undefined, at(11));
    expect(item.status).not.toBe('mastered');
    expect(item.phase).toBe('re_acquisition');
    expect(item.masteryBlockers[0]).toBe('mastery_withdrawn_maintenance');
  });

  it('requires a fresh qualifying run after withdrawal, then restarts the schedule', () => {
    const withdrawn = probe(probe(masteredGoal(), 10, 70, 'p1').goal, 11, 50, 'p2').goal;
    const relearning = {
      ...withdrawn,
      sessions: [...withdrawn.sessions, masteredSession(12), masteredSession(13)],
    };
    expect(evaluateGoalLifecycle(relearning, at(13)).phase).toBe('re_acquisition');
    const remastered = { ...relearning, sessions: [...relearning.sessions, masteredSession(14)] };
    const life = evaluateGoalLifecycle(remastered, at(14));
    expect(life.phase).toBe('maintenance');
    expect(life.mastered_at).toBe(iso(14));
    expect(life.next_probe_due_at).toBe(iso(21));
  });

  it('marks the goal maintained after all four probes pass, with a 12-week review', () => {
    let goal = masteredGoal();
    for (const [i, weeks] of MAINTENANCE_SCHEDULE_WEEKS.entries()) {
      goal = probe(goal, 3 + weeks * 7, 100, `p${i}`).goal;
    }
    const life = evaluateGoalLifecycle(goal, at(60));
    expect(life.phase).toBe('maintained');
    expect(life.next_probe_kind).toBe('review');
    expect(life.next_probe_due_at).toBe(iso(3 + 56 + 84));
  });

  it('rejects probes for goals that are not mastered and invalid percentages', () => {
    const unmastered = { ...masteredGoal(), sessions: [masteredSession(1)] };
    const a = recordMaintenanceProbe(unmastered, { independencePct: 90 }, at(10));
    expect(a).toEqual({ ok: false, errors: ['NOT_MASTERED'] });
    const b = recordMaintenanceProbe(masteredGoal(), { independencePct: '' }, at(10));
    expect(b).toEqual({ ok: false, errors: ['INDEPENDENCE_REQUIRED'] });
  });
});

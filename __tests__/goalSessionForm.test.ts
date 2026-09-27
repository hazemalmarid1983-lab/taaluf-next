import type { TrackedGoal } from '../lib/goalsEngine';
import {
  buildGoalSessionFromForm,
  goalSessionFormFields,
  meetsFrequencyTarget,
  normalizeTrainerId,
} from '../lib/goalSessionForm';
import { toGoalTrackingItem } from '../lib/progressTracker';

const goal = (criterionId: string, extra: Partial<TrackedGoal> = {}): TrackedGoal => ({
  id: `g_${criterionId}`,
  childId: 'child',
  criterionId,
  domain: 'x',
  title: 't',
  smartText: 's',
  baseline: 0,
  target: 30,
  current: 0,
  startDate: '2026-01-01',
  targetDate: '2026-04-01',
  status: 'active',
  sessions: [],
  ...extra,
});

const day = (n: number) => new Date(`2026-02-${String(n).padStart(2, '0')}T10:00:00Z`);

describe('session form fields per skill type', () => {
  it('asks closed goals (C1) for independence and the cold probe', () => {
    const f = goalSessionFormFields(goal('C1'));
    expect(f).toMatchObject({
      frequencyMode: false,
      askFirstTrial: true,
      askNaturalCue: false,
      trainerRequired: false,
      settingRequired: false,
    });
  });

  it('requires trainer and setting for social goals (C11)', () => {
    expect(goalSessionFormFields(goal('C11'))).toMatchObject({
      trainerRequired: true,
      settingRequired: true,
      askNaturalCue: true,
    });
  });

  it('uses frequency mode for self-regulation goals (C33)', () => {
    expect(goalSessionFormFields(goal('C33')).frequencyMode).toBe(true);
  });
});

describe('buildGoalSessionFromForm', () => {
  it('rejects a trial-based session without an independence percentage', () => {
    const r = buildGoalSessionFromForm(goal('C1'), {});
    expect(r).toEqual({ ok: false, errors: ['INDEPENDENCE_REQUIRED'] });
    expect(buildGoalSessionFromForm(goal('C1'), { independencePct: '120' }).ok).toBe(false);
  });

  it('rejects a social session without trainer and setting', () => {
    const r = buildGoalSessionFromForm(goal('C11'), { independencePct: 90 });
    expect(r).toEqual({ ok: false, errors: ['TRAINER_REQUIRED', 'SETTING_REQUIRED'] });
  });

  it('records independence, cold probe, trainer and setting', () => {
    const r = buildGoalSessionFromForm(
      goal('C1'),
      { independencePct: '100', firstTrialIndependent: true, trainerName: ' أ. سارة ', setting: 'home' },
      day(1)
    );
    expect(r.ok && r.session).toMatchObject({
      at: day(1).toISOString(),
      independencePct: 100,
      fullyIndependent: true,
      firstTrialIndependent: true,
      trainerId: 'أ. سارة',
      setting: 'home',
    });
  });

  it('marks sub-100% sessions as not fully independent', () => {
    const r = buildGoalSessionFromForm(goal('C1'), { independencePct: 80 });
    expect(r.ok && r.session.fullyIndependent).toBe(false);
  });

  it('requires a frequency target and value for self-regulation goals', () => {
    expect(buildGoalSessionFromForm(goal('C33'), {})).toEqual({
      ok: false,
      errors: ['SETTING_REQUIRED', 'FREQUENCY_TARGET_REQUIRED', 'BEHAVIOR_VALUE_REQUIRED'],
    });
  });

  it('saves the target on the goal and evaluates each session against it', () => {
    const first = buildGoalSessionFromForm(
      goal('C33'),
      {
        behaviorValue: '2',
        setting: 'home',
        frequencyTarget: { measure: 'count', direction: 'decrease', target: '3' },
      },
      day(1)
    );
    if (!first.ok) throw new Error('expected ok');
    expect(first.goal.frequencyTarget).toEqual({ measure: 'count', direction: 'decrease', target: 3 });
    expect(first.session).toMatchObject({ behaviorCount: 2, metFrequencyCriterion: true });

    const second = buildGoalSessionFromForm(first.goal, { behaviorValue: 5, setting: 'school' }, day(2));
    expect(second.ok && second.session.metFrequencyCriterion).toBe(false);
  });

  it('stores duration for duration targets', () => {
    const r = buildGoalSessionFromForm(
      goal('C33', { frequencyTarget: { measure: 'duration_minutes', direction: 'increase', target: 10 } }),
      { behaviorValue: 12, setting: 'home' }
    );
    expect(r.ok && r.session).toMatchObject({ behaviorDurationMinutes: 12, metFrequencyCriterion: true });
  });
});

describe('form sessions feed the skill-type mastery rules', () => {
  it('lets a social goal reach mastery across trainers and settings', () => {
    let g = goal('C11');
    const plan: Array<[string, 'clinic' | 'home' | 'school']> = [
      ['أ. سارة', 'clinic'],
      ['الأم', 'home'],
      ['أ. سارة', 'school'],
    ];
    plan.forEach(([trainerName, setting], i) => {
      const r = buildGoalSessionFromForm(g, { independencePct: 85, trainerName, setting }, day(i + 1));
      if (!r.ok) throw new Error('expected ok');
      g = r.goal;
    });
    const item = toGoalTrackingItem(g);
    expect(item.status).toBe('mastered');
    expect(item.masteryBlockers).toEqual([]);
  });

  it('lets a self-regulation goal reach mastery on three met sessions in two settings', () => {
    let g = goal('C33', { frequencyTarget: { measure: 'count', direction: 'decrease', target: 2 } });
    (['home', 'school', 'home'] as const).forEach((setting, i) => {
      const r = buildGoalSessionFromForm(g, { behaviorValue: 1, setting }, day(i + 1));
      if (!r.ok) throw new Error('expected ok');
      g = r.goal;
    });
    expect(toGoalTrackingItem(g).status).toBe('mastered');
  });
});

describe('helpers', () => {
  it('normalizes trainer names into stable ids', () => {
    expect(normalizeTrainerId('  Ms.  Sara ')).toBe('ms. sara');
    expect(normalizeTrainerId('   ')).toBeUndefined();
  });

  it('compares frequency values in the target direction', () => {
    expect(meetsFrequencyTarget({ measure: 'count', direction: 'decrease', target: 2 }, 2)).toBe(true);
    expect(meetsFrequencyTarget({ measure: 'count', direction: 'decrease', target: 2 }, 3)).toBe(false);
    expect(meetsFrequencyTarget({ measure: 'count', direction: 'increase', target: 2 }, 1)).toBe(false);
  });
});

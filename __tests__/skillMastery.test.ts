import type { TrackedGoal } from '../lib/goalsEngine';
import { toGoalTrackingItem } from '../lib/progressTracker';
import {
  DEFAULT_SKILL_CATEGORY,
  DEFAULT_SKILL_TYPE_CONFIGS,
  SKILL_CATEGORY_BY_DEVELOPMENTAL_DOMAIN,
  evaluateGoalMastery,
  evaluateSkillMastery,
  qualifyingRun,
  sessionQualifies,
  skillCategoryForDomain,
  type MasterySessionRecord,
} from '../lib/skillMastery';
import { DEVELOPMENTAL_DOMAINS } from '../types/taalof';

const { closed_cognitive, social, adaptive_self_help, self_regulation } = DEFAULT_SKILL_TYPE_CONFIGS;

let seq = 0;
const rec = (overrides: Partial<MasterySessionRecord> & { day: number }): MasterySessionRecord => {
  const { day, ...rest } = overrides;
  seq += 1;
  return {
    session_id: `s${seq}`,
    goal_id: 'g',
    date: `2026-02-${String(day).padStart(2, '0')}T10:00:00Z`,
    independence_pct: 100,
    prompt_level: 'Independent',
    first_trial_independent: true,
    ...rest,
  };
};

describe('central skill type configs', () => {
  it('matches the approved thresholds and session counts', () => {
    expect(closed_cognitive).toMatchObject({
      mastery_threshold_pct: 100,
      consecutive_sessions_required: 3,
      min_interval_between_sessions_hours: 0,
      require_cold_probe_first_trial: true,
    });
    expect(social).toMatchObject({
      mastery_threshold_pct: 80,
      consecutive_sessions_required: 4,
      min_interval_between_sessions_hours: 24,
      require_cold_probe_first_trial: true,
      min_distinct_trainers: 2,
      require_multiple_settings: false,
    });
    expect(adaptive_self_help).toMatchObject({
      mastery_threshold_pct: 90,
      consecutive_sessions_required: 3,
      min_distinct_settings: 2,
      allow_natural_cue_as_independent: true,
    });
    expect(self_regulation).toMatchObject({
      measurement_mode: 'frequency_duration',
      mastery_threshold_pct: null,
      consecutive_sessions_required: 5,
      min_distinct_trainers: 2,
      require_multiple_settings: false,
    });
  });

  it('routes every developmental domain to a skill type', () => {
    for (const d of DEVELOPMENTAL_DOMAINS) {
      expect(DEFAULT_SKILL_TYPE_CONFIGS[SKILL_CATEGORY_BY_DEVELOPMENTAL_DOMAIN[d.id]]).toBeDefined();
    }
  });

  it('falls back to the strictest closed type for unknown domains', () => {
    expect(DEFAULT_SKILL_CATEGORY).toBe('closed_cognitive');
    expect(skillCategoryForDomain(undefined)).toBe('closed_cognitive');
    expect(skillCategoryForDomain('unknown')).toBe('closed_cognitive');
    expect(skillCategoryForDomain('social_skills')).toBe('social');
    expect(skillCategoryForDomain('self_help')).toBe('adaptive_self_help');
    expect(skillCategoryForDomain('sensory_integration')).toBe('self_regulation');
  });
});

describe('closed cognitive mastery (100% × 3)', () => {
  it('is not mastered with one or two sessions', () => {
    expect(evaluateSkillMastery(closed_cognitive, [rec({ day: 1 })]).mastered).toBe(false);
    expect(
      evaluateSkillMastery(closed_cognitive, [rec({ day: 1 }), rec({ day: 2 })]).mastered
    ).toBe(false);
  });

  it('is mastered after three consecutive fully independent sessions', () => {
    const result = evaluateSkillMastery(closed_cognitive, [
      rec({ day: 1 }),
      rec({ day: 2 }),
      rec({ day: 3 }),
    ]);
    expect(result).toMatchObject({ mastered: true, qualifying_streak: 3, blockers: [] });
  });

  it('breaks the run on any prompted or sub-100% session', () => {
    const prompted = rec({ day: 2, independence_pct: 90, prompt_level: 'Verbal' });
    const result = evaluateSkillMastery(closed_cognitive, [rec({ day: 1 }), prompted, rec({ day: 3 })]);
    expect(result.mastered).toBe(false);
    expect(result.blockers).toContain('insufficient_consecutive_sessions');
  });

  it('rejects a 100% session whose cold-probe first trial was prompted', () => {
    expect(sessionQualifies(closed_cognitive, rec({ day: 1, first_trial_independent: false }))).toBe(false);
  });

  it('orders sessions by date before counting the run', () => {
    const run = qualifyingRun(closed_cognitive, [
      rec({ day: 3 }),
      rec({ day: 1 }),
      rec({ day: 2, independence_pct: 50, prompt_level: 'Gestural' }),
    ]);
    expect(run).toHaveLength(1);
  });
});

describe('social mastery (80% × 4, cold probe, 2 trainers)', () => {
  const ok = (day: number, trainer: string, extra: Partial<MasterySessionRecord> = {}) =>
    rec({ day, independence_pct: 80, prompt_level: 'Verbal', trainer_id: trainer, ...extra });

  it('accepts 80% sessions with prompts when the cold probe was independent', () => {
    expect(sessionQualifies(social, ok(1, 't1'))).toBe(true);
    expect(sessionQualifies(social, ok(1, 't1', { independence_pct: 79 }))).toBe(false);
    expect(sessionQualifies(social, ok(1, 't1', { first_trial_independent: false }))).toBe(false);
  });

  it('needs four sessions, not three', () => {
    expect(evaluateSkillMastery(social, [ok(1, 't1'), ok(2, 't2'), ok(3, 't1')]).blockers).toEqual([
      'insufficient_consecutive_sessions',
    ]);
    expect(
      evaluateSkillMastery(social, [ok(1, 't1'), ok(2, 't2'), ok(3, 't1'), ok(4, 't2')])
    ).toMatchObject({ mastered: true, qualifying_streak: 4, distinct_trainers: 2 });
  });

  it('is blocked when a single trainer ran every session', () => {
    const result = evaluateSkillMastery(social, [ok(1, 't1'), ok(2, 't1'), ok(3, 't1'), ok(4, 't1')]);
    expect(result.blockers).toEqual(['insufficient_distinct_trainers']);
  });

  it('does not require distinct settings', () => {
    const result = evaluateSkillMastery(social, [
      ok(1, 't1', { setting: 'clinic' }),
      ok(2, 't2', { setting: 'clinic' }),
      ok(3, 't1', { setting: 'clinic' }),
      ok(4, 't2', { setting: 'clinic' }),
    ]);
    expect(result.mastered).toBe(true);
  });

  it('does not count sessions closer than 24 hours apart', () => {
    const sameDay = [
      ok(1, 't1'),
      { ...ok(1, 't2'), date: '2026-02-01T15:00:00Z' },
      { ...ok(1, 't1'), date: '2026-02-01T20:00:00Z' },
      { ...ok(1, 't2'), date: '2026-02-01T22:00:00Z' },
    ];
    expect(evaluateSkillMastery(social, sameDay).qualifying_streak).toBe(1);
  });
});

describe('adaptive self-help mastery (90% × 3, 2 settings)', () => {
  it('accepts 90% with an independent cold probe', () => {
    expect(sessionQualifies(adaptive_self_help, rec({ day: 1, independence_pct: 90, prompt_level: 'Verbal' }))).toBe(true);
    expect(sessionQualifies(adaptive_self_help, rec({ day: 1, independence_pct: 89 }))).toBe(false);
    expect(
      sessionQualifies(adaptive_self_help, rec({ day: 1, independence_pct: 95, first_trial_independent: false }))
    ).toBe(false);
  });

  it('requires two distinct settings', () => {
    const home = [1, 2, 3].map((day) => rec({ day, setting: 'home' }));
    expect(evaluateSkillMastery(adaptive_self_help, home).blockers).toEqual(['insufficient_distinct_settings']);
    const mixed = [rec({ day: 1, setting: 'home' }), rec({ day: 2, setting: 'school' }), rec({ day: 3, setting: 'home' })];
    expect(evaluateSkillMastery(adaptive_self_help, mixed).mastered).toBe(true);
  });
});

describe('self-regulation mastery (frequency × 5, 2 trainers)', () => {
  const met = (day: number, trainer: string) =>
    rec({ day, independence_pct: 0, met_frequency_criterion: true, trainer_id: trainer });

  it('uses the frequency criterion instead of independence %', () => {
    expect(sessionQualifies(self_regulation, met(1, 't1'))).toBe(true);
    expect(sessionQualifies(self_regulation, rec({ day: 1, independence_pct: 100 }))).toBe(false);
  });

  it('needs five met sessions across two trainers', () => {
    const four = [1, 2, 3, 4].map((d) => met(d, d % 2 ? 't1' : 't2'));
    expect(evaluateSkillMastery(self_regulation, four).mastered).toBe(false);
    const five = [1, 2, 3, 4, 5].map((d) => met(d, d % 2 ? 't1' : 't2'));
    expect(evaluateSkillMastery(self_regulation, five).mastered).toBe(true);
    const oneTrainer = [1, 2, 3, 4, 5].map((d) => met(d, 't1'));
    expect(evaluateSkillMastery(self_regulation, oneTrainer).blockers).toEqual(['insufficient_distinct_trainers']);
  });
});

describe('tracked goal wiring', () => {
  const goal = (criterionId: string, sessions: TrackedGoal['sessions']): TrackedGoal => ({
    id: 'g',
    childId: 'child',
    criterionId,
    domain: 'x',
    title: 't',
    smartText: 's',
    baseline: 0,
    target: 30,
    current: 30,
    startDate: '2026-01-01',
    targetDate: '2026-04-01',
    status: 'active',
    sessions,
  });

  it('routes a social criterion (C11) to the social rule', () => {
    const sessions = [1, 2, 3, 4].map((day, i) => ({
      at: `2026-02-0${day}T10:00:00Z`,
      independencePct: 85,
      firstTrialIndependent: true,
      trainerId: i % 2 ? 't2' : 't1',
    }));
    const item = toGoalTrackingItem(goal('C11', sessions));
    expect(item.skillType).toBe('social');
    expect(item.status).toBe('mastered');
    expect(item.masteryBlockers).toEqual([]);
  });

  it('keeps 85% sessions below mastery for a closed criterion (C1)', () => {
    const sessions = [1, 2, 3].map((day) => ({ at: `2026-02-0${day}T10:00:00Z`, independencePct: 85 }));
    const item = toGoalTrackingItem(goal('C1', sessions));
    expect(item.skillType).toBe('closed_cognitive');
    expect(item.status).not.toBe('mastered');
  });

  it('treats legacy fullyIndependent sessions as 100% with an independent cold probe', () => {
    const sessions = [1, 2, 3].map((day) => ({ at: `2026-02-0${day}`, fullyIndependent: true }));
    expect(evaluateGoalMastery(goal('C1', sessions)).mastered).toBe(true);
  });
});

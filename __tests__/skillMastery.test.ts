import type { TrackedGoal } from '../lib/goalsEngine';
import { toGoalTrackingItem } from '../lib/progressTracker';
import {
  DEFAULT_SKILL_CATEGORY,
  SKILL_TYPE_CONFIGS,
  evaluateGoalMastery,
  evaluateSkillMastery,
  qualifyingRun,
  sessionQualifies,
  skillCategoryForDomain,
  type MasterySessionRecord,
  type SkillCategoryId,
} from '../lib/skillMastery';
import { DEVELOPMENTAL_DOMAINS } from '../types/taalof';

const { closed_cognitive, social, adaptive_self_help, self_regulation } = SKILL_TYPE_CONFIGS;

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

describe('skill type mapping', () => {
  it('assigns every developmental domain to exactly one skill type', () => {
    for (const d of DEVELOPMENTAL_DOMAINS) {
      const owners = (Object.keys(SKILL_TYPE_CONFIGS) as SkillCategoryId[]).filter((id) =>
        SKILL_TYPE_CONFIGS[id].domains.includes(d.id)
      );
      expect({ domain: d.id, owners: owners.length }).toEqual({ domain: d.id, owners: 1 });
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

  it('keeps the closed and self-help rule at 100% over 3 sessions', () => {
    for (const c of [closed_cognitive, adaptive_self_help]) {
      expect(c.mastery_threshold_pct).toBe(100);
      expect(c.consecutive_sessions_required).toBe(3);
    }
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
    const result = evaluateSkillMastery(closed_cognitive, [
      rec({ day: 1 }),
      prompted,
      rec({ day: 3 }),
    ]);
    expect(result.mastered).toBe(false);
    expect(result.blockers).toContain('insufficient_consecutive_sessions');
  });

  it('rejects a 100% session whose cold-probe first trial was prompted', () => {
    expect(sessionQualifies(closed_cognitive, rec({ day: 1, first_trial_independent: false }))).toBe(
      false
    );
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

describe('social mastery (80% × 3, 2 trainers, 2 settings)', () => {
  const ok = (day: number, trainer: string, setting: MasterySessionRecord['setting']) =>
    rec({
      day,
      independence_pct: 80,
      prompt_level: 'Verbal',
      first_trial_independent: false,
      trainer_id: trainer,
      setting,
    });

  it('accepts 80% sessions below 100% with prompts', () => {
    expect(sessionQualifies(social, ok(1, 't1', 'clinic'))).toBe(true);
    expect(sessionQualifies(social, rec({ day: 1, independence_pct: 79 }))).toBe(false);
  });

  it('is mastered across two trainers and two settings on separate days', () => {
    const result = evaluateSkillMastery(social, [
      ok(1, 't1', 'clinic'),
      ok(2, 't2', 'home'),
      ok(3, 't1', 'school'),
    ]);
    expect(result).toMatchObject({ mastered: true, distinct_trainers: 2, distinct_settings: 3 });
  });

  it('is blocked when a single trainer ran every session', () => {
    const result = evaluateSkillMastery(social, [
      ok(1, 't1', 'clinic'),
      ok(2, 't1', 'home'),
      ok(3, 't1', 'school'),
    ]);
    expect(result.mastered).toBe(false);
    expect(result.blockers).toEqual(['insufficient_distinct_trainers']);
  });

  it('is blocked when every session was in the same setting', () => {
    const result = evaluateSkillMastery(social, [
      ok(1, 't1', 'clinic'),
      ok(2, 't2', 'clinic'),
      ok(3, 't1', 'clinic'),
    ]);
    expect(result.blockers).toEqual(['insufficient_distinct_settings']);
  });

  it('does not count sessions closer than 24 hours apart', () => {
    const sameDay = [
      ok(1, 't1', 'clinic'),
      { ...ok(1, 't2', 'home'), date: '2026-02-01T15:00:00Z' },
      { ...ok(1, 't1', 'school'), date: '2026-02-01T20:00:00Z' },
    ];
    const result = evaluateSkillMastery(social, sameDay);
    expect(result.qualifying_streak).toBe(1);
    expect(result.mastered).toBe(false);
  });
});

describe('adaptive self-help mastery', () => {
  it('counts a natural-cue response as independent', () => {
    const natural = rec({ day: 1, prompt_level: 'Gestural', natural_cue_only: true });
    expect(sessionQualifies(adaptive_self_help, natural)).toBe(true);
    expect(sessionQualifies(closed_cognitive, natural)).toBe(false);
  });

  it('requires two distinct settings', () => {
    const result = evaluateSkillMastery(adaptive_self_help, [
      rec({ day: 1, setting: 'home' }),
      rec({ day: 2, setting: 'home' }),
      rec({ day: 3, setting: 'home' }),
    ]);
    expect(result.blockers).toEqual(['insufficient_distinct_settings']);
  });
});

describe('self-regulation mastery (frequency/duration)', () => {
  it('uses the frequency criterion instead of independence %', () => {
    expect(
      sessionQualifies(self_regulation, rec({ day: 1, independence_pct: 0, met_frequency_criterion: true }))
    ).toBe(true);
    expect(
      sessionQualifies(self_regulation, rec({ day: 1, independence_pct: 100 }))
    ).toBe(false);
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
    const sessions = [1, 2, 3].map((day, i) => ({
      at: `2026-02-0${day}T10:00:00Z`,
      independencePct: 85,
      trainerId: i % 2 ? 't2' : 't1',
      setting: (i % 2 ? 'home' : 'clinic') as 'home' | 'clinic',
    }));
    const item = toGoalTrackingItem(goal('C11', sessions));
    expect(item.skillType).toBe('social');
    expect(item.status).toBe('mastered');
    expect(item.masteryBlockers).toEqual([]);
  });

  it('keeps 85% sessions below mastery for a closed criterion (C1)', () => {
    const sessions = [1, 2, 3].map((day) => ({
      at: `2026-02-0${day}T10:00:00Z`,
      independencePct: 85,
    }));
    const item = toGoalTrackingItem(goal('C1', sessions));
    expect(item.skillType).toBe('closed_cognitive');
    expect(item.status).not.toBe('mastered');
  });

  it('treats legacy fullyIndependent sessions as 100% with an independent cold probe', () => {
    const sessions = [1, 2, 3].map((day) => ({ at: `2026-02-0${day}`, fullyIndependent: true }));
    expect(evaluateGoalMastery(goal('C1', sessions)).mastered).toBe(true);
  });
});

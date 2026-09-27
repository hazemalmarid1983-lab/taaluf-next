import fs from 'fs/promises';
import os from 'os';
import path from 'path';

jest.mock('../lib/auditLog', () => ({ logAction: jest.fn(async () => undefined) }));

import type { ClinicalActor } from '../lib/clinicalAccess';
import { applyGoalAction, parseGoalAction, sanitizeGoalSession } from '../lib/clinicalGoalActions';
import {
  buildFbaPlan,
  sanitizeAbcIncident,
  sanitizeFbaPlan,
  summarizeFba,
  validateAbcIncidents,
} from '../lib/fba';
import type { GoalSession, TrackedGoal } from '../lib/goalsEngine';
import { buildGoalSessionFromForm, parseTrialScores } from '../lib/goalSessionForm';
import {
  buildIoaRecord,
  ioaMethodForSession,
  ioaSessionOptions,
  summarizeIoa,
  totalAgreementPct,
  trialByTrialAgreementPct,
} from '../lib/ioa';
import { loadClinicalAudit } from '../lib/server/clinicalAuditStore';
import {
  deleteGoal,
  getIoaReview,
  importGoals,
  linkChild,
  performGoalAction,
  recordIoa,
} from '../lib/server/clinicalRecordService';
import { loadChildRecord } from '../lib/server/clinicalRecordStore';
import type { AbcIncident, IoaRecord } from '../types/clinical';

const T0 = Date.parse('2026-03-01T09:00:00.000Z');
const at = (days: number) => new Date(T0 + days * 24 * 60 * 60 * 1000);
const iso = (days: number) => at(days).toISOString();

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

const behaviorGoal = (extra: Partial<TrackedGoal> = {}) =>
  goal('C33', { frequencyTarget: { measure: 'count', direction: 'decrease', target: 3 }, ...extra });

const incident = (over: Partial<AbcIncident> = {}): AbcIncident => ({
  antecedent: 'demand_placed',
  consequence: 'demand_removed',
  replacement_behavior_used: false,
  ...over,
});

const specialist: ClinicalActor = { userId: 'spec_1', role: 'SPECIALIST', name: 'أخصائية' };
const parent: ClinicalActor = { userId: 'parent_1', role: 'PARENT', name: 'أم' };
const advisor: ClinicalActor = { userId: 'adv_1', role: 'SCIENTIFIC_ADVISOR' };
const admin: ClinicalActor = { userId: 'admin_1', role: 'SUPER_ADMIN', name: 'مشرفة' };

describe('ABC incidents are linked to the session frequency/duration measure', () => {
  it('sanitizes incidents and drops unknown categories', () => {
    expect(sanitizeAbcIncident({ antecedent: 'bogus', consequence: 'demand_removed' })).toBeNull();
    expect(
      sanitizeAbcIncident({ ...incident(), behavior_note: '  رمى القلم  ', duration_minutes: -2 })
    ).toEqual({ ...incident(), behavior_note: 'رمى القلم' });
  });

  it('rejects more incidents than the recorded behaviour count or duration', () => {
    expect(validateAbcIncidents([incident(), incident()], { behaviorCount: 1 })).toEqual({
      ok: false,
      error: 'ABC_EXCEEDS_BEHAVIOR_COUNT',
    });
    expect(
      validateAbcIncidents([incident({ duration_minutes: 4 }), incident({ duration_minutes: 3 })], {
        behaviorDurationMinutes: 5,
      })
    ).toEqual({ ok: false, error: 'ABC_EXCEEDS_DURATION' });
    expect(validateAbcIncidents([{ antecedent: 'x' }], { behaviorCount: 3 })).toEqual({
      ok: false,
      error: 'INVALID_ABC_INCIDENT',
    });
    expect(validateAbcIncidents(undefined, {})).toEqual({ ok: true, incidents: [] });
  });

  it('stores ABC incidents and replacement behaviour count on frequency sessions', () => {
    const r = buildGoalSessionFromForm(
      behaviorGoal(),
      {
        behaviorValue: 2,
        trainerName: 'الأم',
        abcIncidents: [incident({ replacement_behavior_used: true }), incident({ consequence: 'attention_given' })],
        replacementBehaviorCount: '3',
      },
      at(1)
    );
    if (!r.ok) throw new Error(r.errors.join());
    expect(r.session).toMatchObject({ behaviorCount: 2, replacementBehaviorCount: 3 });
    expect(r.session.abcIncidents).toHaveLength(2);

    const tooMany = buildGoalSessionFromForm(
      behaviorGoal(),
      { behaviorValue: 1, trainerName: 'الأم', abcIncidents: [incident(), incident()] },
      at(1)
    );
    expect(tooMany).toEqual({ ok: false, errors: ['ABC_EXCEEDS_BEHAVIOR_COUNT'] });
  });

  it('keeps only consistent ABC data when sanitizing imported sessions', () => {
    const ok = sanitizeGoalSession({ at: iso(1), behaviorCount: 2, abcIncidents: [incident()], replacementBehaviorCount: 1 });
    expect(ok?.abcIncidents).toHaveLength(1);
    expect(ok?.replacementBehaviorCount).toBe(1);
    const inconsistent = sanitizeGoalSession({ at: iso(1), behaviorCount: 0, abcIncidents: [incident()] });
    expect(inconsistent?.abcIncidents).toBeUndefined();
  });
});

describe('FBA plan', () => {
  it('requires a target and a replacement behaviour', () => {
    expect(buildFbaPlan({}, 'x', at(0))).toEqual({
      ok: false,
      errors: ['TARGET_BEHAVIOR_REQUIRED', 'REPLACEMENT_BEHAVIOR_REQUIRED'],
    });
    const r = buildFbaPlan(
      { targetBehavior: 'يرمي الأدوات', replacementBehavior: 'يطلب استراحة', hypothesizedFunction: 'escape' },
      'أخصائية',
      at(0)
    );
    expect(r).toEqual({
      ok: true,
      plan: {
        target_behavior: 'يرمي الأدوات',
        replacement_behavior: 'يطلب استراحة',
        hypothesized_function: 'escape',
        updated_at: iso(0),
        updated_by: 'أخصائية',
      },
    });
    if (r.ok) expect(sanitizeFbaPlan(r.plan)).toEqual(r.plan);
    expect(sanitizeFbaPlan({ target_behavior: 'x' })).toBeUndefined();
  });

  it('applies the fba_plan action only to behaviour (frequency) goals', () => {
    const action = parseGoalAction({
      action: 'fba_plan',
      input: { targetBehavior: 'يصرخ', replacementBehavior: 'يرفع بطاقة' },
    });
    expect(action?.type).toBe('fba_plan');
    const ok = applyGoalAction(behaviorGoal(), action!, specialist, at(2));
    expect(ok.ok && ok.goal.fbaPlan).toMatchObject({ target_behavior: 'يصرخ', updated_by: 'أخصائية' });

    const notBehavior = applyGoalAction(goal('C1'), action!, specialist, at(2));
    expect(notBehavior).toMatchObject({ ok: false, status: 400, error: 'INVALID_FBA_PLAN', errors: ['NOT_BEHAVIOR_GOAL'] });

    const missing = applyGoalAction(behaviorGoal(), { type: 'fba_plan', input: {} }, specialist, at(2));
    expect(missing).toMatchObject({ ok: false, status: 400 });
  });

  it('suggests a descriptive function only with enough incidents and a dominant pattern', () => {
    const session = (incidents: AbcIncident[], day: number): GoalSession => ({
      at: iso(day),
      behaviorCount: incidents.length,
      abcIncidents: incidents,
      replacementBehaviorCount: 1,
    });
    const few = summarizeFba(behaviorGoal({ sessions: [session([incident(), incident()], 1)] }));
    expect(few.suggestedFunction).toBeUndefined();
    expect(few.hasPlan).toBe(false);

    const g = behaviorGoal({
      sessions: [
        session([incident(), incident(), incident({ replacement_behavior_used: true })], 1),
        session([incident(), incident({ antecedent: 'waiting', consequence: 'attention_given' })], 2),
      ],
    });
    const s = summarizeFba(g);
    expect(s.incidents).toBe(5);
    expect(s.sessionsWithAbc).toBe(2);
    expect(s.antecedents[0]).toEqual({ key: 'demand_placed', count: 4 });
    expect(s.consequences[0]).toEqual({ key: 'demand_removed', count: 4 });
    expect(s.suggestedFunction).toBe('escape');
    expect(s.replacementUsePct).toBe(20);
    expect(s.replacementBehaviorTotal).toBe(2);

    const mixed = summarizeFba(
      behaviorGoal({
        sessions: [
          session(
            [
              incident(),
              incident({ antecedent: 'attention_diverted', consequence: 'attention_given' }),
              incident({ antecedent: 'denied_access', consequence: 'item_given' }),
              incident({ antecedent: 'alone_unstructured', consequence: 'no_social_response' }),
              incident({ antecedent: 'other', consequence: 'other' }),
            ],
            1
          ),
        ],
      })
    );
    expect(mixed.suggestedFunction).toBeUndefined();
  });
});

describe('per-trial prompt scores', () => {
  it('parses known levels only', () => {
    expect(parseTrialScores(['Independent', 'Gestural'])).toEqual(['Independent', 'Gestural']);
    expect(parseTrialScores(['Independent', 'nope'])).toBeNull();
    expect(parseTrialScores('Independent')).toBeNull();
  });

  it('derives independence, the highest prompt and the first trial from the scores', () => {
    const r = buildGoalSessionFromForm(
      goal('C1'),
      { trialScores: ['Gestural', 'Independent', 'Independent', 'Independent'], trainerName: 'أ. سارة' },
      at(1)
    );
    if (!r.ok) throw new Error(r.errors.join());
    expect(r.session).toMatchObject({
      independencePct: 75,
      promptLevel: 'Gestural',
      firstTrialIndependent: false,
      trialScores: ['Gestural', 'Independent', 'Independent', 'Independent'],
    });
  });

  it('rejects scores that contradict the entered percentage or prompt level', () => {
    expect(
      buildGoalSessionFromForm(goal('C1'), { trialScores: ['Independent', 'Gestural'], independencePct: 80 })
    ).toMatchObject({ ok: false, errors: expect.arrayContaining(['TRIAL_SCORES_MISMATCH']) });
    expect(
      buildGoalSessionFromForm(goal('C1'), { trialScores: ['Independent', 'Gestural'], promptLevel: 'Model' })
    ).toMatchObject({ ok: false, errors: expect.arrayContaining(['TRIAL_SCORES_MISMATCH']) });
    expect(buildGoalSessionFromForm(goal('C1'), { trialScores: ['bad'] })).toEqual({
      ok: false,
      errors: ['INVALID_TRIAL_SCORES'],
    });
  });

  it('keeps valid trial scores when sanitizing sessions', () => {
    expect(sanitizeGoalSession({ at: iso(1), independencePct: 50, trialScores: ['Independent', 'Model'] })?.trialScores).toEqual([
      'Independent',
      'Model',
    ]);
    expect(sanitizeGoalSession({ at: iso(1), independencePct: 50, trialScores: ['x'] })?.trialScores).toBeUndefined();
  });
});

describe('IOA agreement formulas', () => {
  it('computes total count/duration agreement as smaller ÷ larger', () => {
    expect(totalAgreementPct(8, 10)).toBe(80);
    expect(totalAgreementPct(10, 8)).toBe(80);
    expect(totalAgreementPct(0, 0)).toBe(100);
    expect(totalAgreementPct(0, 3)).toBe(0);
    expect(totalAgreementPct(2, 3)).toBe(66.7);
  });

  it('computes trial-by-trial exact and independence agreement', () => {
    expect(
      trialByTrialAgreementPct(
        ['Independent', 'Gestural', 'Model', 'Independent'],
        ['Independent', 'Model', 'Model', 'Gestural']
      )
    ).toEqual({ agreementPct: 50, independenceAgreementPct: 75 });
  });

  it('picks the method from the data the session actually stored', () => {
    expect(ioaMethodForSession({ at: iso(0), behaviorCount: 2 })).toBe('total_count');
    expect(ioaMethodForSession({ at: iso(0), behaviorDurationMinutes: 4 })).toBe('total_duration');
    expect(ioaMethodForSession({ at: iso(0), trialScores: ['Independent'] })).toBe('trial_by_trial');
    expect(ioaMethodForSession({ at: iso(0), independencePct: 80 })).toBeNull();
  });
});

describe('buildIoaRecord', () => {
  const trialGoal = goal('C1', {
    sessions: [
      { at: iso(1), independencePct: 50, trainerId: 'أ. سارة', trialScores: ['Independent', 'Gestural'] },
      { at: iso(2), independencePct: 80 },
      { at: iso(3), behaviorCount: 4, trainerId: 'الأم' },
    ],
  });
  const observer = { userId: 'spec_2', name: 'مشرفة', role: 'SPECIALIST' };

  it('compares the secondary observer with the stored primary data', () => {
    const r = buildIoaRecord(
      trialGoal,
      { sessionAt: iso(1), trialScores: ['Independent', 'Model'] },
      observer,
      [],
      at(4),
      'ioa_1'
    );
    expect(r).toEqual({
      ok: true,
      record: {
        ioa_id: 'ioa_1',
        goal_id: 'g_C1',
        session_at: iso(1),
        method: 'trial_by_trial',
        primary: { observer_id: 'أ. سارة', trial_scores: ['Independent', 'Gestural'] },
        secondary: {
          observer_id: 'مشرفة',
          observer_name: 'مشرفة',
          observer_role: 'SPECIALIST',
          trial_scores: ['Independent', 'Model'],
        },
        agreement_pct: 50,
        independence_agreement_pct: 100,
        meets_standard: false,
        recorded_at: iso(4),
        recorded_by: 'spec_2',
      },
    });
    const count = buildIoaRecord(trialGoal, { sessionAt: iso(3), totalCount: '5', notes: ' ok ' }, observer, [], at(4));
    expect(count.ok && count.record).toMatchObject({ method: 'total_count', agreement_pct: 80, meets_standard: true, notes: 'ok' });
  });

  it('enforces observer independence and complete data', () => {
    const errorsOf = (input: Parameters<typeof buildIoaRecord>[1], existing: IoaRecord[] = [], name = 'مشرفة') => {
      const r = buildIoaRecord(trialGoal, input, { userId: 'u', name }, existing, at(4));
      return r.ok ? [] : r.errors;
    };
    expect(errorsOf({ sessionAt: iso(9) })).toEqual(['SESSION_NOT_FOUND']);
    expect(errorsOf({ sessionAt: iso(2) })).toEqual(['IOA_NOT_AVAILABLE']);
    expect(errorsOf({ sessionAt: iso(1), trialScores: ['Independent', 'Model'] }, [], ' أ.  سارة ')).toEqual([
      'SAME_OBSERVER',
    ]);
    expect(errorsOf({ sessionAt: iso(1), trialScores: ['Independent', 'Model'] }, [], '')).toEqual(['OBSERVER_REQUIRED']);
    expect(errorsOf({ sessionAt: iso(1), trialScores: [] })).toEqual(['TRIAL_SCORES_REQUIRED']);
    expect(errorsOf({ sessionAt: iso(1), trialScores: ['Independent'] })).toEqual(['TRIAL_COUNT_MISMATCH']);
    expect(errorsOf({ sessionAt: iso(3) })).toEqual(['TOTAL_REQUIRED']);
    const first = buildIoaRecord(trialGoal, { sessionAt: iso(3), totalCount: 4 }, { userId: 'u', name: 'مشرفة' }, [], at(4));
    if (!first.ok) throw new Error('expected ok');
    expect(errorsOf({ sessionAt: iso(3), totalCount: 4 }, [first.record])).toEqual(['IOA_EXISTS']);
  });

  it('lists comparable sessions without exposing the primary data', () => {
    expect(ioaSessionOptions(trialGoal)).toEqual([
      { at: iso(3), method: 'total_count' },
      { at: iso(1), method: 'trial_by_trial', trials: 2 },
    ]);
  });

  it('summarizes agreement, coverage and records below the standard', () => {
    const records: IoaRecord[] = [
      { ...buildRecord(trialGoal, iso(1), 50) },
      { ...buildRecord(trialGoal, iso(3), 90) },
    ];
    const s = summarizeIoa([trialGoal], records);
    expect(s).toMatchObject({
      records: 2,
      meanAgreementPct: 70,
      meetingStandardPct: 50,
      coveragePct: 100,
      coverageTargetPct: 20,
      acceptablePct: 80,
    });
    expect(s.belowStandard.map((r) => r.agreement_pct)).toEqual([50]);
    expect(s.byGoal).toEqual([{ goalId: 'g_C1', sessions: 2, ioaSessions: 2, coveragePct: 100, meanAgreementPct: 70 }]);
    expect(summarizeIoa([trialGoal], [])).toMatchObject({ meanAgreementPct: null, meetingStandardPct: null, coveragePct: 0 });
  });
});

function buildRecord(g: TrackedGoal, sessionAt: string, pct: number): IoaRecord {
  return {
    ioa_id: `ioa_${sessionAt}`,
    goal_id: g.id,
    session_at: sessionAt,
    method: 'total_count',
    primary: { observer_id: 'a' },
    secondary: { observer_id: 'b' },
    agreement_pct: pct,
    meets_standard: pct >= 80,
    recorded_at: sessionAt,
    recorded_by: 'b',
  };
}

describe('server FBA and IOA services', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'taaluf-fba-ioa-'));
    process.env.TAALUF_DATA_DIR = tmpDir;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL;
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    delete process.env.TAALUF_DATA_DIR;
  });

  async function seedChild() {
    await linkChild(parent, 'child_1', undefined, at(0));
    await importGoals(parent, 'child_1', [behaviorGoal({ id: 'g_beh' })], [], at(0));
    const session = await performGoalAction(
      parent,
      'child_1',
      'g_beh',
      {
        type: 'session',
        input: { behaviorValue: 3, trainerName: 'الأم', abcIncidents: [incident(), incident()], replacementBehaviorCount: 1 },
      },
      at(1)
    );
    if (!session.ok) throw new Error(`session failed: ${JSON.stringify(session)}`);
    return session.goal.sessions[0].at;
  }

  it('records FBA plans for staff only and audits ABC data and plan updates', async () => {
    await seedChild();
    const planAction = { type: 'fba_plan' as const, input: { targetBehavior: 'يرمي', replacementBehavior: 'يطلب استراحة' } };
    expect(await performGoalAction(parent, 'child_1', 'g_beh', planAction)).toEqual({
      ok: false,
      status: 403,
      error: 'FORBIDDEN',
    });
    expect(await performGoalAction(admin, 'child_1', 'g_beh', planAction, at(2))).toMatchObject({ ok: true });
    const record = await loadChildRecord('child_1');
    expect(record?.goals[0].fbaPlan?.replacement_behavior).toBe('يطلب استراحة');
    expect(record?.goals[0].sessions[0].abcIncidents).toHaveLength(2);

    const audit = await loadClinicalAudit('child_1');
    expect(audit.find((e) => e.event === 'session_recorded')?.details).toMatchObject({ abcIncidents: 2 });
    expect(audit.find((e) => e.event === 'fba_plan_updated')?.details).toMatchObject({
      replacementBehavior: 'يطلب استراحة',
      first: true,
    });
  });

  it('lets a second staff observer record IOA and supervisors review it; parents and advisors cannot record', async () => {
    const sessionAt = await seedChild();
    const input = { goalId: 'g_beh', sessionAt, totalCount: 4 };

    expect(await recordIoa(parent, 'child_1', input)).toEqual({ ok: false, status: 403, error: 'FORBIDDEN' });
    expect(await recordIoa(advisor, 'child_1', input)).toEqual({ ok: false, status: 403, error: 'FORBIDDEN' });
    expect(await recordIoa(admin, 'child_1', { ...input, observerName: 'الأم' })).toMatchObject({
      ok: false,
      status: 400,
      error: 'INVALID_IOA',
      errors: ['SAME_OBSERVER'],
    });
    expect(await recordIoa(admin, 'child_1', { ...input, sessionAt: iso(30) })).toMatchObject({ status: 404 });
    expect(await recordIoa(admin, 'child_1', { ...input, goalId: 'missing' })).toMatchObject({ ok: false, status: 404 });

    const ok = await recordIoa(admin, 'child_1', input, at(2));
    expect(ok.ok && ok.record).toMatchObject({ method: 'total_count', agreement_pct: 75, meets_standard: false });
    expect(await recordIoa(admin, 'child_1', input, at(3))).toMatchObject({ status: 409, errors: ['IOA_EXISTS'] });

    expect(await getIoaReview(parent, 'child_1')).toMatchObject({ ok: false, status: 403 });
    const review = await getIoaReview(advisor, 'child_1');
    if (!review.ok) throw new Error('expected review');
    expect(review.records).toHaveLength(1);
    expect(review.summary).toMatchObject({ records: 1, meanAgreementPct: 75, coveragePct: 100 });
    expect(review.summary.belowStandard).toHaveLength(1);

    expect((await loadClinicalAudit('child_1')).map((e) => e.event)).toContain('ioa_recorded');

    expect(await deleteGoal(admin, 'child_1', 'g_beh', at(4))).toEqual({ ok: true });
    expect((await loadChildRecord('child_1'))?.ioaRecords).toEqual([]);
  });
});

import fs from 'fs/promises';
import os from 'os';
import path from 'path';

jest.mock('../lib/auditLog', () => ({ logAction: jest.fn(async () => undefined) }));

import type { ClinicalActor } from '../lib/clinicalAccess';
import type { GoalSession, TrackedGoal } from '../lib/goalsEngine';
import { loadClinicalAudit } from '../lib/server/clinicalAuditStore';
import {
  assignSpecialist,
  deleteGoal,
  getChildRecordForActor,
  importGoals,
  linkChild,
  parentStageForUser,
  performGoalAction,
  recordAssessmentSummary,
} from '../lib/server/clinicalRecordService';
import {
  ClinicalStoreError,
  assertChildId,
  listChildIdsForUser,
  loadChildRecord,
} from '../lib/server/clinicalRecordStore';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse('2026-01-01T09:00:00.000Z');
const at = (days: number) => new Date(T0 + days * DAY);
const iso = (days: number) => at(days).toISOString();

const parent: ClinicalActor = { userId: 'parent_1', role: 'PARENT', name: 'أم' };
const otherParent: ClinicalActor = { userId: 'parent_2', role: 'PARENT' };
const specialist: ClinicalActor = { userId: 'spec_1', role: 'SPECIALIST', name: 'أخصائية' };
const admin: ClinicalActor = { userId: 'admin_1', role: 'SUPER_ADMIN' };
const advisor: ClinicalActor = { userId: 'adv_1', role: 'SCIENTIFIC_ADVISOR' };
const guest: ClinicalActor = { userId: 'guest_1', role: 'GUEST' };

const independent = (day: number): GoalSession => ({
  at: iso(day),
  independencePct: 100,
  fullyIndependent: true,
  firstTrialIndependent: true,
  promptLevel: 'Independent',
});

function goal(id: string, sessions: GoalSession[] = []): TrackedGoal {
  return {
    id,
    childId: 'ignored',
    criterionId: 'C3',
    domain: 'التواصل',
    developmentalDomain: 'receptive_language',
    title: `هدف ${id}`,
    smartText: '',
    baseline: 0,
    target: 100,
    current: 40,
    startDate: iso(0),
    targetDate: iso(90),
    status: 'active',
    sessions,
  };
}

describe('server clinical record service', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'taaluf-clinical-'));
    process.env.TAALUF_DATA_DIR = tmpDir;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL;
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    delete process.env.TAALUF_DATA_DIR;
  });

  it('rejects placeholder and unsafe child ids', () => {
    expect(() => assertChildId('child_local')).toThrow(ClinicalStoreError);
    expect(() => assertChildId('local')).toThrow(ClinicalStoreError);
    expect(() => assertChildId('../etc/passwd')).toThrow(ClinicalStoreError);
    expect(assertChildId('recABC_1')).toBe('recABC_1');
  });

  it('links the first parent, indexes the child and derives the parent stage from the server', async () => {
    expect(await parentStageForUser('parent_1')).toBe('no_child');
    const linked = await linkChild(parent, 'child_1', 'سارة', at(0));
    expect(linked.ok && linked.created).toBe(true);
    expect(await listChildIdsForUser('parent_1')).toEqual(['child_1']);
    expect(await parentStageForUser('parent_1')).toBe('has_child');
    expect(await parentStageForUser('bad id!')).toBeNull();

    const stranger = await linkChild(otherParent, 'child_1', undefined, at(0));
    expect(stranger).toEqual({ ok: false, status: 403, error: 'CHILD_OWNED' });
    expect(await linkChild(guest, 'child_2')).toEqual({ ok: false, status: 403, error: 'FORBIDDEN' });

    const audit = await loadClinicalAudit('child_1');
    expect(audit.map((e) => e.event)).toEqual(['child_linked']);
    expect(audit[0].actorUserId).toBe('parent_1');
  });

  it('migrates browser goals once with history, then adds later goals without history', async () => {
    await linkChild(parent, 'child_1', undefined, at(0));
    const first = await importGoals(parent, 'child_1', [goal('g1', [independent(1)]), { id: '../x' }], [], at(1));
    expect(first.ok && first.imported).toBe(1);
    const record = await loadChildRecord('child_1');
    expect(record?.goals[0]).toMatchObject({ id: 'g1', childId: 'child_1', current: 40 });
    expect(record?.goals[0].sessions).toHaveLength(1);

    const again = await importGoals(parent, 'child_1', [{ ...goal('g1'), current: 99 }, goal('g2', [independent(2)])], [], at(2));
    expect(again.ok && again.imported).toBe(1);
    const after = await loadChildRecord('child_1');
    expect(after?.goals.find((g) => g.id === 'g1')?.current).toBe(40);
    expect(after?.goals.find((g) => g.id === 'g2')).toMatchObject({ sessions: [], current: 0 });

    const events = (await loadClinicalAudit('child_1')).map((e) => e.event);
    expect(events.filter((e) => e === 'records_imported')).toHaveLength(2);
    expect(events.filter((e) => e === 'goal_created')).toHaveLength(2);
  });

  it('builds sessions and maintenance probes on the server and audits mastery and withdrawal', async () => {
    await linkChild(specialist, 'child_s', undefined, at(0));
    await importGoals(specialist, 'child_s', [goal('g1', [independent(1), independent(2)])], [], at(2));

    const session = await performGoalAction(specialist, 'child_s', 'g1', { type: 'session_entry', session: independent(3) }, at(3));
    expect(session.ok).toBe(true);
    const duplicate = await performGoalAction(specialist, 'child_s', 'g1', { type: 'session_entry', session: independent(3) }, at(3));
    expect(duplicate.ok && duplicate.goal.sessions).toHaveLength(3);

    const p1 = await performGoalAction(specialist, 'child_s', 'g1', { type: 'maintenance_probe', input: { independencePct: 60 } }, at(10));
    expect(p1.ok && p1.passed).toBe(false);
    const p2 = await performGoalAction(specialist, 'child_s', 'g1', { type: 'maintenance_probe', input: { independencePct: 50 } }, at(11));
    expect(p2.ok && p2.withdrawn).toBe(true);
    expect(p2.ok && p2.goal.maintenanceProbes?.[0].trainer_id).toBe('أخصائية');

    const events = (await loadClinicalAudit('child_s')).map((e) => e.event);
    expect(events).toEqual(
      expect.arrayContaining(['session_recorded', 'mastery_achieved', 'maintenance_probe_recorded', 'mastery_withdrawn'])
    );
    expect(events.filter((e) => e === 'session_recorded')).toHaveLength(1);
  });

  it('enforces role permissions per action and child ownership', async () => {
    await linkChild(parent, 'child_1', undefined, at(0));
    await importGoals(parent, 'child_1', [goal('g1')], [], at(0));

    expect(
      await performGoalAction(parent, 'child_1', 'g1', { type: 'maintenance_probe', input: { independencePct: 90 } })
    ).toEqual({ ok: false, status: 403, error: 'FORBIDDEN' });
    expect(await performGoalAction(parent, 'child_1', 'g1', { type: 'status', status: 'done' })).toEqual({
      ok: false,
      status: 403,
      error: 'FORBIDDEN',
    });
    expect(
      await performGoalAction(specialist, 'child_1', 'g1', { type: 'session_entry', session: independent(1) })
    ).toEqual({ ok: false, status: 403, error: 'FORBIDDEN' });
    expect(await getChildRecordForActor(advisor, 'child_1', 'read')).toMatchObject({ ok: true });
    expect(await getChildRecordForActor(advisor, 'child_1', 'write')).toMatchObject({ ok: false, status: 403 });
    expect(await getChildRecordForActor(guest, 'child_1', 'read')).toMatchObject({ ok: false, status: 403 });

    const probe = await performGoalAction(
      parent,
      'child_1',
      'g1',
      { type: 'generalization_probe', input: { dimension: 'person', personType: 'parent', independencePct: 80, promptLevel: 'Independent', isFirstTrialColdProbe: true } },
      at(1)
    );
    expect(probe.ok && probe.record.generalizationProbes[0].reported_by).toBe('parent_report');
  });

  it('lets only admins assign specialists, who then gain access', async () => {
    await linkChild(parent, 'child_1', undefined, at(0));
    expect(await assignSpecialist(specialist, 'child_1', 'spec_1')).toMatchObject({ ok: false, status: 403 });
    expect(await assignSpecialist(admin, 'child_1', 'spec_1', at(1))).toMatchObject({ ok: true });
    expect(await getChildRecordForActor(specialist, 'child_1', 'write')).toMatchObject({ ok: true });
    expect(await listChildIdsForUser('spec_1')).toEqual(['child_1']);
    expect((await loadClinicalAudit('child_1')).map((e) => e.event)).toContain('specialist_assigned');
  });

  it('deletes goals for plan editors only and never re-imports a deleted goal', async () => {
    await linkChild(specialist, 'child_s', undefined, at(0));
    await importGoals(specialist, 'child_s', [goal('g1')], [], at(0));
    expect(await deleteGoal(parent, 'child_s', 'g1')).toMatchObject({ ok: false, status: 403 });
    expect(await deleteGoal(specialist, 'child_s', 'g1', at(1))).toEqual({ ok: true });
    const reimport = await importGoals(specialist, 'child_s', [goal('g1')], [], at(2));
    expect(reimport.ok && reimport.imported).toBe(0);
    expect((await loadClinicalAudit('child_s')).map((e) => e.event)).toContain('goal_deleted');
  });

  it('records assessment summaries with an audit entry', async () => {
    await linkChild(parent, 'child_1', undefined, at(0));
    expect(
      await recordAssessmentSummary(parent, 'child_1', { id: 'screen_1', savedAt: iso(1), source: 'screening', percentage: 30 }, at(1))
    ).toEqual({ ok: true });
    expect(
      await recordAssessmentSummary(otherParent, 'child_1', { id: 'x', savedAt: iso(1), source: 'parent' })
    ).toMatchObject({ ok: false, status: 403 });
    const record = await loadChildRecord('child_1');
    expect(record?.assessments).toEqual([
      { id: 'screen_1', savedAt: iso(1), source: 'screening', percentage: 30, recordedBy: 'parent_1' },
    ]);
    expect((await loadClinicalAudit('child_1')).map((e) => e.event)).toContain('assessment_recorded');
  });
});

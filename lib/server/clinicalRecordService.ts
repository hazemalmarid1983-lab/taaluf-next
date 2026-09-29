/**
 * عمليات السجل التربوي على الخادم: تفويض + تعديل + تدقيق في مكان واحد.
 */

import {
  canAccessChild,
  linkDecision,
  type ChildAccessMode,
  type ClinicalActor,
} from '@/lib/clinicalAccess';
import { diffGoalAuditEvents, type AuditDraft } from '@/lib/clinicalAudit';
import {
  applyGoalAction,
  GOAL_ACTION_PERMISSIONS,
  sanitizeImportedGoal,
  sanitizeImportedProbe,
  withoutGoalHistory,
  type GoalAction,
} from '@/lib/clinicalGoalActions';
import { journeysForParent, loadChildJourneys } from '@/lib/childRoom/journeyStore';
import type { GeneralizationProbe } from '@/lib/generalizationIndex';
import type { TrackedGoal } from '@/lib/goalsEngine';
import { buildIoaRecord, summarizeIoa, type IoaInput, type IoaSummary } from '@/lib/ioa';
import type { ParentStage } from '@/lib/parentRouteGuard';
import { hasAnyPermission, hasPermission, type Permission } from '@/lib/permissions';
import { appendClinicalAudit } from '@/lib/server/clinicalAuditStore';
import {
  emptyChildRecord,
  indexChildForUser,
  isValidStoreId,
  listChildIdsForUser,
  loadChildRecord,
  MAX_GOALS_PER_CHILD,
  MAX_IOA_RECORDS_PER_CHILD,
  updateChildRecord,
  type ClinicalAssessmentSummary,
  type ClinicalChildRecord,
} from '@/lib/server/clinicalRecordStore';
import type { IoaRecord } from '@/types/clinical';

export type ServiceFailure = {
  ok: false;
  status: 400 | 403 | 404 | 409;
  error: string;
  errors?: string[];
};

const fail = (status: ServiceFailure['status'], error: string, errors?: string[]): ServiceFailure => ({
  ok: false,
  status,
  error,
  ...(errors ? { errors } : {}),
});

export async function getChildRecordForActor(
  actor: ClinicalActor,
  childId: string,
  mode: ChildAccessMode
): Promise<{ ok: true; record: ClinicalChildRecord } | ServiceFailure> {
  const record = await loadChildRecord(childId);
  if (!record) return fail(404, 'CHILD_NOT_FOUND');
  if (!canAccessChild(actor, record, mode)) return fail(403, 'FORBIDDEN');
  return { ok: true, record };
}

/** ربط المستخدم الحالي بملف طفل (ينشئ السجل إن لم يوجد) */
export async function linkChild(
  actor: ClinicalActor,
  childId: string,
  childName: string | undefined,
  now: Date = new Date()
): Promise<{ ok: true; record: ClinicalChildRecord; created: boolean } | ServiceFailure> {
  const result = await updateChildRecord(childId, (current) => {
    const decision = linkDecision(actor, current);
    if (!decision.ok) return { record: null, result: fail(403, decision.error) };
    const record = current ?? emptyChildRecord(childId, now.toISOString());
    const alreadyLinked =
      record.parentUserIds.includes(actor.userId) || record.specialistUserIds.includes(actor.userId);
    if (decision.as === 'parent' && !record.parentUserIds.includes(actor.userId)) {
      record.parentUserIds = [...record.parentUserIds, actor.userId];
    }
    if (decision.as === 'specialist' && !record.specialistUserIds.includes(actor.userId)) {
      record.specialistUserIds = [...record.specialistUserIds, actor.userId];
    }
    if (childName?.trim() && !record.childName) record.childName = childName.trim().slice(0, 120);
    const changed = !current || (!alreadyLinked && decision.as !== 'admin');
    if (changed) record.updatedAt = now.toISOString();
    return {
      record: changed ? record : null,
      result: { ok: true as const, record, created: !current, linked: changed },
    };
  });
  if (!result.ok) return result;
  if (result.linked) {
    if (isValidStoreId(actor.userId)) await indexChildForUser(actor.userId, childId);
    await appendClinicalAudit(childId, actor, [
      { event: 'child_linked', details: { created: result.created, role: actor.role } },
    ], now);
  }
  return { ok: true, record: result.record, created: result.created };
}

export async function assignSpecialist(
  actor: ClinicalActor,
  childId: string,
  specialistUserId: string,
  now: Date = new Date()
): Promise<{ ok: true; record: ClinicalChildRecord } | ServiceFailure> {
  if (!hasPermission(actor.role, 'manage_all_cases')) return fail(403, 'FORBIDDEN');
  if (!isValidStoreId(specialistUserId)) return fail(400, 'INVALID_ID');
  const result = await updateChildRecord(childId, (current) => {
    if (!current) return { record: null, result: fail(404, 'CHILD_NOT_FOUND') };
    if (current.specialistUserIds.includes(specialistUserId)) {
      return { record: null, result: { ok: true as const, record: current, changed: false } };
    }
    const record = {
      ...current,
      specialistUserIds: [...current.specialistUserIds, specialistUserId],
      updatedAt: now.toISOString(),
    };
    return { record, result: { ok: true as const, record, changed: true } };
  });
  if (!result.ok) return result;
  if (result.changed) {
    await indexChildForUser(specialistUserId, childId);
    await appendClinicalAudit(childId, actor, [
      { event: 'specialist_assigned', details: { specialistUserId } },
    ], now);
  }
  return { ok: true, record: result.record };
}

/**
 * استيراد أهداف ومجسات من المتصفح (ترحيل أو توليد أولي).
 * لا يستبدل أي هدف موجود على الخادم. من لا يملك update_iep_goals يرحّل السجل كاملاً
 * مرة واحدة فقط (حين لا أهداف على الخادم)؛ بعدها تُضاف أهدافه الجديدة بلا سجل سابق.
 */
export async function importGoals(
  actor: ClinicalActor,
  childId: string,
  rawGoals: unknown[],
  rawProbes: unknown[],
  now: Date = new Date()
): Promise<{ ok: true; record: ClinicalChildRecord; imported: number } | ServiceFailure> {
  const result = await updateChildRecord(childId, (current) => {
    if (!current) return { record: null, result: fail(404, 'CHILD_NOT_FOUND') };
    if (!canAccessChild(actor, current, 'write')) return { record: null, result: fail(403, 'FORBIDDEN') };
    const keepHistory = hasPermission(actor.role, 'update_iep_goals') || current.goals.length === 0;
    const known = new Set([...current.goals.map((g) => g.id), ...current.deletedGoalIds]);
    const goals = rawGoals
      .map((g) => sanitizeImportedGoal(g, childId))
      .filter((g): g is TrackedGoal => Boolean(g) && !known.has(g!.id))
      .map((g) => (keepHistory ? g : withoutGoalHistory(g)));
    if (current.goals.length + goals.length > MAX_GOALS_PER_CHILD) {
      return { record: null, result: fail(409, 'TOO_MANY_GOALS') };
    }
    const goalIds = new Set([...current.goals.map((g) => g.id), ...goals.map((g) => g.id)]);
    const knownProbes = new Set(current.generalizationProbes.map((p) => p.probe_id));
    const probes = rawProbes
      .map((p) => sanitizeImportedProbe(p, goalIds, actor.role === 'PARENT'))
      .filter((p): p is GeneralizationProbe => Boolean(p) && !knownProbes.has(p!.probe_id));
    if (!goals.length && !probes.length) {
      return { record: null, result: { ok: true as const, record: current, goals, probes } };
    }
    const record: ClinicalChildRecord = {
      ...current,
      goals: [...current.goals, ...goals],
      generalizationProbes: [...current.generalizationProbes, ...probes],
      updatedAt: now.toISOString(),
    };
    return { record, result: { ok: true as const, record, goals, probes } };
  });
  if (!result.ok) return result;
  if (result.goals.length || result.probes.length) {
    await appendClinicalAudit(childId, actor, [
      {
        event: 'records_imported',
        details: { goals: result.goals.length, generalizationProbes: result.probes.length },
      },
      ...result.goals.flatMap((g) => diffGoalAuditEvents(null, g, now)),
    ], now);
  }
  return { ok: true, record: result.record, imported: result.goals.length };
}

export type GoalActionServiceResult =
  | {
      ok: true;
      goal: TrackedGoal;
      record: ClinicalChildRecord;
      withdrawn?: boolean;
      passed?: boolean;
      countsTowardIndex?: boolean;
    }
  | ServiceFailure;

export async function performGoalAction(
  actor: ClinicalActor,
  childId: string,
  goalId: string,
  action: GoalAction,
  now: Date = new Date()
): Promise<GoalActionServiceResult> {
  if (!hasAnyPermission(actor.role, GOAL_ACTION_PERMISSIONS[action.type])) {
    return fail(403, 'FORBIDDEN');
  }
  const result = await updateChildRecord(childId, (current) => {
    if (!current) return { record: null, result: fail(404, 'CHILD_NOT_FOUND') };
    if (!canAccessChild(actor, current, 'write')) return { record: null, result: fail(403, 'FORBIDDEN') };
    const before = current.goals.find((g) => g.id === goalId);
    if (!before) return { record: null, result: fail(404, 'GOAL_NOT_FOUND') };
    const applied = applyGoalAction(before, action, actor, now);
    if (!applied.ok) return { record: null, result: fail(400, applied.error, applied.errors) };
    const record: ClinicalChildRecord = {
      ...current,
      goals: current.goals.map((g) => (g.id === goalId ? applied.goal : g)),
      generalizationProbes: applied.probe
        ? [...current.generalizationProbes, applied.probe]
        : current.generalizationProbes,
      updatedAt: now.toISOString(),
    };
    const drafts: AuditDraft[] = diffGoalAuditEvents(before, applied.goal, now);
    if (applied.probe) {
      drafts.push({
        goalId,
        event: 'generalization_probe_recorded',
        details: {
          probeId: applied.probe.probe_id,
          dimension: applied.probe.dimension,
          independencePct: applied.probe.independence_pct,
          countsTowardIndex: applied.countsTowardIndex ?? false,
          reportedBy: applied.probe.reported_by,
        },
      });
    }
    return {
      record,
      result: {
        ok: true as const,
        goal: applied.goal,
        record,
        drafts,
        withdrawn: applied.withdrawn,
        passed: applied.passed,
        countsTowardIndex: applied.countsTowardIndex,
      },
    };
  });
  if (!result.ok) return result;
  const { drafts, ...rest } = result;
  await appendClinicalAudit(childId, actor, drafts, now);
  return rest;
}

export async function deleteGoal(
  actor: ClinicalActor,
  childId: string,
  goalId: string,
  now: Date = new Date()
): Promise<{ ok: true } | ServiceFailure> {
  if (!hasPermission(actor.role, 'update_iep_goals')) return fail(403, 'FORBIDDEN');
  const result = await updateChildRecord(childId, (current) => {
    if (!current) return { record: null, result: fail(404, 'CHILD_NOT_FOUND') };
    if (!canAccessChild(actor, current, 'write')) return { record: null, result: fail(403, 'FORBIDDEN') };
    const goal = current.goals.find((g) => g.id === goalId);
    if (!goal) return { record: null, result: fail(404, 'GOAL_NOT_FOUND') };
    return {
      record: {
        ...current,
        goals: current.goals.filter((g) => g.id !== goalId),
        generalizationProbes: current.generalizationProbes.filter((p) => p.goal_id !== goalId),
        ioaRecords: current.ioaRecords.filter((r) => r.goal_id !== goalId),
        deletedGoalIds: [...current.deletedGoalIds, goalId].slice(-500),
        updatedAt: now.toISOString(),
      },
      result: { ok: true as const, goal },
    };
  });
  if (!result.ok) return result;
  await appendClinicalAudit(childId, actor, diffGoalAuditEvents(result.goal, null, now), now);
  return { ok: true };
}

export async function recordAssessmentSummary(
  actor: ClinicalActor,
  childId: string,
  summary: Omit<ClinicalAssessmentSummary, 'recordedBy'>,
  now: Date = new Date()
): Promise<{ ok: true } | ServiceFailure> {
  const result = await updateChildRecord(childId, (current) => {
    if (!current) return { record: null, result: fail(404, 'CHILD_NOT_FOUND') };
    if (!canAccessChild(actor, current, 'write')) return { record: null, result: fail(403, 'FORBIDDEN') };
    const entry: ClinicalAssessmentSummary = { ...summary, recordedBy: actor.userId };
    return {
      record: { ...current, assessments: [entry, ...current.assessments].slice(0, 100), updatedAt: now.toISOString() },
      result: { ok: true as const },
    };
  });
  if (!result.ok) return result;
  await appendClinicalAudit(childId, actor, [
    {
      event: 'assessment_recorded',
      details: { assessmentId: summary.id, source: summary.source, percentage: summary.percentage ?? null },
    },
  ], now);
  return { ok: true };
}

/** تسجيل الملاحظ الثاني: الأخصائي المسند أو المشرف العام — لا ولي الأمر ولا الخبير التربوي (قراءة فقط) */
export const IOA_RECORD_PERMISSIONS: Permission[] = ['record_session_trials'];
/** مراجعة الاتفاق: الفريق المهني بما فيه الخبير التربوي */
export const IOA_REVIEW_PERMISSIONS: Permission[] = ['manage_all_cases', 'manage_assigned_cases', 'review_clinical_content'];

export async function recordIoa(
  actor: ClinicalActor,
  childId: string,
  input: IoaInput,
  now: Date = new Date()
): Promise<{ ok: true; record: IoaRecord } | ServiceFailure> {
  if (!hasAnyPermission(actor.role, IOA_RECORD_PERMISSIONS)) return fail(403, 'FORBIDDEN');
  const result = await updateChildRecord(childId, (current) => {
    if (!current) return { record: null, result: fail(404, 'CHILD_NOT_FOUND') };
    if (!canAccessChild(actor, current, 'write')) return { record: null, result: fail(403, 'FORBIDDEN') };
    const goal = current.goals.find((g) => g.id === input.goalId);
    if (!goal) return { record: null, result: fail(404, 'GOAL_NOT_FOUND') };
    const built = buildIoaRecord(
      goal,
      input,
      { userId: actor.userId, name: actor.name, role: actor.role },
      current.ioaRecords,
      now
    );
    if (!built.ok) {
      const status = built.errors.includes('IOA_EXISTS') ? 409 : built.errors.includes('SESSION_NOT_FOUND') ? 404 : 400;
      return { record: null, result: fail(status, 'INVALID_IOA', built.errors) };
    }
    return {
      record: {
        ...current,
        ioaRecords: [...current.ioaRecords, built.record].slice(-MAX_IOA_RECORDS_PER_CHILD),
        updatedAt: now.toISOString(),
      },
      result: { ok: true as const, record: built.record },
    };
  });
  if (!result.ok) return result;
  const r = result.record;
  await appendClinicalAudit(childId, actor, [
    {
      goalId: r.goal_id,
      event: 'ioa_recorded',
      details: {
        ioaId: r.ioa_id,
        sessionAt: r.session_at,
        method: r.method,
        agreementPct: r.agreement_pct,
        meetsStandard: r.meets_standard,
        secondaryObserver: r.secondary.observer_id,
      },
    },
  ], now);
  return result;
}

export async function getIoaReview(
  actor: ClinicalActor,
  childId: string
): Promise<{ ok: true; records: IoaRecord[]; summary: IoaSummary } | ServiceFailure> {
  if (!hasAnyPermission(actor.role, IOA_REVIEW_PERMISSIONS)) return fail(403, 'FORBIDDEN');
  const found = await getChildRecordForActor(actor, childId, 'read');
  if (!found.ok) return found;
  const { goals, ioaRecords } = found.record;
  return { ok: true, records: ioaRecords, summary: summarizeIoa(goals, ioaRecords) };
}

/**
 * مرحلة ولي الأمر من الخادم — تُحفظ في JWT ويقرؤها الـ middleware.
 * null = تعذّر التحديد (معرّف غير صالح للمخزن) → لا تقييد.
 */
export async function parentStageForUser(userId: string): Promise<ParentStage | null> {
  if (!isValidStoreId(userId)) return null;
  if ((await listChildIdsForUser(userId)).length > 0) return 'has_child';
  const journeys = journeysForParent(await loadChildJourneys(), userId);
  return journeys.length > 0 ? 'has_child' : 'no_child';
}

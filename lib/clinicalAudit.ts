/**
 * أحداث سجل التدقيق السريري — تُشتق من الفرق بين حالتي الهدف قبل التعديل وبعده.
 */

import type { TrackedGoal } from '@/lib/goalsEngine';
import { evaluateGoalLifecycle, MAINTENANCE_PASS_PCT } from '@/lib/maintenanceSchedule';
import type { ClinicalRole } from '@/lib/permissions';

export type ClinicalAuditEvent =
  | 'child_linked'
  | 'specialist_assigned'
  | 'records_imported'
  | 'goal_created'
  | 'goal_deleted'
  | 'goal_status_changed'
  | 'session_recorded'
  | 'mastery_achieved'
  | 'phase_changed'
  | 'maintenance_probe_recorded'
  | 'mastery_withdrawn'
  | 'generalization_probe_recorded'
  | 'assessment_recorded';

export type ClinicalAuditEntry = {
  id: string;
  at: string;
  childId: string;
  goalId?: string;
  actorUserId: string;
  actorRole: ClinicalRole;
  event: ClinicalAuditEvent;
  details: Record<string, string | number | boolean | null>;
};

export type AuditDraft = Omit<ClinicalAuditEntry, 'id' | 'at' | 'childId' | 'actorUserId' | 'actorRole'>;

export const CLINICAL_AUDIT_EVENT_LABELS_AR: Record<ClinicalAuditEvent, string> = {
  child_linked: 'ربط مستخدم بملف الطفل',
  specialist_assigned: 'إسناد أخصائي',
  records_imported: 'نقل سجلات من المتصفح إلى الخادم',
  goal_created: 'إنشاء هدف',
  goal_deleted: 'حذف هدف',
  goal_status_changed: 'تغيير حالة الهدف',
  session_recorded: 'تسجيل جلسة',
  mastery_achieved: 'تحقق الإتقان',
  phase_changed: 'تغيّر مرحلة الهدف',
  maintenance_probe_recorded: 'مجس صيانة',
  mastery_withdrawn: 'سحب الإتقان',
  generalization_probe_recorded: 'مجس تعميم',
  assessment_recorded: 'تسجيل تقييم',
};

/** أحداث التدقيق الناتجة عن تعديل هدف واحد */
export function diffGoalAuditEvents(
  before: TrackedGoal | null,
  after: TrackedGoal | null,
  now: Date = new Date()
): AuditDraft[] {
  if (!before && !after) return [];
  if (!before && after) {
    return [{ goalId: after.id, event: 'goal_created', details: { criterionId: after.criterionId, title: after.title } }];
  }
  if (before && !after) {
    return [{ goalId: before.id, event: 'goal_deleted', details: { criterionId: before.criterionId } }];
  }
  const prev = before!;
  const next = after!;
  const goalId = next.id;
  const events: AuditDraft[] = [];

  if (prev.status !== next.status) {
    events.push({ goalId, event: 'goal_status_changed', details: { from: prev.status, to: next.status } });
  }

  const newSessions = (next.sessions?.length ?? 0) - (prev.sessions?.length ?? 0);
  if (newSessions > 0) {
    const last = next.sessions[next.sessions.length - 1];
    events.push({
      goalId,
      event: 'session_recorded',
      details: {
        independencePct: last?.independencePct ?? null,
        promptLevel: last?.promptLevel ?? null,
        firstTrialIndependent: last?.firstTrialIndependent ?? null,
        metFrequencyCriterion: last?.metFrequencyCriterion ?? null,
      },
    });
  }

  const prevProbes = prev.maintenanceProbes?.length ?? 0;
  for (const probe of (next.maintenanceProbes || []).slice(prevProbes)) {
    events.push({
      goalId,
      event: 'maintenance_probe_recorded',
      details: {
        probeId: probe.probe_id,
        independencePct: probe.independence_pct,
        passed: probe.independence_pct >= MAINTENANCE_PASS_PCT,
      },
    });
  }

  const prevWithdrawals = prev.masteryWithdrawals?.length ?? 0;
  for (const w of (next.masteryWithdrawals || []).slice(prevWithdrawals)) {
    events.push({
      goalId,
      event: 'mastery_withdrawn',
      details: { reason: w.reason, probeIds: w.probe_ids.join(',') },
    });
  }

  const lifeBefore = evaluateGoalLifecycle(prev, now);
  const lifeAfter = evaluateGoalLifecycle(next, now);
  if (!lifeBefore.mastery.mastered && lifeAfter.mastery.mastered) {
    events.push({
      goalId,
      event: 'mastery_achieved',
      details: { masteredAt: lifeAfter.mastered_at ?? null, skillType: lifeAfter.mastery.skill_type_id },
    });
  }
  if (lifeBefore.phase !== lifeAfter.phase) {
    events.push({ goalId, event: 'phase_changed', details: { from: lifeBefore.phase, to: lifeAfter.phase } });
  }
  return events;
}

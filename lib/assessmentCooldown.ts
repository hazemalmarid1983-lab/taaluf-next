/**
 * مدى التقييم الدوري حسب الباقة. إكمال تقييم ليس حكماً سريرياً جديداً كل يوم.
 */

import type { SubscriptionTierId } from '@/lib/subscriptionTiers';

export const ASSESSMENT_COOLDOWN_FILE = 'assessment-cooldowns.json';

export const ASSESSMENT_COOLDOWN_MONTHS: Record<SubscriptionTierId, number> = {
  free_screening: 6,
  child_room: 6,
  clinical: 3,
};

export type AssessmentCooldownRecord = {
  childId: string;
  completedAt: string;
  nextOpenAt: string;
  planId: SubscriptionTierId;
  assessmentId?: string;
};

export type AssessmentCooldownView = {
  open: boolean;
  childId: string;
  planId: SubscriptionTierId;
  months: number;
  completedAt?: string;
  nextOpenAt?: string;
  nextOpenLabel?: string;
  message?: string;
};

export function cooldownMonthsForPlan(planId: SubscriptionTierId): number {
  return ASSESSMENT_COOLDOWN_MONTHS[planId];
}

export function addCalendarMonths(from: Date, months: number): Date {
  const next = new Date(from.getTime());
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  if (next.getDate() < day) next.setDate(0);
  return next;
}

export function formatCooldownDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export function cooldownMessage(nextOpenAt: Date | string): string {
  return `تم حفظ التقييم بنجاح. التقييم الدوري القادم لقياس التقدم يفتح بتاريخ ${formatCooldownDate(nextOpenAt)}`;
}

export function resolveCooldown(
  record: AssessmentCooldownRecord | null,
  planId: SubscriptionTierId,
  now = new Date()
): AssessmentCooldownView {
  const months = cooldownMonthsForPlan(planId);
  if (!record?.completedAt) {
    return { open: true, childId: '', planId, months };
  }
  const nextOpenAt = record.nextOpenAt || addCalendarMonths(new Date(record.completedAt), months).toISOString();
  const next = new Date(nextOpenAt);
  if (Number.isNaN(next.getTime()) || now.getTime() >= next.getTime()) {
    return {
      open: true,
      childId: record.childId,
      planId,
      months,
      completedAt: record.completedAt,
      nextOpenAt,
      nextOpenLabel: formatCooldownDate(next),
    };
  }
  return {
    open: false,
    childId: record.childId,
    planId,
    months,
    completedAt: record.completedAt,
    nextOpenAt,
    nextOpenLabel: formatCooldownDate(next),
    message: cooldownMessage(next),
  };
}

export function buildCooldownRecord(
  childId: string,
  planId: SubscriptionTierId,
  completedAt = new Date(),
  assessmentId?: string
): AssessmentCooldownRecord {
  const next = addCalendarMonths(completedAt, cooldownMonthsForPlan(planId));
  return {
    childId: childId.trim(),
    completedAt: completedAt.toISOString(),
    nextOpenAt: next.toISOString(),
    planId,
    assessmentId,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

export function parseCooldownFile(raw: string | null): AssessmentCooldownRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { records?: unknown[] };
    if (!Array.isArray(parsed.records)) return [];
    return parsed.records.flatMap((item) => {
      if (!isRecord(item)) return [];
      const childId = String(item.childId || '').trim();
      const completedAt = String(item.completedAt || '').trim();
      if (!childId || !completedAt) return [];
      const planId =
        item.planId === 'clinical' || item.planId === 'child_room' || item.planId === 'free_screening'
          ? item.planId
          : 'child_room';
      const nextOpenAt =
        String(item.nextOpenAt || '') ||
        addCalendarMonths(new Date(completedAt), cooldownMonthsForPlan(planId)).toISOString();
      return [
        {
          childId,
          completedAt,
          nextOpenAt,
          planId,
          assessmentId: item.assessmentId ? String(item.assessmentId) : undefined,
        },
      ];
    });
  } catch {
    return [];
  }
}

export function upsertCooldownRecord(
  records: AssessmentCooldownRecord[],
  next: AssessmentCooldownRecord
): AssessmentCooldownRecord[] {
  return [next, ...records.filter((row) => row.childId !== next.childId)].slice(0, 400);
}

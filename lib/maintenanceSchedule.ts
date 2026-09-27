/**
 * الصيانة التباعدية بعد الإتقان وسحب الإتقان (CLINICAL_RULES).
 * مجسات عند 1 و2 و4 و8 أسابيع من تاريخ الإتقان، ثم مراجعة كل 12 أسبوعاً.
 * مجس دون العتبة يستدعي مجساً تأكيدياً؛ مجسان متتاليان دون العتبة يسحبان الإتقان.
 */

import type { TrackedGoal } from '@/lib/goalsEngine';
import { normalizeTrainerId } from '@/lib/goalSessionForm';
import {
  evaluateGoalMastery,
  type SessionSetting,
  type SkillMasteryResult,
} from '@/lib/skillMastery';
import type {
  GoalLifecyclePhase,
  MaintenanceProbe,
  MasteryWithdrawal,
} from '@/types/clinical';

export type { GoalLifecyclePhase, MaintenanceProbe, MasteryWithdrawal };

export const MAINTENANCE_SCHEDULE_WEEKS = [1, 2, 4, 8] as const;
export const MAINTENANCE_PASS_PCT = 80;
export const MAINTENANCE_FAILS_TO_WITHDRAW = 2;
export const MAINTENANCE_CONFIRMATION_HOURS = 48;
export const MAINTENANCE_REVIEW_WEEKS = 12;
/** مجس ناجح قبل موعده بأكثر من يوم لا يُكمل الخطوة */
export const MAINTENANCE_EARLY_TOLERANCE_HOURS = 24;

export const GOAL_PHASE_LABELS_AR: Record<GoalLifecyclePhase, string> = {
  acquisition: 'اكتساب',
  maintenance: 'صيانة بعد الإتقان',
  maintained: 'محفوظ — مراجعة كل 12 أسبوعاً',
  re_acquisition: 'إعادة اكتساب',
};

const HOUR_MS = 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * HOUR_MS;

function addMs(iso: string, ms: number): string {
  return new Date(Date.parse(iso) + ms).toISOString();
}

export type MaintenanceStepStatus = 'passed' | 'due' | 'upcoming';

export interface MaintenanceStep {
  step: number;
  weeks: number;
  due_at: string;
  status: MaintenanceStepStatus;
  probe_id?: string;
}

export type NextProbeKind = 'scheduled' | 'confirmation' | 'review';

export interface GoalLifecycle {
  phase: GoalLifecyclePhase;
  mastery: SkillMasteryResult;
  mastered_at?: string;
  steps: MaintenanceStep[];
  next_probe_due_at?: string;
  next_probe_kind?: NextProbeKind;
  probe_due_now: boolean;
  /** مجس فاشل ينتظر التأكيد */
  pending_failure?: MaintenanceProbe;
  /** مجسان متتاليان دون العتبة ولم يُسجَّل السحب بعد */
  withdrawal_due?: { probe_ids: string[] };
  last_withdrawal?: MasteryWithdrawal;
}

export type LifecycleGoalInput = Pick<
  TrackedGoal,
  | 'id'
  | 'criterionId'
  | 'developmentalDomain'
  | 'sessions'
  | 'maintenanceProbes'
  | 'masteryWithdrawals'
>;

function latestWithdrawal(goal: LifecycleGoalInput): MasteryWithdrawal | undefined {
  return [...(goal.masteryWithdrawals || [])].sort((a, b) => a.at.localeCompare(b.at)).pop();
}

export function evaluateGoalLifecycle(
  goal: LifecycleGoalInput,
  now: Date = new Date()
): GoalLifecycle {
  const mastery = evaluateGoalMastery(goal);
  const last_withdrawal = latestWithdrawal(goal);
  if (!mastery.mastered || !mastery.mastered_at) {
    return {
      phase: last_withdrawal ? 're_acquisition' : 'acquisition',
      mastery,
      steps: [],
      probe_due_now: false,
      last_withdrawal,
    };
  }

  const masteredAt = mastery.mastered_at;
  const dueAt = (step: number) => addMs(masteredAt, MAINTENANCE_SCHEDULE_WEEKS[step] * WEEK_MS);
  const probes = (goal.maintenanceProbes || [])
    .filter((p) => p.date > masteredAt)
    .sort((a, b) => a.date.localeCompare(b.date));

  const passedProbeIds: string[] = [];
  let pending: MaintenanceProbe | undefined;
  let lastPassAt: string | undefined;
  let withdrawal_due: GoalLifecycle['withdrawal_due'];

  for (const probe of probes) {
    const passed = probe.independence_pct >= MAINTENANCE_PASS_PCT;
    if (!passed) {
      if (pending) {
        withdrawal_due = { probe_ids: [pending.probe_id, probe.probe_id] };
        break;
      }
      pending = probe;
      continue;
    }
    lastPassAt = probe.date;
    const step = passedProbeIds.length;
    if (pending) {
      pending = undefined;
      if (step < MAINTENANCE_SCHEDULE_WEEKS.length) passedProbeIds.push(probe.probe_id);
      continue;
    }
    if (
      step < MAINTENANCE_SCHEDULE_WEEKS.length &&
      Date.parse(probe.date) >= Date.parse(dueAt(step)) - MAINTENANCE_EARLY_TOLERANCE_HOURS * HOUR_MS
    ) {
      passedProbeIds.push(probe.probe_id);
    }
  }

  const completed = passedProbeIds.length;
  const steps: MaintenanceStep[] = MAINTENANCE_SCHEDULE_WEEKS.map((weeks, i) => {
    const due_at = dueAt(i);
    return {
      step: i + 1,
      weeks,
      due_at,
      status: i < completed ? 'passed' : now.getTime() >= Date.parse(due_at) ? 'due' : 'upcoming',
      ...(i < completed ? { probe_id: passedProbeIds[i] } : {}),
    };
  });

  if (withdrawal_due) {
    return {
      phase: 're_acquisition',
      mastery,
      mastered_at: masteredAt,
      steps,
      probe_due_now: false,
      withdrawal_due,
      last_withdrawal,
    };
  }

  let next_probe_due_at: string;
  let next_probe_kind: NextProbeKind;
  if (pending) {
    next_probe_due_at = addMs(pending.date, MAINTENANCE_CONFIRMATION_HOURS * HOUR_MS);
    next_probe_kind = 'confirmation';
  } else if (completed < MAINTENANCE_SCHEDULE_WEEKS.length) {
    next_probe_due_at = dueAt(completed);
    next_probe_kind = 'scheduled';
  } else {
    next_probe_due_at = addMs(lastPassAt ?? masteredAt, MAINTENANCE_REVIEW_WEEKS * WEEK_MS);
    next_probe_kind = 'review';
  }

  return {
    phase: completed >= MAINTENANCE_SCHEDULE_WEEKS.length && !pending ? 'maintained' : 'maintenance',
    mastery,
    mastered_at: masteredAt,
    steps,
    next_probe_due_at,
    next_probe_kind,
    probe_due_now: now.getTime() >= Date.parse(next_probe_due_at),
    pending_failure: pending,
    last_withdrawal,
  };
}

export type MaintenanceProbeInput = {
  independencePct?: number | string;
  trainerName?: string;
  setting?: SessionSetting | '';
  notes?: string;
};

export type MaintenanceProbeError = 'NOT_MASTERED' | 'INDEPENDENCE_REQUIRED';

export const MAINTENANCE_PROBE_ERRORS_AR: Record<MaintenanceProbeError, string> = {
  NOT_MASTERED: 'مجسات الصيانة متاحة بعد إتقان الهدف فقط',
  INDEPENDENCE_REQUIRED: 'أدخل نسبة الاستقلالية بين 0 و100',
};

export type MaintenanceProbeResult =
  | {
      ok: true;
      goal: TrackedGoal;
      probe: MaintenanceProbe;
      passed: boolean;
      withdrawn: boolean;
      lifecycle: GoalLifecycle;
    }
  | { ok: false; errors: MaintenanceProbeError[] };

/** يسجّل مجس صيانة، ويسحب الإتقان تلقائياً عند فشل مجسين متتاليين */
export function recordMaintenanceProbe(
  goal: TrackedGoal,
  input: MaintenanceProbeInput,
  now: Date = new Date(),
  probeId?: string
): MaintenanceProbeResult {
  const errors: MaintenanceProbeError[] = [];
  const before = evaluateGoalLifecycle(goal, now);
  if (before.phase !== 'maintenance' && before.phase !== 'maintained') errors.push('NOT_MASTERED');
  const raw = input.independencePct;
  const pct = raw === '' || raw === undefined ? NaN : Number(raw);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) errors.push('INDEPENDENCE_REQUIRED');
  if (errors.length) return { ok: false, errors };

  const date = now.toISOString();
  const probe: MaintenanceProbe = {
    probe_id: probeId ?? `mprobe_${now.getTime().toString(36)}`,
    goal_id: goal.id,
    date,
    independence_pct: Math.round(pct),
    trainer_id: normalizeTrainerId(input.trainerName),
    setting: input.setting || undefined,
    notes: input.notes?.trim() || undefined,
  };

  let next: TrackedGoal = {
    ...goal,
    lastUpdate: date,
    maintenanceProbes: [...(goal.maintenanceProbes || []), probe],
  };
  let lifecycle = evaluateGoalLifecycle(next, now);
  const withdrawn = Boolean(lifecycle.withdrawal_due);
  if (lifecycle.withdrawal_due) {
    next = {
      ...next,
      status: 'active',
      masteryWithdrawals: [
        ...(goal.masteryWithdrawals || []),
        {
          at: date,
          reason: 'consecutive_maintenance_probes_below_threshold',
          probe_ids: lifecycle.withdrawal_due.probe_ids,
        },
      ],
    };
    lifecycle = evaluateGoalLifecycle(next, now);
  }

  return {
    ok: true,
    goal: next,
    probe,
    passed: probe.independence_pct >= MAINTENANCE_PASS_PCT,
    withdrawn,
    lifecycle,
  };
}

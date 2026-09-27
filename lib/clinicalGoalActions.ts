/**
 * تعديلات الأهداف على الخادم: الخادم يبني الجلسة والمجسات من مدخلات النموذج
 * ولا يثق بهدف محسوب في المتصفح.
 */

import type { ClinicalActor } from '@/lib/clinicalAccess';
import {
  buildGeneralizationProbe,
  type GeneralizationProbeInput,
} from '@/lib/generalizationProbeStore';
import type { GeneralizationProbe } from '@/lib/generalizationIndex';
import type { FrequencyTarget, GoalSession, TrackedGoal } from '@/lib/goalsEngine';
import { buildGoalSessionFromForm, type GoalSessionFormInput } from '@/lib/goalSessionForm';
import {
  recordMaintenanceProbe,
  type MaintenanceProbeInput,
} from '@/lib/maintenanceSchedule';
import type { Permission } from '@/lib/permissions';
import { SESSION_SETTING_LABELS_AR, isDigitalAssistanceCue, toClinicalPromptLevel } from '@/lib/skillMastery';
import { DIGITAL_PROMPT_MAPPING, type MaintenanceProbe, type MasteryWithdrawal } from '@/types/clinical';

export type GoalAction =
  | { type: 'session'; input: GoalSessionFormInput }
  | { type: 'session_entry'; session: unknown }
  | { type: 'maintenance_probe'; input: MaintenanceProbeInput }
  | { type: 'generalization_probe'; input: GeneralizationProbeInput }
  | { type: 'status'; status: unknown };

export type GoalActionType = GoalAction['type'];

export const GOAL_ACTION_PERMISSIONS: Record<GoalActionType, Permission[]> = {
  session: ['record_session_trials', 'run_home_session'],
  session_entry: ['record_session_trials', 'run_home_session'],
  maintenance_probe: ['record_session_trials'],
  generalization_probe: ['record_session_trials', 'run_home_session'],
  status: ['update_iep_goals'],
};

export function parseGoalAction(body: unknown): GoalAction | null {
  const b = body as Record<string, unknown> | null;
  switch (b?.action) {
    case 'session':
    case 'maintenance_probe':
    case 'generalization_probe':
      return { type: b.action, input: (b.input ?? {}) as never };
    case 'session_entry':
      return { type: 'session_entry', session: b.session };
    case 'status':
      return { type: 'status', status: b.status };
    default:
      return null;
  }
}

const SETTINGS = new Set(Object.keys(SESSION_SETTING_LABELS_AR));
const isIso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const optNum = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const optBool = (v: unknown) => (typeof v === 'boolean' ? v : undefined);
const optStr = (v: unknown, max = 500) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;
const pct = (v: unknown) => {
  const n = optNum(v);
  return n === undefined ? undefined : Math.min(100, Math.max(0, Math.round(n)));
};

function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

/** جلسة مستوردة أو من محرك التدريب — الحقول المعروفة فقط وبأنواعها */
export function sanitizeGoalSession(raw: unknown): GoalSession | null {
  const s = raw as Record<string, unknown> | null;
  if (!s || !isIso(s.at)) return null;
  const setting = typeof s.setting === 'string' && SETTINGS.has(s.setting) ? s.setting : undefined;
  const digitalPromptCue = isDigitalAssistanceCue(s.digitalPromptCue) ? s.digitalPromptCue : undefined;
  const promptLevel = digitalPromptCue
    ? DIGITAL_PROMPT_MAPPING[digitalPromptCue].clinical_level
    : toClinicalPromptLevel(typeof s.promptLevel === 'string' ? s.promptLevel : undefined);
  const promptSource: GoalSession['promptSource'] = digitalPromptCue
    ? 'digital_assistance'
    : s.promptSource === 'human' && promptLevel
      ? 'human'
      : undefined;
  return compact({
    at: new Date(s.at).toISOString(),
    mood: optStr(s.mood, 8),
    activity: optStr(s.activity, 200),
    notes: optStr(s.notes, 1000),
    progress: pct(s.progress),
    fullyIndependent: optBool(s.fullyIndependent),
    independencePct: pct(s.independencePct),
    firstTrialIndependent: optBool(s.firstTrialIndependent),
    naturalCueOnly: optBool(s.naturalCueOnly),
    promptLevel,
    promptSource,
    digitalPromptCue,
    trainerId: optStr(s.trainerId, 120),
    setting: setting as GoalSession['setting'],
    metFrequencyCriterion: optBool(s.metFrequencyCriterion),
    behaviorCount: optNum(s.behaviorCount),
    behaviorDurationMinutes: optNum(s.behaviorDurationMinutes),
  });
}

function sanitizeMaintenanceProbe(raw: unknown, goalId: string): MaintenanceProbe | null {
  const p = raw as Record<string, unknown> | null;
  const independence = pct(p?.independence_pct);
  if (!p || typeof p.probe_id !== 'string' || !isIso(p.date) || independence === undefined) return null;
  return compact({
    probe_id: p.probe_id.slice(0, 80),
    goal_id: goalId,
    date: new Date(p.date).toISOString(),
    independence_pct: independence,
    trainer_id: optStr(p.trainer_id, 120),
    setting: (typeof p.setting === 'string' && SETTINGS.has(p.setting) ? p.setting : undefined) as MaintenanceProbe['setting'],
    notes: optStr(p.notes, 1000),
  });
}

function sanitizeWithdrawal(raw: unknown): MasteryWithdrawal | null {
  const w = raw as Record<string, unknown> | null;
  if (!w || !isIso(w.at) || w.reason !== 'consecutive_maintenance_probes_below_threshold') return null;
  return {
    at: new Date(w.at).toISOString(),
    reason: w.reason,
    probe_ids: Array.isArray(w.probe_ids) ? w.probe_ids.filter((x): x is string => typeof x === 'string') : [],
  };
}

function sanitizeFrequencyTarget(raw: unknown): FrequencyTarget | undefined {
  const t = raw as Record<string, unknown> | null;
  const target = optNum(t?.target);
  if (!t || target === undefined || target < 0) return undefined;
  if (t.measure !== 'count' && t.measure !== 'duration_minutes') return undefined;
  if (t.direction !== 'decrease' && t.direction !== 'increase') return undefined;
  return { measure: t.measure, direction: t.direction, target };
}

const SAFE_GOAL_ID = /^[A-Za-z0-9_.:-]{1,120}$/;
const STATUSES = new Set<TrackedGoal['status']>(['active', 'done', 'paused']);

/** هدف مستورد من المتصفح (ترحيل أو توليد أولي) — يُفرض عليه معرّف الطفل */
export function sanitizeImportedGoal(raw: unknown, childId: string): TrackedGoal | null {
  const g = raw as Record<string, unknown> | null;
  if (!g || typeof g.id !== 'string' || !SAFE_GOAL_ID.test(g.id)) return null;
  const criterionId = optStr(g.criterionId, 20);
  const title = optStr(g.title, 300);
  if (!criterionId || !title) return null;
  const status = STATUSES.has(g.status as TrackedGoal['status']) ? (g.status as TrackedGoal['status']) : 'active';
  const goal: TrackedGoal = {
    id: g.id,
    childId,
    criterionId,
    domain: optStr(g.domain, 200) ?? '',
    title,
    smartText: optStr(g.smartText, 2000) ?? '',
    baseline: optNum(g.baseline) ?? 0,
    target: optNum(g.target) ?? 100,
    current: optNum(g.current) ?? 0,
    startDate: isIso(g.startDate) ? g.startDate : new Date().toISOString(),
    targetDate: isIso(g.targetDate) ? g.targetDate : new Date().toISOString(),
    status,
    sessions: (Array.isArray(g.sessions) ? g.sessions : [])
      .map(sanitizeGoalSession)
      .filter((s): s is GoalSession => Boolean(s))
      .slice(-500),
  };
  if (typeof g.developmentalDomain === 'string') {
    goal.developmentalDomain = g.developmentalDomain as TrackedGoal['developmentalDomain'];
  }
  if (isIso(g.lastUpdate)) goal.lastUpdate = g.lastUpdate;
  const frequencyTarget = sanitizeFrequencyTarget(g.frequencyTarget);
  if (frequencyTarget) goal.frequencyTarget = frequencyTarget;
  const probes = (Array.isArray(g.maintenanceProbes) ? g.maintenanceProbes : [])
    .map((p) => sanitizeMaintenanceProbe(p, goal.id))
    .filter((p): p is MaintenanceProbe => Boolean(p));
  if (probes.length) goal.maintenanceProbes = probes;
  const withdrawals = (Array.isArray(g.masteryWithdrawals) ? g.masteryWithdrawals : [])
    .map(sanitizeWithdrawal)
    .filter((w): w is MasteryWithdrawal => Boolean(w));
  if (withdrawals.length) goal.masteryWithdrawals = withdrawals;
  return goal;
}

/** هدف جديد بلا سجل (جلسات/مجسات/سحب) — لمن لا يملك تعديل الخطة بعد الترحيل الأول */
export function withoutGoalHistory(goal: TrackedGoal): TrackedGoal {
  const fresh: TrackedGoal = { ...goal, status: 'active', current: goal.baseline, sessions: [] };
  delete fresh.maintenanceProbes;
  delete fresh.masteryWithdrawals;
  delete fresh.lastUpdate;
  return fresh;
}

export function sanitizeImportedProbe(
  raw: unknown,
  goalIds: Set<string>,
  forceParentReport = false
): GeneralizationProbe | null {
  const p = raw as GeneralizationProbe | null;
  if (!p || typeof p.probe_id !== 'string' || !goalIds.has(p.goal_id) || !isIso(p.date)) return null;
  const result = buildGeneralizationProbe(
    {
      dimension: p.dimension,
      personType: p.details?.person_type,
      personName: p.details?.person_id,
      setting: p.details?.setting,
      materialUsed: p.details?.material_used,
      isNovelMaterial: p.details?.is_novel_material,
      independencePct: p.independence_pct,
      promptLevel: p.prompt_level,
      isFirstTrialColdProbe: p.is_first_trial_cold_probe,
      moodState: p.mood_state,
      notes: p.notes,
    },
    {
      goalId: p.goal_id,
      reportedBy: forceParentReport || p.reported_by === 'parent_report' ? 'parent_report' : 'professional',
      now: new Date(p.date),
      probeId: p.probe_id.slice(0, 80),
    }
  );
  return result.ok ? result.probe : null;
}

export type GoalActionResult =
  | { ok: true; goal: TrackedGoal; probe?: GeneralizationProbe; message?: string; withdrawn?: boolean; passed?: boolean; countsTowardIndex?: boolean }
  | { ok: false; status: 400; error: string; errors?: string[] };

/** يطبّق إجراءً على هدف مخزّن ويعيد الهدف الجديد */
export function applyGoalAction(
  goal: TrackedGoal,
  action: GoalAction,
  actor: ClinicalActor,
  now: Date = new Date()
): GoalActionResult {
  switch (action.type) {
    case 'session': {
      const input: GoalSessionFormInput = {
        ...action.input,
        trainerName: action.input.trainerName || actor.name,
      };
      const built = buildGoalSessionFromForm(goal, input, now);
      if (!built.ok) return { ok: false, status: 400, error: 'INVALID_SESSION', errors: built.errors };
      const progress = pct(action.input.progress);
      return {
        ok: true,
        goal: progress === undefined ? built.goal : { ...built.goal, current: progress },
      };
    }
    case 'session_entry': {
      const session = sanitizeGoalSession(action.session);
      if (!session) return { ok: false, status: 400, error: 'INVALID_SESSION' };
      if ((goal.sessions || []).some((s) => s.at === session.at)) return { ok: true, goal };
      return {
        ok: true,
        goal: {
          ...goal,
          current: session.progress ?? goal.current,
          lastUpdate: session.at,
          sessions: [...(goal.sessions || []), session],
        },
      };
    }
    case 'maintenance_probe': {
      const result = recordMaintenanceProbe(
        goal,
        { ...action.input, trainerName: action.input.trainerName || actor.name },
        now
      );
      if (!result.ok) return { ok: false, status: 400, error: 'INVALID_MAINTENANCE_PROBE', errors: result.errors };
      return { ok: true, goal: result.goal, withdrawn: result.withdrawn, passed: result.passed };
    }
    case 'generalization_probe': {
      const result = buildGeneralizationProbe(action.input, {
        goalId: goal.id,
        reportedBy: actor.role === 'PARENT' ? 'parent_report' : 'professional',
        now,
      });
      if (!result.ok) return { ok: false, status: 400, error: 'INVALID_GENERALIZATION_PROBE', errors: result.errors };
      return { ok: true, goal, probe: result.probe, countsTowardIndex: result.countsTowardIndex };
    }
    case 'status': {
      if (!STATUSES.has(action.status as TrackedGoal['status'])) {
        return { ok: false, status: 400, error: 'INVALID_STATUS' };
      }
      return {
        ok: true,
        goal: { ...goal, status: action.status as TrackedGoal['status'], lastUpdate: now.toISOString() },
      };
    }
  }
}

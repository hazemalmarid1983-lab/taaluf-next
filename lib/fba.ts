/**
 * التقييم الوظيفي للسلوك (FBA) للأهداف السلوكية: حوادث ABC داخل جلسات التكرار/المدة،
 * وخطة الهدف (التعريف الإجرائي، السلوك البديل، الوظيفة المرجّحة)، وملخص وصفي يرجّح الوظيفة.
 */

import type { GoalSession, TrackedGoal } from '@/lib/goalsEngine';
import {
  FBA_ANTECEDENT_FUNCTION,
  FBA_CONSEQUENCE_FUNCTION,
  FBA_MIN_FUNCTION_SHARE,
  FBA_MIN_INCIDENTS_FOR_HYPOTHESIS,
  type AbcIncident,
  type BehaviorFunction,
  type FbaAntecedent,
  type FbaConsequence,
  type FbaPlan,
} from '@/types/clinical';

export const FBA_ANTECEDENT_LABELS_AR: Record<FbaAntecedent, string> = {
  demand_placed: 'طُلب منه أداء مهمة',
  denied_access: 'مُنع من شيء يريده / سُحب منه',
  transition: 'انتقال بين نشاطين',
  attention_diverted: 'انشغال البالغ عنه',
  waiting: 'انتظار دوره أو شيء يريده',
  alone_unstructured: 'وقت حر دون نشاط منظّم',
  sensory_environment: 'مثير حسي في البيئة (ضجيج، ازدحام، إضاءة)',
  other: 'أخرى',
};

export const FBA_CONSEQUENCE_LABELS_AR: Record<FbaConsequence, string> = {
  attention_given: 'حصل على انتباه (كلام، توبيخ، تهدئة)',
  demand_removed: 'أُلغيت المهمة أو أُجّلت',
  item_given: 'حصل على الشيء أو النشاط',
  no_social_response: 'استمر دون أي تفاعل من الآخرين',
  planned_ignoring: 'تجاهل مخطّط',
  redirected_to_replacement: 'وُجّه إلى السلوك البديل',
  blocked: 'مُنع السلوك جسدياً (للسلامة)',
  other: 'أخرى',
};

export const BEHAVIOR_FUNCTION_LABELS_AR: Record<BehaviorFunction, string> = {
  escape: 'الهروب أو التجنّب',
  attention: 'جذب الانتباه',
  tangible: 'الحصول على شيء ملموس',
  automatic: 'تعزيز ذاتي / حسي',
};

export const FBA_ANTECEDENTS = Object.keys(FBA_ANTECEDENT_LABELS_AR) as FbaAntecedent[];
export const FBA_CONSEQUENCES = Object.keys(FBA_CONSEQUENCE_LABELS_AR) as FbaConsequence[];
export const BEHAVIOR_FUNCTIONS = Object.keys(BEHAVIOR_FUNCTION_LABELS_AR) as BehaviorFunction[];

export const MAX_ABC_INCIDENTS_PER_SESSION = 50;

const has = <T extends string>(labels: Record<T, string>, v: unknown): v is T =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(labels, v);

const note = (v: unknown, max = 300) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;

/** مدخل حادثة من النموذج أو الشبكة — null إذا كان المثير القبلي أو البعدي غير معروف */
export function sanitizeAbcIncident(raw: unknown): AbcIncident | null {
  const i = raw as Record<string, unknown> | null;
  if (!i || !has(FBA_ANTECEDENT_LABELS_AR, i.antecedent) || !has(FBA_CONSEQUENCE_LABELS_AR, i.consequence)) {
    return null;
  }
  const duration = typeof i.duration_minutes === 'number' && Number.isFinite(i.duration_minutes) && i.duration_minutes >= 0
    ? i.duration_minutes
    : undefined;
  const incident: AbcIncident = {
    antecedent: i.antecedent,
    consequence: i.consequence,
    replacement_behavior_used: i.replacement_behavior_used === true,
  };
  const antecedentNote = note(i.antecedent_note);
  const behaviorNote = note(i.behavior_note);
  const consequenceNote = note(i.consequence_note);
  if (antecedentNote) incident.antecedent_note = antecedentNote;
  if (behaviorNote) incident.behavior_note = behaviorNote;
  if (consequenceNote) incident.consequence_note = consequenceNote;
  if (duration !== undefined) incident.duration_minutes = duration;
  return incident;
}

export type AbcValidationError = 'INVALID_ABC_INCIDENT' | 'ABC_EXCEEDS_BEHAVIOR_COUNT' | 'ABC_EXCEEDS_DURATION';

/**
 * يربط الحوادث بقياس الجلسة: عددها لا يتجاوز عدد مرات السلوك،
 * ومجموع مددها لا يتجاوز مدة السلوك المسجّلة.
 */
export function validateAbcIncidents(
  raw: unknown,
  measure: { behaviorCount?: number; behaviorDurationMinutes?: number }
): { ok: true; incidents: AbcIncident[] } | { ok: false; error: AbcValidationError } {
  if (raw === undefined || raw === null) return { ok: true, incidents: [] };
  if (!Array.isArray(raw) || raw.length > MAX_ABC_INCIDENTS_PER_SESSION) return { ok: false, error: 'INVALID_ABC_INCIDENT' };
  const incidents: AbcIncident[] = [];
  for (const item of raw) {
    const incident = sanitizeAbcIncident(item);
    if (!incident) return { ok: false, error: 'INVALID_ABC_INCIDENT' };
    incidents.push(incident);
  }
  if (measure.behaviorCount !== undefined && incidents.length > measure.behaviorCount) {
    return { ok: false, error: 'ABC_EXCEEDS_BEHAVIOR_COUNT' };
  }
  const totalDuration = incidents.reduce((n, i) => n + (i.duration_minutes ?? 0), 0);
  if (measure.behaviorDurationMinutes !== undefined && totalDuration > measure.behaviorDurationMinutes + 1e-9) {
    return { ok: false, error: 'ABC_EXCEEDS_DURATION' };
  }
  return { ok: true, incidents };
}

export type FbaPlanInput = {
  targetBehavior?: string;
  replacementBehavior?: string;
  hypothesizedFunction?: BehaviorFunction | '';
};

export type FbaPlanError = 'TARGET_BEHAVIOR_REQUIRED' | 'REPLACEMENT_BEHAVIOR_REQUIRED' | 'NOT_BEHAVIOR_GOAL';

export const FBA_PLAN_ERRORS_AR: Record<FbaPlanError | AbcValidationError, string> = {
  TARGET_BEHAVIOR_REQUIRED: 'اكتب تعريفاً إجرائياً للسلوك المستهدف (ما يُرى ويُعد)',
  REPLACEMENT_BEHAVIOR_REQUIRED: 'حدّد السلوك البديل التكيفي الذي يؤدي الوظيفة نفسها',
  NOT_BEHAVIOR_GOAL: 'التقييم الوظيفي متاح لأهداف التنظيم الذاتي والسلوك فقط',
  INVALID_ABC_INCIDENT: 'اختر المثير القبلي والبعدي لكل حادثة',
  ABC_EXCEEDS_BEHAVIOR_COUNT: 'عدد حوادث ABC أكبر من عدد مرات السلوك في الجلسة',
  ABC_EXCEEDS_DURATION: 'مجموع مدد الحوادث أكبر من مدة السلوك في الجلسة',
};

export function buildFbaPlan(
  input: FbaPlanInput,
  updatedBy: string | undefined,
  now: Date = new Date()
): { ok: true; plan: FbaPlan } | { ok: false; errors: FbaPlanError[] } {
  const target = note(input.targetBehavior, 500);
  const replacement = note(input.replacementBehavior, 500);
  const errors: FbaPlanError[] = [];
  if (!target) errors.push('TARGET_BEHAVIOR_REQUIRED');
  if (!replacement) errors.push('REPLACEMENT_BEHAVIOR_REQUIRED');
  if (errors.length) return { ok: false, errors };
  const plan: FbaPlan = {
    target_behavior: target!,
    replacement_behavior: replacement!,
    updated_at: now.toISOString(),
  };
  if (has(BEHAVIOR_FUNCTION_LABELS_AR, input.hypothesizedFunction)) plan.hypothesized_function = input.hypothesizedFunction;
  if (updatedBy) plan.updated_by = updatedBy.slice(0, 120);
  return { ok: true, plan };
}

export function sanitizeFbaPlan(raw: unknown): FbaPlan | undefined {
  const p = raw as Record<string, unknown> | null;
  if (!p || typeof p.updated_at !== 'string' || Number.isNaN(Date.parse(p.updated_at))) return undefined;
  const built = buildFbaPlan(
    {
      targetBehavior: p.target_behavior as string,
      replacementBehavior: p.replacement_behavior as string,
      hypothesizedFunction: p.hypothesized_function as BehaviorFunction,
    },
    typeof p.updated_by === 'string' ? p.updated_by : undefined,
    new Date(p.updated_at)
  );
  return built.ok ? built.plan : undefined;
}

type Tally<T extends string> = { key: T; count: number }[];

function tally<T extends string>(values: T[]): Tally<T> {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return Array.from(counts, ([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

export type FbaSummary = {
  incidents: number;
  sessionsWithAbc: number;
  antecedents: Tally<FbaAntecedent>;
  consequences: Tally<FbaConsequence>;
  functionScores: Record<BehaviorFunction, number>;
  /** undefined = حوادث غير كافية أو لا وظيفة راجحة */
  suggestedFunction?: BehaviorFunction;
  suggestedShare: number;
  /** نسبة الحوادث التي استُخدم فيها السلوك البديل */
  replacementUsePct: number | null;
  /** مجموع استخدامات السلوك البديل في الجلسات */
  replacementBehaviorTotal: number;
  hasPlan: boolean;
};

/** ملخص وصفي لحوادث ABC عبر جلسات الهدف */
export function summarizeFba(goal: Pick<TrackedGoal, 'sessions' | 'fbaPlan'>): FbaSummary {
  const sessions: GoalSession[] = goal.sessions || [];
  const incidents = sessions.flatMap((s) => s.abcIncidents || []);
  const functionScores: Record<BehaviorFunction, number> = { escape: 0, attention: 0, tangible: 0, automatic: 0 };
  for (const i of incidents) {
    const byConsequence = FBA_CONSEQUENCE_FUNCTION[i.consequence];
    const byAntecedent = FBA_ANTECEDENT_FUNCTION[i.antecedent];
    if (byConsequence) functionScores[byConsequence] += 2;
    if (byAntecedent) functionScores[byAntecedent] += 1;
  }
  const totalVotes = Object.values(functionScores).reduce((a, b) => a + b, 0);
  const [top, topScore] = (Object.entries(functionScores) as [BehaviorFunction, number][]).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const suggestedShare = totalVotes ? topScore / totalVotes : 0;
  const suggested =
    incidents.length >= FBA_MIN_INCIDENTS_FOR_HYPOTHESIS && suggestedShare >= FBA_MIN_FUNCTION_SHARE ? top : undefined;
  return {
    incidents: incidents.length,
    sessionsWithAbc: sessions.filter((s) => s.abcIncidents?.length).length,
    antecedents: tally(incidents.map((i) => i.antecedent)),
    consequences: tally(incidents.map((i) => i.consequence)),
    functionScores,
    suggestedFunction: suggested,
    suggestedShare: Math.round(suggestedShare * 100) / 100,
    replacementUsePct: incidents.length
      ? Math.round((incidents.filter((i) => i.replacement_behavior_used).length / incidents.length) * 100)
      : null,
    replacementBehaviorTotal: sessions.reduce((n, s) => n + (s.replacementBehaviorCount ?? 0), 0),
    hasPlan: Boolean(goal.fbaPlan),
  };
}

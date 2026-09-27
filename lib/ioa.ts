/**
 * اتفاق الملاحظين (IOA): ملاحظ ثانٍ مستقل يسجّل بيانات موازية لجلسة مسجّلة،
 * وتُحسب نسبة الاتفاق حسب نوع القياس (محاولة بمحاولة، العدد الكلي، المدة الكلية).
 */

import type { GoalSession, TrackedGoal } from '@/lib/goalsEngine';
import { normalizeTrainerId, parseTrialScores } from '@/lib/goalSessionForm';
import {
  IOA_ACCEPTABLE_PCT,
  IOA_COVERAGE_TARGET_PCT,
  type ClinicalPromptLevel,
  type IoaMethod,
  type IoaObserverData,
  type IoaRecord,
} from '@/types/clinical';

export const IOA_METHOD_LABELS_AR: Record<IoaMethod, string> = {
  trial_by_trial: 'محاولة بمحاولة',
  total_count: 'العدد الكلي',
  total_duration: 'المدة الكلية',
};

/** طريقة الاتفاق المتاحة للجلسة — null إذا لم تحفظ الجلسة بيانات قابلة للمقارنة */
export function ioaMethodForSession(session: GoalSession): IoaMethod | null {
  if (session.behaviorCount !== undefined) return 'total_count';
  if (session.behaviorDurationMinutes !== undefined) return 'total_duration';
  if (session.trialScores?.length) return 'trial_by_trial';
  return null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** الأصغر ÷ الأكبر × 100؛ صفر مقابل صفر = اتفاق تام */
export function totalAgreementPct(a: number, b: number): number {
  if (a < 0 || b < 0) return 0;
  const max = Math.max(a, b);
  return max === 0 ? 100 : round1((Math.min(a, b) / max) * 100);
}

/** المحاولات المتطابقة (نفس المستوى) ÷ عدد المحاولات × 100 */
export function trialByTrialAgreementPct(
  primary: readonly ClinicalPromptLevel[],
  secondary: readonly ClinicalPromptLevel[]
): { agreementPct: number; independenceAgreementPct: number } {
  const n = Math.max(primary.length, secondary.length);
  if (n === 0) return { agreementPct: 100, independenceAgreementPct: 100 };
  let exact = 0;
  let independence = 0;
  for (let i = 0; i < n; i += 1) {
    if (primary[i] !== undefined && primary[i] === secondary[i]) exact += 1;
    if (
      primary[i] !== undefined &&
      secondary[i] !== undefined &&
      (primary[i] === 'Independent') === (secondary[i] === 'Independent')
    ) {
      independence += 1;
    }
  }
  return { agreementPct: round1((exact / n) * 100), independenceAgreementPct: round1((independence / n) * 100) };
}

export type IoaInput = {
  goalId?: string;
  sessionAt?: string;
  observerName?: string;
  trialScores?: unknown;
  totalCount?: number | string;
  totalDurationMinutes?: number | string;
  notes?: string;
};

export type IoaError =
  | 'SESSION_NOT_FOUND'
  | 'IOA_NOT_AVAILABLE'
  | 'SAME_OBSERVER'
  | 'OBSERVER_REQUIRED'
  | 'TRIAL_SCORES_REQUIRED'
  | 'TRIAL_COUNT_MISMATCH'
  | 'TOTAL_REQUIRED'
  | 'IOA_EXISTS';

export const IOA_ERRORS_AR: Record<IoaError, string> = {
  SESSION_NOT_FOUND: 'الجلسة غير موجودة في سجل الهدف',
  IOA_NOT_AVAILABLE: 'الجلسة لا تحفظ بيانات قابلة للمقارنة (محاولات أو عدد أو مدة)',
  SAME_OBSERVER: 'الملاحظ الثاني يجب أن يكون شخصاً غير من نفّذ الجلسة',
  OBSERVER_REQUIRED: 'أدخل اسم الملاحظ الثاني',
  TRIAL_SCORES_REQUIRED: 'سجّل مستوى المساعدة لكل محاولة لاحظتها',
  TRIAL_COUNT_MISMATCH: 'عدد المحاولات يجب أن يساوي عدد محاولات الجلسة',
  TOTAL_REQUIRED: 'أدخل العدد أو المدة التي سجّلتها',
  IOA_EXISTS: 'سجّل هذا الملاحظ اتفاقاً لهذه الجلسة من قبل',
};

function toNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export type IoaObserver = { userId: string; name?: string; role?: string };

/**
 * يبني سجل الاتفاق: بيانات الملاحظ الأساسي تُؤخذ من الجلسة المحفوظة،
 * والملاحظ الثاني يجب أن يختلف عن مدرّب الجلسة ولم يسجّل اتفاقاً لها من قبل.
 */
export function buildIoaRecord(
  goal: TrackedGoal,
  input: IoaInput,
  observer: IoaObserver,
  existing: readonly IoaRecord[],
  now: Date = new Date(),
  ioaId = `ioa_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
): { ok: true; record: IoaRecord } | { ok: false; errors: IoaError[] } {
  const session = goal.sessions.find((s) => s.at === input.sessionAt);
  if (!session) return { ok: false, errors: ['SESSION_NOT_FOUND'] };
  const method = ioaMethodForSession(session);
  if (!method) return { ok: false, errors: ['IOA_NOT_AVAILABLE'] };

  const observerName = input.observerName?.trim() || observer.name?.trim();
  if (!observerName) return { ok: false, errors: ['OBSERVER_REQUIRED'] };
  const observerId = normalizeTrainerId(observerName)!;
  if (session.trainerId && session.trainerId === observerId) return { ok: false, errors: ['SAME_OBSERVER'] };
  if (
    existing.some(
      (r) => r.goal_id === goal.id && r.session_at === session.at && r.secondary.observer_id === observerId
    )
  ) {
    return { ok: false, errors: ['IOA_EXISTS'] };
  }

  const primary: IoaObserverData = { observer_id: session.trainerId ?? 'primary' };
  const secondary: IoaObserverData = {
    observer_id: observerId,
    observer_name: observerName.slice(0, 120),
    ...(observer.role ? { observer_role: observer.role } : {}),
  };
  let agreementPct: number;
  let independenceAgreementPct: number | undefined;

  if (method === 'trial_by_trial') {
    const scores = parseTrialScores(input.trialScores);
    if (!scores?.length) return { ok: false, errors: ['TRIAL_SCORES_REQUIRED'] };
    if (scores.length !== session.trialScores!.length) return { ok: false, errors: ['TRIAL_COUNT_MISMATCH'] };
    primary.trial_scores = [...session.trialScores!];
    secondary.trial_scores = scores;
    const result = trialByTrialAgreementPct(primary.trial_scores, scores);
    agreementPct = result.agreementPct;
    independenceAgreementPct = result.independenceAgreementPct;
  } else if (method === 'total_count') {
    const count = toNumber(input.totalCount);
    if (count === undefined) return { ok: false, errors: ['TOTAL_REQUIRED'] };
    primary.total_count = session.behaviorCount!;
    secondary.total_count = count;
    agreementPct = totalAgreementPct(primary.total_count, count);
  } else {
    const minutes = toNumber(input.totalDurationMinutes);
    if (minutes === undefined) return { ok: false, errors: ['TOTAL_REQUIRED'] };
    primary.total_duration_minutes = session.behaviorDurationMinutes!;
    secondary.total_duration_minutes = minutes;
    agreementPct = totalAgreementPct(primary.total_duration_minutes, minutes);
  }

  const record: IoaRecord = {
    ioa_id: ioaId,
    goal_id: goal.id,
    session_at: session.at,
    method,
    primary,
    secondary,
    agreement_pct: agreementPct,
    meets_standard: agreementPct >= IOA_ACCEPTABLE_PCT,
    recorded_at: now.toISOString(),
    recorded_by: observer.userId,
  };
  if (independenceAgreementPct !== undefined) record.independence_agreement_pct = independenceAgreementPct;
  const notes = input.notes?.trim();
  if (notes) record.notes = notes.slice(0, 1000);
  return { ok: true, record };
}

export type IoaGoalSummary = {
  goalId: string;
  sessions: number;
  ioaSessions: number;
  coveragePct: number;
  meanAgreementPct: number | null;
};

export type IoaSummary = {
  records: number;
  meanAgreementPct: number | null;
  meetingStandardPct: number | null;
  /** الجلسات القابلة للمقارنة التي خضعت لاتفاق ÷ كل الجلسات القابلة للمقارنة */
  coveragePct: number;
  coverageTargetPct: number;
  acceptablePct: number;
  belowStandard: IoaRecord[];
  byGoal: IoaGoalSummary[];
};

const mean = (values: number[]) =>
  values.length ? round1(values.reduce((a, b) => a + b, 0) / values.length) : null;

/** ملخص مراجعة المشرف لطفل واحد */
export function summarizeIoa(goals: readonly TrackedGoal[], records: readonly IoaRecord[]): IoaSummary {
  let eligibleTotal = 0;
  let coveredTotal = 0;
  const byGoal = goals
    .map((goal) => {
      const eligible = goal.sessions.filter((s) => ioaMethodForSession(s) !== null);
      const goalRecords = records.filter((r) => r.goal_id === goal.id);
      const covered = new Set(goalRecords.map((r) => r.session_at).filter((at) => eligible.some((s) => s.at === at)));
      eligibleTotal += eligible.length;
      coveredTotal += covered.size;
      return {
        goalId: goal.id,
        sessions: eligible.length,
        ioaSessions: covered.size,
        coveragePct: eligible.length ? round1((covered.size / eligible.length) * 100) : 0,
        meanAgreementPct: mean(goalRecords.map((r) => r.agreement_pct)),
      };
    })
    .filter((g) => g.sessions > 0 || g.ioaSessions > 0);
  return {
    records: records.length,
    meanAgreementPct: mean(records.map((r) => r.agreement_pct)),
    meetingStandardPct: records.length
      ? round1((records.filter((r) => r.meets_standard).length / records.length) * 100)
      : null,
    coveragePct: eligibleTotal ? round1((coveredTotal / eligibleTotal) * 100) : 0,
    coverageTargetPct: IOA_COVERAGE_TARGET_PCT,
    acceptablePct: IOA_ACCEPTABLE_PCT,
    belowStandard: records.filter((r) => !r.meets_standard),
    byGoal,
  };
}

/** جلسات قابلة للاتفاق دون بيانات الملاحظ الأساسي — الملاحظ الثاني لا يرى ما سُجّل (استقلال الملاحظة) */
export function ioaSessionOptions(goal: TrackedGoal): { at: string; method: IoaMethod; trials?: number }[] {
  return goal.sessions
    .map((s) => ({ s, method: ioaMethodForSession(s) }))
    .filter((x): x is { s: GoalSession; method: IoaMethod } => x.method !== null)
    .map(({ s, method }) => ({
      at: s.at,
      method,
      ...(method === 'trial_by_trial' ? { trials: s.trialScores!.length } : {}),
    }))
    .reverse();
}

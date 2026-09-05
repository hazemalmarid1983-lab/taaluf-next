/**
 * مقارنة نمائية تراكمية وتتبع أهداف SMART بين التقييمات المتعاقبة.
 * انخفاض نسبة الاحتياج = تحسن.
 */

import { listStudentAssessmentsChronological } from '@/lib/assessmentHelpers';
import type { TrackedGoal } from '@/lib/goalsEngine';
import { getCriterionById } from '@/types/taalof';

export const CANON_DOMAIN = {
  communication: 'التواصل الاستجابي والتعبيري',
  social: 'التفاعل والاندماج الاجتماعي واللعب',
  cognitive: 'النمو المعرفي والحلول الإدراكية',
  sensory: 'السلوك والتكيف والحواس واستقلالية الذات',
} as const;

export interface AssessmentSnapshot {
  assessmentId: string;
  date: string;
  evaluationRound: number;
  scores: {
    domain: string;
    percentage: number;
    level: string;
  }[];
  overallPercentage: number;
}

export interface GoalTrackingItem {
  goalId: string;
  title: string;
  domain: string;
  targetCriteriaId: string;
  currentProgress: number;
  status: 'not_started' | 'in_progress' | 'mastered';
  lastUpdated: string;
  notes?: string;
}

export interface DomainComparisonRow {
  domain: string;
  baseline: number;
  current: number;
  improvementDelta: number;
}

export type TrackingPlan = 'single' | 'half_year' | 'annual';

export const TRACKING_PLAN_LABEL: Record<TrackingPlan, string> = {
  single: 'تقييم كشف منفرد',
  half_year: 'سجل متابعة نصف سنوي (تقييمان)',
  annual: 'سجل رعاية نمائي سنوي (4 تقييمات تراكمية)',
};

export function sliceHistoryByPlan<T>(history: T[], plan: TrackingPlan): T[] {
  if (!history.length) return [];
  if (plan === 'single') return history.slice(-1);
  if (plan === 'half_year') return history.slice(-2);
  return history.slice(-4);
}

export function needPercentFromAverage(avg: number): number {
  const n = Number(avg);
  if (!Number.isFinite(n)) return 0;
  return Math.round((Math.min(3, Math.max(0, n)) / 3) * 100);
}

export function levelFromNeedPercent(percentage: number): string {
  if (percentage < 25) return 'مستقر';
  if (percentage < 50) return 'متوسط';
  if (percentage < 70) return 'شديد';
  return 'شديد جداً';
}

export function calculateDevelopmentGrowth(
  baseline: AssessmentSnapshot,
  latest: AssessmentSnapshot
) {
  const overallDiff = baseline.overallPercentage - latest.overallPercentage;
  const isImproved = overallDiff > 0;

  const domainComparison: DomainComparisonRow[] = latest.scores.map(
    (currentScore) => {
      const baseScore = baseline.scores.find(
        (s) => s.domain === currentScore.domain
      );
      const baseVal = baseScore
        ? baseScore.percentage
        : currentScore.percentage;
      const diff = baseVal - currentScore.percentage;
      return {
        domain: currentScore.domain,
        baseline: baseVal,
        current: currentScore.percentage,
        improvementDelta: diff,
      };
    }
  );

  return {
    overallDiffPercentage: Math.abs(overallDiff),
    isImproved,
    domainComparison,
    roundsCount: latest.evaluationRound,
  };
}

export function snapshotFromStored(input: {
  id: string;
  savedAt: string;
  percentage: number;
  domainAverages?: Record<string, number>;
  evaluationRound: number;
}): AssessmentSnapshot {
  const averages = input.domainAverages || {};
  const domains = [
    CANON_DOMAIN.communication,
    CANON_DOMAIN.social,
    CANON_DOMAIN.cognitive,
    CANON_DOMAIN.sensory,
  ];
  return {
    assessmentId: input.id,
    date: input.savedAt,
    evaluationRound: input.evaluationRound,
    overallPercentage: Math.round(Number(input.percentage) || 0),
    scores: domains.map((domain) => {
      const percentage = needPercentFromAverage(averages[domain] ?? 0);
      return {
        domain,
        percentage,
        level: levelFromNeedPercent(percentage),
      };
    }),
  };
}

export function snapshotsFromStudent(studentId: string): AssessmentSnapshot[] {
  return listStudentAssessmentsChronological(studentId).map((row, index) =>
    snapshotFromStored({
      id: row.id,
      savedAt: row.savedAt,
      percentage: row.percentage,
      domainAverages: row.domainAverages,
      evaluationRound: index + 1,
    })
  );
}

export function inferTrackingPlan(count: number): TrackingPlan {
  if (count >= 3) return 'annual';
  if (count === 2) return 'half_year';
  return 'single';
}

export function goalProgressPercent(goal: TrackedGoal): number {
  if (goal.target === goal.baseline) {
    return Math.min(100, Math.max(0, Math.round(goal.current)));
  }
  const pct =
    ((goal.current - goal.baseline) / (goal.target - goal.baseline)) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

export function toGoalTrackingItem(goal: TrackedGoal): GoalTrackingItem {
  const currentProgress = goalProgressPercent(goal);
  const status: GoalTrackingItem['status'] =
    goal.status === 'done' || currentProgress >= 100
      ? 'mastered'
      : goal.status === 'paused' || currentProgress <= 0
        ? 'not_started'
        : 'in_progress';
  return {
    goalId: goal.id,
    title: goal.title,
    domain: goal.domain,
    targetCriteriaId: goal.criterionId,
    currentProgress,
    status,
    lastUpdated: goal.lastUpdate || goal.startDate,
    notes: goal.smartText,
  };
}

export function summarizeGoalTracking(goals: TrackedGoal[]) {
  const items = goals.map(toGoalTrackingItem);
  return {
    items,
    masteredGoalsCount: items.filter((g) => g.status === 'mastered').length,
    activeGoalsCount: items.filter((g) => g.status === 'in_progress').length,
  };
}

const FLAG_CRITERIA = [
  'C1',
  'C2',
  'C11',
  'C12',
  'C33',
  'C34',
  'C35',
  'C38',
] as const;

/** مؤشرات سلوكية مرصودة — بلا تشخيص طبي */
export function identifyRedFlags(
  scores: Array<{ criterionId: string; score: number }>
): string[] {
  const flags: string[] = [];
  for (const id of FLAG_CRITERIA) {
    const row = scores.find((s) => s.criterionId === id);
    const score = Number(row?.score);
    if (!Number.isFinite(score) || score < 3) continue;
    const name = getCriterionById(id)?.name || id;
    flags.push(
      `مؤشر سلوكي مرتفع جداً في «${name}» — يُفضَّل اطلاع الطبيب المختص على هذا الرصد التربوي.`
    );
  }
  return flags.slice(0, 8);
}

export function roundLabel(index: number, date: string): string {
  const month = new Date(date).toLocaleDateString('ar-OM', {
    month: 'long',
    year: 'numeric',
  });
  if (index === 0) return `خط الأساس — ${month}`;
  return `المراجعة ${index} — ${month}`;
}

export function domainNeedFromSnapshot(
  snapshot: AssessmentSnapshot,
  domain: string
): number {
  return (
    snapshot.scores.find((s) => s.domain === domain)?.percentage ?? 0
  );
}

export function ageMonthsFromStudent(input: {
  age?: number;
  dob?: string;
}): number {
  if (input.dob) {
    const birth = new Date(input.dob);
    if (!Number.isNaN(birth.getTime())) {
      const now = new Date();
      return Math.max(
        0,
        (now.getFullYear() - birth.getFullYear()) * 12 +
          (now.getMonth() - birth.getMonth())
      );
    }
  }
  if (input.age != null && Number.isFinite(input.age)) {
    return Math.round(Number(input.age) * 12);
  }
  return 0;
}

export function buildPhysicianSummaryInput(params: {
  childName: string;
  age?: number;
  dob?: string;
  doctorName?: string;
  clinicName?: string;
  studentId: string;
  goals: TrackedGoal[];
}) {
  const history = listStudentAssessmentsChronological(params.studentId);
  const snapshots = history.map((row, index) =>
    snapshotFromStored({
      id: row.id,
      savedAt: row.savedAt,
      percentage: row.percentage,
      domainAverages: row.domainAverages,
      evaluationRound: index + 1,
    })
  );
  const latest = history[history.length - 1];
  const goals = summarizeGoalTracking(params.goals);
  const growth =
    snapshots.length >= 2
      ? calculateDevelopmentGrowth(snapshots[0], snapshots[snapshots.length - 1])
      : null;

  return {
    childName: params.childName,
    ageMonths: ageMonthsFromStudent({ age: params.age, dob: params.dob }),
    birthDate: params.dob
      ? new Date(params.dob).toLocaleDateString('ar-OM')
      : '—',
    doctorName: params.doctorName,
    clinicName: params.clinicName,
    trackingPlan: inferTrackingPlan(snapshots.length),
    assessmentsHistory: snapshots.map((snap, idx) => ({
      round: roundLabel(idx, snap.date),
      date: new Date(snap.date).toLocaleDateString('ar-OM'),
      overallNeed: snap.overallPercentage,
      communicationScore: domainNeedFromSnapshot(
        snap,
        CANON_DOMAIN.communication
      ),
      socialScore: domainNeedFromSnapshot(snap, CANON_DOMAIN.social),
      cognitiveScore: domainNeedFromSnapshot(snap, CANON_DOMAIN.cognitive),
      sensoryBehaviorScore: domainNeedFromSnapshot(
        snap,
        CANON_DOMAIN.sensory
      ),
    })),
    redFlagsIdentified: identifyRedFlags(latest?.scores || []),
    masteredGoalsCount: goals.masteredGoalsCount,
    activeGoalsCount: goals.activeGoalsCount,
    growth,
  };
}

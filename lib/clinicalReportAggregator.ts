/**
 * تجميع التقرير السريري التراكمي الشامل — منطق خالص قابل للاختبار.
 */

import {
  buildAdaptiveFlowContext,
  getNextRecommendedAction,
  type NextRecommendedAction,
} from './adaptiveClinicalFlow';
import type { StoredAssessment } from './assessmentHelpers';
import type { TrackedGoal } from './goalsEngine';
import type { HomeSessionSummary } from './homeClassroomEngine';
import {
  summarizePromptLevels,
  type PromptBreakdown,
} from './promptHierarchy';
import { describeMoodShift } from './regulationZones';
import { SENSORY_ROOMS } from './sensoryHub';
import type { SensoryHubSessionMetrics } from './sensoryHub';
import { summarizeSensoryHubSessions } from './sensoryHubSession';

export type ClinicalReportStudent = {
  id: string;
  name: string;
  dob?: string;
  age?: number;
  parentName?: string;
  status?: string;
};

export type ClinicalReportInput = {
  student: ClinicalReportStudent;
  specialistName?: string;
  issuedAt?: string;
  assessments?: StoredAssessment[];
  goals?: TrackedGoal[];
  homeSessions?: HomeSessionSummary[];
  sensorySessions?: SensoryHubSessionMetrics[];
};

export type BaselineDomainRow = {
  domain: string;
  average: number;
};

export type IepGoalReportRow = {
  id: string;
  title: string;
  domain: string;
  baseline: number;
  target: number;
  current: number;
  progressPct: number;
  avgIndependence: number | null;
  sessionCount: number;
  lastSessionDate: string | null;
};

export type PromptingSummary = {
  totalTrials: number;
  independentPct: number;
  breakdown: PromptBreakdown;
  summaryAr: string;
  summaryEn: string;
  homeSessionCount: number;
};

export type SensoryReportStats = {
  hasData: boolean;
  totalSessions: number;
  avgCalmIndex: number;
  totalMinutes: number;
  totalInteractions: number;
  topRooms: Array<{
    roomId: string;
    titleAr: string;
    titleEn: string;
    count: number;
    avgCalm: number;
  }>;
};

export type EmotionalStabilityCard = {
  hasData: boolean;
  improvedSessions: number;
  steadySessions: number;
  declinedSessions: number;
  avgCalmIndex: number;
  summaryAr: string;
  summaryEn: string;
};

export type ClinicalProgressReport = {
  meta: {
    childId: string;
    childName: string;
    ageLabel: string;
    parentName: string;
    specialistName: string;
    issuedAt: string;
    centerNameAr: string;
    centerNameEn: string;
  };
  assessment: {
    hasAssessment: boolean;
    classification: string;
    percentage: number;
    savedAt: string | null;
    totalScore: number;
    maxScore: number;
    domainBaselines: BaselineDomainRow[];
    summaryAr: string;
    summaryEn: string;
  };
  iepGoals: IepGoalReportRow[];
  promptingSummary: PromptingSummary;
  sensoryStats: SensoryReportStats;
  emotionalStability: EmotionalStabilityCard;
  recommendation: NextRecommendedAction;
  avgHomeIndependence: number | null;
};

const EMPTY_BREAKDOWN: PromptBreakdown = {
  independent: 0,
  gestural: 0,
  verbal: 0,
  partial_physical: 0,
  full_physical: 0,
  no_response: 0,
};

function mergeBreakdowns(breakdowns: PromptBreakdown[]): PromptBreakdown {
  return breakdowns.reduce(
    (acc, row) => ({
      independent: acc.independent + row.independent,
      gestural: acc.gestural + row.gestural,
      verbal: acc.verbal + row.verbal,
      partial_physical: acc.partial_physical + row.partial_physical,
      full_physical: acc.full_physical + row.full_physical,
      no_response: acc.no_response + row.no_response,
    }),
    { ...EMPTY_BREAKDOWN }
  );
}

function goalProgressPct(goal: TrackedGoal) {
  const range = Math.max(1, goal.target - goal.baseline);
  return Math.round(
    Math.min(100, Math.max(0, ((goal.current - goal.baseline) / range) * 100))
  );
}

function matchSessionsForGoal(
  goal: TrackedGoal,
  sessions: HomeSessionSummary[]
) {
  const title = goal.title.trim();
  return sessions.filter(
    (s) =>
      s.goalTitleAr.includes(title) ||
      title.includes(s.goalTitleAr) ||
      (s.sourceGoalText && s.sourceGoalText.includes(title))
  );
}

function formatAgeLabel(student: ClinicalReportStudent) {
  if (student.age != null) return `${student.age}`;
  if (student.dob) return student.dob;
  return '—';
}

function roomTitles(roomId: string) {
  const room = SENSORY_ROOMS.find((r) => r.id === roomId);
  return {
    titleAr: room?.titleAr || roomId,
    titleEn: room?.titleEn || roomId,
  };
}

export function aggregateClinicalProgressReport(
  input: ClinicalReportInput
): ClinicalProgressReport {
  const {
    student,
    specialistName = 'الأخصائي المعالج',
    issuedAt = new Date().toISOString(),
    assessments = [],
    goals = [],
    homeSessions = [],
    sensorySessions = [],
  } = input;

  const childAssessments = assessments
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const latest = childAssessments[0] || null;

  const childHomeSessions = homeSessions.filter((s) => s.childId === student.id);
  const childSensory = sensorySessions.filter((s) => s.childId === student.id);
  const sensorySummary = summarizeSensoryHubSessions(childSensory);

  const domainBaselines: BaselineDomainRow[] = latest?.domainAverages
    ? Object.entries(latest.domainAverages).map(([domain, average]) => ({
        domain,
        average: Math.round(Number(average) * 10) / 10,
      }))
    : [];

  const iepGoals: IepGoalReportRow[] = goals
    .filter((g) => g.childId === student.id && g.status !== 'done')
    .map((goal) => {
      const matched = matchSessionsForGoal(goal, childHomeSessions);
      const avgIndependence = matched.length
        ? Math.round(
            matched.reduce((sum, s) => sum + s.masteryPercentage, 0) /
              matched.length
          )
        : null;
      const lastSessionDate = matched.length
        ? matched.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))[0]
            .sessionDate
        : null;

      return {
        id: goal.id,
        title: goal.title,
        domain: goal.domain,
        baseline: goal.baseline,
        target: goal.target,
        current: goal.current,
        progressPct: goalProgressPct(goal),
        avgIndependence,
        sessionCount: matched.length || goal.sessions.length,
        lastSessionDate,
      };
    });

  const breakdowns = childHomeSessions
    .map((s) => s.promptBreakdown)
    .filter(Boolean) as PromptBreakdown[];

  const mergedBreakdown =
    breakdowns.length > 0 ? mergeBreakdowns(breakdowns) : { ...EMPTY_BREAKDOWN };

  const totalTrials = Object.values(mergedBreakdown).reduce((a, b) => a + b, 0);
  const independentPct =
    totalTrials > 0
      ? Math.round((mergedBreakdown.independent / totalTrials) * 100)
      : 0;

  const avgHomeIndependence = childHomeSessions.length
    ? Math.round(
        childHomeSessions.reduce((sum, s) => sum + s.masteryPercentage, 0) /
          childHomeSessions.length
      )
    : null;

  let improved = 0;
  let steady = 0;
  let declined = 0;
  for (const session of childHomeSessions) {
    const shift = describeMoodShift(session.moodBefore, session.moodAfter);
    if (!shift) continue;
    if (shift.direction === 'improved') improved += 1;
    else if (shift.direction === 'declined') declined += 1;
    else steady += 1;
  }

  const emotionalHasData = improved + steady + declined > 0 || sensorySummary.totalSessions > 0;
  const emotionalSummaryAr = emotionalHasData
    ? `تحسّن في ${improved} جلسة، استقرار في ${steady}، تراجع في ${declined}. متوسط الهدوء الحسي ${sensorySummary.avgCalmIndex}%.`
    : 'لا توجد بيانات كافية لقياس الاستقرار الانفعالي بعد.';
  const emotionalSummaryEn = emotionalHasData
    ? `Improved in ${improved} session(s), steady in ${steady}, declined in ${declined}. Sensory calm average ${sensorySummary.avgCalmIndex}%.`
    : 'Insufficient data to measure emotional stability yet.';

  const ctx = buildAdaptiveFlowContext(
    student.id,
    student.name,
    goals.filter((g) => g.childId === student.id),
    childSensory
  );
  ctx.hasAssessment = childAssessments.length > 0;
  ctx.lastHomeSession = childHomeSessions.sort((a, b) =>
    b.sessionDate.localeCompare(a.sessionDate)
  )[0] || null;

  const recommendation = getNextRecommendedAction(ctx);

  return {
    meta: {
      childId: student.id,
      childName: student.name || '—',
      ageLabel: formatAgeLabel(student),
      parentName: student.parentName || '—',
      specialistName,
      issuedAt,
      centerNameAr: 'منصة تآلف — مركز التأهيل والدعم التربوي',
      centerNameEn: 'Taaluf Platform — Rehabilitation & Educational Support Center',
    },
    assessment: {
      hasAssessment: Boolean(latest),
      classification: latest?.classification || '—',
      percentage: latest?.percentage ?? 0,
      savedAt: latest?.savedAt || null,
      totalScore: latest?.totalScore ?? 0,
      maxScore: latest?.maxScore ?? 0,
      domainBaselines,
      summaryAr: latest
        ? `آخر تقييم: ${latest.classification} — ${latest.percentage}% (${latest.totalScore}/${latest.maxScore}).`
        : 'لم يُسجَّل تقييم شامل بعد — يُوصى بإجراء التقييم النمائي لبناء خط الأساس.',
      summaryEn: latest
        ? `Latest assessment: ${latest.classification} — ${latest.percentage}% (${latest.totalScore}/${latest.maxScore}).`
        : 'No comprehensive assessment yet — complete developmental screening to establish baseline.',
    },
    iepGoals,
    promptingSummary: {
      totalTrials,
      independentPct,
      breakdown: mergedBreakdown,
      summaryAr:
        totalTrials > 0
          ? summarizePromptLevels(mergedBreakdown, true)
          : 'لا توجد محاولات مسجّلة في الجلسات المنزلية بعد.',
      summaryEn:
        totalTrials > 0
          ? summarizePromptLevels(mergedBreakdown, false)
          : 'No trials recorded in home sessions yet.',
      homeSessionCount: childHomeSessions.length,
    },
    sensoryStats: {
      hasData: sensorySummary.totalSessions > 0,
      totalSessions: sensorySummary.totalSessions,
      avgCalmIndex: sensorySummary.avgCalmIndex,
      totalMinutes: sensorySummary.totalMinutes,
      totalInteractions: sensorySummary.totalInteractions,
      topRooms: sensorySummary.byRoom.slice(0, 4).map((row) => ({
        roomId: row.roomId,
        ...roomTitles(row.roomId),
        count: row.count,
        avgCalm: row.avgCalm,
      })),
    },
    emotionalStability: {
      hasData: emotionalHasData,
      improvedSessions: improved,
      steadySessions: steady,
      declinedSessions: declined,
      avgCalmIndex: sensorySummary.avgCalmIndex,
      summaryAr: emotionalSummaryAr,
      summaryEn: emotionalSummaryEn,
    },
    recommendation,
    avgHomeIndependence,
  };
}

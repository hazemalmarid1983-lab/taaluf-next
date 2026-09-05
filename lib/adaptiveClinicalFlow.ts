/**
 * محرك التدفق السريري والتنقل التكيفي الذكي.
 * يحدّد الخطوة التالية، مسارات الجاهزية، وحفظ استئناف الجلسة.
 */

import { loadStoredAssessments } from './assessmentHelpers';
import type { TrackedGoal } from './goalsEngine';
import {
  loadHomeSessions,
  type HomeSessionSummary,
} from './homeClassroomEngine';
import type { RegulationZoneId } from './regulationZones';
import type { SensoryHubSessionMetrics } from './sensoryHub';
import { summarizeSensoryHubSessions } from './sensoryHubSession';
import type { TrialResult } from './homeClassroomEngine';

export type ReadinessState = 'calm' | 'hyperactive' | 'anxious';

export type ClinicalFlowStep = 'prepare' | 'train' | 'reinforce' | 'document';

export type ReadinessPath = {
  state: ReadinessState;
  directTrain: boolean;
  href: string;
  roomId: string;
  titleAr: string;
  titleEn: string;
  coachAr: string;
  coachEn: string;
};

export type NextRecommendedAction = {
  id: string;
  priority: 'high' | 'medium' | 'low';
  emoji: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  href: string;
  reasonAr: string;
  reasonEn: string;
};

export type AdaptiveFlowContext = {
  childId: string;
  childName?: string;
  goals: TrackedGoal[];
  lastHomeSession?: HomeSessionSummary | null;
  sensorySessions?: SensoryHubSessionMetrics[];
  hasAssessment?: boolean;
  readiness?: ReadinessState | null;
};

export const CLINICAL_FLOW_STEPS: Array<{
  id: ClinicalFlowStep;
  labelAr: string;
  labelEn: string;
  emoji: string;
}> = [
  { id: 'prepare', labelAr: 'التهيئة', labelEn: 'Prepare', emoji: '🧭' },
  { id: 'train', labelAr: 'التدريب والتركيز', labelEn: 'Train & focus', emoji: '🎯' },
  { id: 'reinforce', labelAr: 'التعزيز', labelEn: 'Reinforce', emoji: '🎁' },
  { id: 'document', labelAr: 'التوثيق', labelEn: 'Document', emoji: '📋' },
];

export const READINESS_OPTIONS: Array<{
  id: ReadinessState;
  emoji: string;
  labelAr: string;
  labelEn: string;
  hintAr: string;
  hintEn: string;
}> = [
  {
    id: 'calm',
    emoji: '🙂',
    labelAr: 'هادئ ومستعد',
    labelEn: 'Calm & ready',
    hintAr: 'يمكن البدء بالتدريب مباشرة',
    hintEn: 'Start training right away',
  },
  {
    id: 'hyperactive',
    emoji: '⚡',
    labelAr: 'نشيط / فرط حركة',
    labelEn: 'Hyperactive',
    hintAr: 'توجيه للتهدئة الحركية أولاً',
    hintEn: 'Motor calming first',
  },
  {
    id: 'anxious',
    emoji: '😟',
    labelAr: 'قلق / متوتر',
    labelEn: 'Anxious',
    hintAr: 'توجيه لغرفة تهدئة حسية',
    hintEn: 'Sensory calming room first',
  },
];

export const SESSION_PAUSE_STORAGE_KEY = 'taaluf.clinicalFlowPause.v1';

export type SessionPauseSnapshot = {
  childId: string;
  goalId: string;
  goalTitleAr: string;
  trials: TrialResult[];
  moodBefore: RegulationZoneId | null;
  scheduleOn: boolean;
  schedulePassed: boolean;
  readiness: ReadinessState | null;
  savedAt: string;
  returnHref: string;
  sensoryRoomHref: string;
};

export function mapReadinessToMood(state: ReadinessState): RegulationZoneId {
  switch (state) {
    case 'calm':
      return 'green';
    case 'hyperactive':
      return 'yellow';
    case 'anxious':
      return 'blue';
    default:
      return 'green';
  }
}

export function getReadinessPath(state: ReadinessState): ReadinessPath {
  switch (state) {
    case 'hyperactive':
      return {
        state,
        directTrain: false,
        href: '/sensory-rooms/tracing',
        roomId: 'tracing',
        titleAr: 'الرسم الضوئي — تهدئة حركية',
        titleEn: 'Light tracing — motor calming',
        coachAr: 'ابدئي بحركة يد هادئة قبل المحاولات.',
        coachEn: 'Begin with calm hand movement before trials.',
      };
    case 'anxious':
      return {
        state,
        directTrain: false,
        href: '/sensory-rooms/stars',
        roomId: 'stars',
        titleAr: 'غرفة النجوم والتنفس',
        titleEn: 'Calming star room',
        coachAr: 'دقيقتان من التنفس قبل العودة للتدريب.',
        coachEn: 'Two minutes of breathing before returning to training.',
      };
    default:
      return {
        state: 'calm',
        directTrain: true,
        href: '/dashboard/home-classroom',
        roomId: 'none',
        titleAr: 'البدء المباشر',
        titleEn: 'Start directly',
        coachAr: 'الطفل جاهز — ابدئي المحاولات.',
        coachEn: 'Child is ready — begin trials.',
      };
  }
}

export function deriveClinicalFlowStep(input: {
  checkInComplete: boolean;
  scheduleOn: boolean;
  schedulePassed: boolean;
  trialsCount: number;
  hasSummary: boolean;
  moodAfter?: RegulationZoneId | null;
  targetTrials?: number;
}): ClinicalFlowStep {
  const target = input.targetTrials ?? 5;

  if (
    !input.checkInComplete ||
    (input.scheduleOn && !input.schedulePassed && !input.hasSummary)
  ) {
    return 'prepare';
  }
  if (!input.hasSummary && input.trialsCount < target) {
    return 'train';
  }
  if (input.hasSummary && !input.moodAfter) {
    return 'reinforce';
  }
  if (input.hasSummary && input.moodAfter) {
    return 'document';
  }
  return 'reinforce';
}

export function buildAdaptiveFlowContext(
  childId: string,
  childName?: string,
  goals: TrackedGoal[] = [],
  sensorySessions: SensoryHubSessionMetrics[] = []
): AdaptiveFlowContext {
  const sessions = loadHomeSessions();
  const childSessions = sessions.filter((s) => s.childId === childId);
  const lastHomeSession =
    childSessions.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))[0] ||
    null;
  const assessments = loadStoredAssessments().filter((a) => a.studentId === childId);

  return {
    childId,
    childName,
    goals: goals.filter((g) => g.childId === childId && g.status !== 'done'),
    lastHomeSession,
    sensorySessions,
    hasAssessment: assessments.length > 0,
  };
}

export function getNextRecommendedAction(
  ctx: AdaptiveFlowContext
): NextRecommendedAction {
  const sensorySummary = summarizeSensoryHubSessions(ctx.sensorySessions || []);
  const last = ctx.lastHomeSession;
  const activeGoals = ctx.goals.filter((g) => g.status === 'active');

  if (!ctx.hasAssessment) {
    return {
      id: 'assessment',
      priority: 'high',
      emoji: '📋',
      titleAr: 'أكملي التقييم الأول',
      titleEn: 'Complete the first assessment',
      descriptionAr: 'التقييم يبني الخطة الفردية ويحدّد الأولويات.',
      descriptionEn: 'Assessment builds the IEP and sets priorities.',
      href: '/dashboard/assessments/new',
      reasonAr: 'لا يوجد تقييم مسجّل للطفل بعد.',
      reasonEn: 'No assessment recorded for this child yet.',
    };
  }

  if (!activeGoals.length) {
    return {
      id: 'goals',
      priority: 'high',
      emoji: '🎯',
      titleAr: 'راجعي أهداف الخطة',
      titleEn: 'Review IEP goals',
      descriptionAr: 'توليد أو تحديث الأهداف من نتائج التقييم.',
      descriptionEn: 'Generate or refresh goals from assessment results.',
      href: '/dashboard/goals',
      reasonAr: 'لا توجد أهداف نشطة حالياً.',
      reasonEn: 'No active goals at the moment.',
    };
  }

  const recentCalmLow =
    sensorySummary.totalSessions >= 2 && sensorySummary.avgCalmIndex < 45;
  if (recentCalmLow) {
    return {
      id: 'sensory_regulation',
      priority: 'high',
      emoji: '🌧️',
      titleAr: 'جلسة تنظيم حسي',
      titleEn: 'Sensory regulation session',
      descriptionAr: 'مؤشر الهدوء في الغرف الحسية منخفض — ابدئي بتهدئة.',
      descriptionEn: 'Calm index in sensory rooms is low — start with regulation.',
      href: '/sensory-rooms/rain',
      reasonAr: `متوسط الهدوء ${sensorySummary.avgCalmIndex}% في آخر الجلسات.`,
      reasonEn: `Average calm ${sensorySummary.avgCalmIndex}% in recent sessions.`,
    };
  }

  const lastIndependence = last?.masteryPercentage ?? null;
  const needsCalmingFirst =
    last?.band === 'needs_support' &&
    (lastIndependence ?? 100) < 40 &&
    (last.moodBefore === 'yellow' || last.moodBefore === 'red');

  if (needsCalmingFirst) {
    return {
      id: 'calm_before_train',
      priority: 'high',
      emoji: '🧘',
      titleAr: 'تهدئة قبل التدريب',
      titleEn: 'Calm before training',
      descriptionAr: 'الجلسة الأخيرة كانت صعبة — ابدئي بفحص الجاهزية.',
      descriptionEn: 'Last session was tough — begin with a readiness check.',
      href: '/dashboard/home-classroom',
      reasonAr: `استقلالية ${lastIndependence}% مع حالة عالية قبل الجلسة.`,
      reasonEn: `${lastIndependence}% independence with elevated pre-session state.`,
    };
  }

  const daysSinceSession = last
    ? (Date.now() - new Date(last.sessionDate).getTime()) / 86_400_000
    : Infinity;

  if (!last || daysSinceSession > 3) {
    const topGoal = activeGoals[0];
    return {
      id: 'home_train',
      priority: 'high',
      emoji: '🏡',
      titleAr: 'جلسة تدريب منزلية',
      titleEn: 'Home training session',
      descriptionAr: `تابعي الهدف: ${topGoal.title}`,
      descriptionEn: `Continue goal: ${topGoal.title}`,
      href: '/dashboard/home-classroom',
      reasonAr: daysSinceSession > 3
        ? 'لم تُسجَّل جلسة منذ أكثر من 3 أيام.'
        : 'ابدئي أول جلسة تدريب منزلية.',
      reasonEn:
        daysSinceSession > 3
          ? 'No session recorded for over 3 days.'
          : 'Start the first home training session.',
    };
  }

  if (last.band === 'mastered' && lastIndependence !== null && lastIndependence >= 80) {
    return {
      id: 'sensory_reward',
      priority: 'medium',
      emoji: '🫧',
      titleAr: 'معزّز حسي بعد النجاح',
      titleEn: 'Sensory reward after success',
      descriptionAr: 'الجلسة الأخيرة ممتازة — عزّزي الإنجاز بغرفة حسية.',
      descriptionEn: 'Last session was strong — reinforce with a sensory room.',
      href: '/sensory-rooms/bubbles',
      reasonAr: `استقلالية ${lastIndependence}% في آخر جلسة.`,
      reasonEn: `${lastIndependence}% independence in the last session.`,
    };
  }

  const strugglingGoal = activeGoals.find((g) => {
    const range = Math.max(1, g.target - g.baseline);
    const pct = ((g.current - g.baseline) / range) * 100;
    return pct < 40;
  });

  if (strugglingGoal) {
    return {
      id: 'continue_goal',
      priority: 'medium',
      emoji: '🎯',
      titleAr: 'متابعة الهدف ذي الأولوية',
      titleEn: 'Continue priority goal',
      descriptionAr: strugglingGoal.title,
      descriptionEn: strugglingGoal.title,
      href: '/dashboard/home-classroom',
      reasonAr: 'التقدّم ما زال دون 40% — جلسة قصيرة اليوم.',
      reasonEn: 'Progress still below 40% — a short session today helps.',
    };
  }

  return {
    id: 'sensory_wing',
    priority: 'low',
    emoji: '🌈',
    titleAr: 'استكشاف الجناح الحسي',
    titleEn: 'Explore the sensory wing',
    descriptionAr: 'جلسة تنظيم أو استمتاع بين جلسات التدريب.',
    descriptionEn: 'Regulation or enjoyment between training sessions.',
    href: '/sensory-rooms',
    reasonAr: 'مسار متوازن — التنظيم الحسي يدعم التعلم.',
    reasonEn: 'Balanced path — sensory regulation supports learning.',
  };
}

export function saveSessionPause(snapshot: SessionPauseSnapshot) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_PAUSE_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function loadSessionPause(): SessionPauseSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_PAUSE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionPauseSnapshot;
  } catch {
    return null;
  }
}

export function clearSessionPause() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_PAUSE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function clinicalStepIndex(step: ClinicalFlowStep) {
  return CLINICAL_FLOW_STEPS.findIndex((s) => s.id === step);
}

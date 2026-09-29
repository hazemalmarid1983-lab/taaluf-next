/**
 * خطة مدة الجلسة الحسية — معزّز، سلسلة ألعاب، أو افتراضي.
 */

import { loadSessionPause } from './adaptiveClinicalFlow';
import {
  clearParentGamesSequence,
  currentParentGameStep,
  parentGamesReturnHub,
  stepForPathname,
  type ParentGameStep,
} from './parentGamesSequence';
import {
  readSensoryReinforcerHandoff,
  reinforcerSecondsRemaining,
} from './scheduleRewards';
import type { SensoryRoomId } from './sensoryHub';

export const DEFAULT_SENSORY_SESSION_DURATION_SEC = 180;
/** اللعب الحر لا ينتهي بعدد اللمسات — السحب المستمر يولّد عشرات التفاعلات في ثوانٍ */
export const DEFAULT_SENSORY_SESSION_MAX_INTERACTIONS = Number.POSITIVE_INFINITY;
export const SENSORY_ROOMS_HUB_HREF = '/sensory-rooms';

export type SensorySessionPlan = {
  durationSec: number;
  maxInteractions: number;
  nextHref: string | null;
  returnHref: string | null;
  /** قائمة الأنشطة التي ينتمي إليها النشاط الحالي */
  activitiesHref: string;
  source: 'reinforcer' | 'sequence' | 'default';
};

function fromStep(step: ParentGameStep): Pick<SensorySessionPlan, 'durationSec' | 'maxInteractions'> {
  return {
    durationSec: step.durationSec > 0 ? step.durationSec : DEFAULT_SENSORY_SESSION_DURATION_SEC,
    maxInteractions: step.maxInteractions ?? DEFAULT_SENSORY_SESSION_MAX_INTERACTIONS,
  };
}

export function activitiesHrefForPath(pathname: string): string {
  const path = pathname.split('?')[0]?.split('#')[0] || pathname;
  if (path === '/sensory-room' || path.startsWith('/sensory-room/') || path.startsWith('/sensory-rooms')) {
    return SENSORY_ROOMS_HUB_HREF;
  }
  return parentGamesReturnHub();
}

export function resolveSensorySessionPlan(input?: {
  pathname?: string;
  roomId?: SensoryRoomId;
}): SensorySessionPlan {
  const pause = loadSessionPause();
  const returnHref = pause?.returnHref ?? null;
  const pathname =
    input?.pathname ??
    (typeof window !== 'undefined' ? window.location.pathname : '');
  const activitiesHref = activitiesHrefForPath(pathname);

  const handoff = readSensoryReinforcerHandoff();
  if (handoff) {
    const remaining = reinforcerSecondsRemaining(handoff);
    return {
      durationSec: Math.max(15, remaining),
      maxInteractions: DEFAULT_SENSORY_SESSION_MAX_INTERACTIONS,
      nextHref: returnHref,
      returnHref,
      activitiesHref,
      source: 'reinforcer',
    };
  }

  const sequenceStep = currentParentGameStep() ?? stepForPathname(pathname);
  if (sequenceStep) {
    const limits = fromStep(sequenceStep);
    return {
      ...limits,
      nextHref: null,
      returnHref,
      activitiesHref,
      source: 'sequence',
    };
  }

  return {
    durationSec: DEFAULT_SENSORY_SESSION_DURATION_SEC,
    maxInteractions: DEFAULT_SENSORY_SESSION_MAX_INTERACTIONS,
    nextHref: null,
    returnHref,
    activitiesHref,
    source: 'default',
  };
}

/** الخروج من النشاط الحالي إلى قائمة الأنشطة (أو صفحة الإيقاف المؤقت للجلسة إن وُجدت) */
export function resolveSensoryFinalExitHref(plan: SensorySessionPlan): string {
  if (plan.returnHref) return plan.returnHref;
  clearParentGamesSequence();
  return plan.activitiesHref;
}

/** @deprecated استخدم resolveSensoryFinalExitHref — التقدم التلقائي أُلغي */
export function resolveSensoryExitHref(plan: SensorySessionPlan): string {
  return resolveSensoryFinalExitHref(plan);
}

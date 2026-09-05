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

export const DEFAULT_SENSORY_SESSION_DURATION_SEC = 90;
export const DEFAULT_SENSORY_SESSION_MAX_INTERACTIONS = 30;

export type SensorySessionPlan = {
  durationSec: number;
  maxInteractions: number;
  nextHref: string | null;
  returnHref: string | null;
  source: 'reinforcer' | 'sequence' | 'default';
};

function fromStep(step: ParentGameStep): Pick<SensorySessionPlan, 'durationSec' | 'maxInteractions'> {
  return {
    durationSec: step.durationSec > 0 ? step.durationSec : DEFAULT_SENSORY_SESSION_DURATION_SEC,
    maxInteractions: step.maxInteractions ?? DEFAULT_SENSORY_SESSION_MAX_INTERACTIONS,
  };
}

export function resolveSensorySessionPlan(input?: {
  pathname?: string;
  roomId?: SensoryRoomId;
}): SensorySessionPlan {
  const pause = loadSessionPause();
  const returnHref = pause?.returnHref ?? null;

  const handoff = readSensoryReinforcerHandoff();
  if (handoff) {
    const remaining = reinforcerSecondsRemaining(handoff);
    return {
      durationSec: Math.max(15, remaining),
      maxInteractions: DEFAULT_SENSORY_SESSION_MAX_INTERACTIONS,
      nextHref: returnHref,
      returnHref,
      source: 'reinforcer',
    };
  }

  const pathname =
    input?.pathname ??
    (typeof window !== 'undefined' ? window.location.pathname : '');
  const sequenceStep = currentParentGameStep() ?? stepForPathname(pathname);
  if (sequenceStep) {
    const limits = fromStep(sequenceStep);
    return {
      ...limits,
      nextHref: null,
      returnHref,
      source: 'sequence',
    };
  }

  return {
    durationSec: DEFAULT_SENSORY_SESSION_DURATION_SEC,
    maxInteractions: DEFAULT_SENSORY_SESSION_MAX_INTERACTIONS,
    nextHref: null,
    returnHref,
    source: 'default',
  };
}

export function resolveSensoryFinalExitHref(plan: SensorySessionPlan): string {
  if (plan.returnHref) return plan.returnHref;
  clearParentGamesSequence();
  return parentGamesReturnHub();
}

/** @deprecated استخدم resolveSensoryFinalExitHref — التقدم التلقائي أُلغي */
export function resolveSensoryExitHref(plan: SensorySessionPlan): string {
  return resolveSensoryFinalExitHref(plan);
}

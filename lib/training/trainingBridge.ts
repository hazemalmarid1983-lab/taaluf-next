/**
 * جسر Home Classroom → Training — قراءة candidates وحالة الخطة فقط.
 * لا يعدّل planExecution ولا ينشئ خططًا.
 */

import type { TrackedGoal } from '@/lib/goalsEngine';
import {
  resolveTrainingEntryState,
  type TrainingPlanExecutionResult,
} from '@/lib/training/planExecution';
import {
  setTrainingPlanLaunchContext,
  type TrainingPlanLaunchContext,
} from '@/lib/training/planLaunchContext';
import { clearPlanActivityRecovery } from '@/lib/training/planActivitySafety';
import { readActiveTrainingChildId } from '@/lib/training/sessionPersistence';
import { SPECIALIST_TRAINING_CHILD_LINKS } from '@/lib/training/trainingActiveChildUx';
import {
  getTrainingCandidatesForTrackedGoal,
  TrainingCandidateError,
} from '@/lib/training/trainingCandidates';

export type TrainingBridgeStatus =
  | 'unavailable'
  | 'no_plan'
  | 'complete'
  | 'ready'
  | 'mismatch';

export type TrainingBridgeState =
  | { status: 'unavailable' }
  | { status: 'no_plan' }
  | { status: 'complete' }
  | { status: 'mismatch' }
  | {
      status: 'ready';
      activityRoute: string;
      launch: TrainingPlanLaunchContext;
    };

export const TRAINING_BRIDGE_NOTICE_KEY = 'taaluf.training.bridgeNotice.v1';

export const TRAINING_BRIDGE_MISMATCH_MESSAGE_AR =
  'الخطة الحالية تحتوي على نشاط آخر باعتباره النشاط التالي.';

export function hasExecutableTrainingCandidate(goal: TrackedGoal): boolean {
  const criterionId = goal.criterionId?.trim();
  if (!criterionId) return false;

  try {
    const candidates = getTrainingCandidatesForTrackedGoal(goal);
    return candidates.media.length > 0;
  } catch {
    return false;
  }
}

export function buildTrainingPlanLaunchContextFromExecution(
  execution: TrainingPlanExecutionResult
): TrainingPlanLaunchContext | null {
  if (!execution.plan || !execution.assignment) {
    return null;
  }

  return {
    planId: execution.plan.id,
    chapterId: execution.plan.chapterId,
    mediaId: execution.assignment.mediaId,
    difficulty: execution.assignment.difficulty,
    order: execution.assignment.order,
    ...(execution.assignment.skillIds?.length
      ? { skillIds: [...execution.assignment.skillIds] }
      : {}),
  };
}

export function resolveTrainingBridgeState(
  childId: string,
  goal: TrackedGoal
): TrainingBridgeState {
  const criterionId = goal.criterionId?.trim();
  if (!criterionId) {
    return { status: 'unavailable' };
  }

  let candidateMediaIds: Set<string>;
  try {
    const candidates = getTrainingCandidatesForTrackedGoal(goal);
    if (candidates.media.length === 0) {
      return { status: 'unavailable' };
    }
    candidateMediaIds = new Set(candidates.media.map((item) => item.mediaId));
  } catch (error) {
    if (error instanceof TrainingCandidateError) {
      return { status: 'unavailable' };
    }
    throw error;
  }

  let entryState;
  try {
    entryState = resolveTrainingEntryState(childId);
  } catch {
    return { status: 'unavailable' };
  }

  if (entryState.kind === 'no_plan') {
    return { status: 'no_plan' };
  }

  if (entryState.kind === 'complete') {
    return { status: 'complete' };
  }

  const { execution } = entryState;
  const mediaId = execution.assignment?.mediaId;
  const launch = buildTrainingPlanLaunchContextFromExecution(execution);

  if (
    mediaId &&
    candidateMediaIds.has(mediaId) &&
    execution.activityRoute &&
    launch
  ) {
    return {
      status: 'ready',
      activityRoute: execution.activityRoute,
      launch,
    };
  }

  return { status: 'mismatch' };
}

/** Home Classroom bridge — canonical `taaluf.activeStudent` id only (no fallback). */
export function readTrainingBridgeActiveChildId(): string | null {
  return readActiveTrainingChildId();
}

export type SpecializedTrainingBridgeActionResult =
  | { kind: 'blocked'; reason: 'missing_child' | 'goal_child_mismatch' }
  | {
      kind: 'ready';
      childId: string;
      activityRoute: string;
      launch: TrainingPlanLaunchContext;
    }
  | { kind: 'navigate'; href: string; mismatchNotice?: boolean }
  | { kind: 'unavailable' };

export function resolveSpecializedTrainingBridgeAction(
  goal: TrackedGoal,
  isParentRole: boolean
): SpecializedTrainingBridgeActionResult {
  const childId = readTrainingBridgeActiveChildId();
  if (!childId) {
    return { kind: 'blocked', reason: 'missing_child' };
  }

  const goalChildId = goal.childId?.trim();
  if (goalChildId && goalChildId !== childId) {
    return { kind: 'blocked', reason: 'goal_child_mismatch' };
  }

  const bridgeState = resolveTrainingBridgeState(childId, goal);

  switch (bridgeState.status) {
    case 'ready':
      return {
        kind: 'ready',
        childId,
        activityRoute: bridgeState.activityRoute,
        launch: bridgeState.launch,
      };
    case 'mismatch':
      return {
        kind: 'navigate',
        href: '/dashboard/training',
        mismatchNotice: true,
      };
    case 'complete':
      return { kind: 'navigate', href: '/dashboard/training' };
    case 'no_plan':
      return {
        kind: 'navigate',
        href: resolveNoPlanTrainingHref(isParentRole),
      };
    default:
      return { kind: 'unavailable' };
  }
}

export function resolveNoPlanTrainingHref(
  isParentRole: boolean
): string {
  return isParentRole
    ? '/dashboard/training'
    : SPECIALIST_TRAINING_CHILD_LINKS.buildPlan;
}

export function stashTrainingBridgeNotice(messageAr: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    TRAINING_BRIDGE_NOTICE_KEY,
    JSON.stringify({ messageAr, at: Date.now() })
  );
}

export function consumeTrainingBridgeNotice(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(TRAINING_BRIDGE_NOTICE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(TRAINING_BRIDGE_NOTICE_KEY);
  try {
    const parsed = JSON.parse(raw) as { messageAr?: string };
    return typeof parsed.messageAr === 'string' ? parsed.messageAr : null;
  } catch {
    return null;
  }
}

/** نفس تسلسل TrainingPlanEntry.handleStart — للاستخدام من الجسر */
export function beginSpecializedTrainingFromBridge(input: {
  launch: TrainingPlanLaunchContext;
  activityRoute: string;
  navigate: (href: string) => void;
}): void {
  clearPlanActivityRecovery();
  setTrainingPlanLaunchContext(input.launch);
  input.navigate(input.activityRoute);
}

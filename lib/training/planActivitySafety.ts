/**
 * حماية مسار التدريب المرتبط بالخطة — بدون محرك استرداد عام.
 */

import {
  clearTrainingPlanLaunchContext,
  consumeTrainingPlanLaunchContext,
  peekTrainingPlanLaunchContext,
  type TrainingPlanLaunchContext,
} from '@/lib/training/planLaunchContext';
import type { TrainingDifficulty } from '@/lib/training/types';
import { getTrainingPlan } from '@/lib/training/storage/planStore';
import { findAssignmentByOrder } from '@/lib/training/validatePlan';
import { readActiveTrainingChildId } from '@/lib/training/sessionPersistence';

const RECOVERY_KEY = 'taaluf.training.planActivityRecovery.v1';

/** fallback when no `taaluf.activeStudent` — legacy standalone behavior */
export const STANDALONE_TRAINING_CHILD_FALLBACK = 'child_local';

/** Standalone activity (no plan launch/recovery): active student id, else fallback. */
export function resolveStandaloneActivityChildId(): string {
  const activeId = readActiveTrainingChildId();
  if (activeId) {
    return activeId;
  }
  return STANDALONE_TRAINING_CHILD_FALLBACK;
}

export type PlanActivityRecoveryContext = TrainingPlanLaunchContext & {
  childId: string;
};

export type PreparePlanActivityBeginInput = {
  pageMediaId: string;
};

export type PreparePlanActivityBeginSuccess = {
  ok: true;
  childId: string;
  planId?: string;
  sessionDifficulty?: TrainingDifficulty;
  goalIds: string[];
};

export type PreparePlanActivityBeginFailure = {
  ok: false;
  reason: 'missing_child' | 'invalid_launch';
};

export type PreparePlanActivityBeginResult =
  | PreparePlanActivityBeginSuccess
  | PreparePlanActivityBeginFailure;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function parseRecovery(raw: string): PlanActivityRecoveryContext | null {
  try {
    const parsed = JSON.parse(raw) as PlanActivityRecoveryContext;
    if (
      typeof parsed.planId !== 'string' ||
      typeof parsed.chapterId !== 'string' ||
      typeof parsed.mediaId !== 'string' ||
      typeof parsed.childId !== 'string' ||
      typeof parsed.order !== 'number' ||
      (parsed.difficulty !== 1 && parsed.difficulty !== 2 && parsed.difficulty !== 3)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function peekPlanActivityRecovery(): PlanActivityRecoveryContext | null {
  if (!isBrowser()) return null;
  const raw = sessionStorage.getItem(RECOVERY_KEY);
  if (!raw) return null;
  return parseRecovery(raw);
}

export function peekPlanActivityRecoveryForMedia(
  mediaId: string
): PlanActivityRecoveryContext | null {
  const recovery = peekPlanActivityRecovery();
  if (!recovery || recovery.mediaId !== mediaId) return null;
  return recovery;
}

export function savePlanActivityRecovery(
  context: PlanActivityRecoveryContext
): void {
  if (!isBrowser()) return;
  sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(context));
}

export function clearPlanActivityRecovery(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(RECOVERY_KEY);
}

export function exitPlanActivityFlow(): void {
  clearPlanActivityRecovery();
  clearTrainingPlanLaunchContext();
}

export function resolveTrainingActivityCompletionHref(planId?: string): string {
  return planId ? '/dashboard/training' : '/dashboard/games';
}

function resolveAssignmentByOrder(planId: string, order: number) {
  const plan = getTrainingPlan(planId);
  if (!plan) return null;
  return findAssignmentByOrder(plan, order) ?? null;
}

function resolveAssignmentGoalIds(planId: string, order: number): string[] {
  const assignment = resolveAssignmentByOrder(planId, order);
  if (!assignment?.goalIds?.length) return [];
  return [...new Set(assignment.goalIds)];
}

export function preparePlanActivityBegin(
  input: PreparePlanActivityBeginInput
): PreparePlanActivityBeginResult {
  const launch = peekTrainingPlanLaunchContext();
  const recovery = peekPlanActivityRecoveryForMedia(input.pageMediaId);

  if (launch) {
    if (launch.mediaId !== input.pageMediaId) {
      clearTrainingPlanLaunchContext();
      return { ok: false, reason: 'invalid_launch' };
    }

    const activeChildId = readActiveTrainingChildId();
    if (!activeChildId) {
      clearTrainingPlanLaunchContext();
      return { ok: false, reason: 'missing_child' };
    }

    consumeTrainingPlanLaunchContext();
    savePlanActivityRecovery({
      ...launch,
      childId: activeChildId,
    });

    return {
      ok: true,
      childId: activeChildId,
      planId: launch.planId,
      sessionDifficulty: launch.difficulty,
      goalIds: resolveAssignmentGoalIds(launch.planId, launch.order),
    };
  }

  if (recovery) {
    const activeChildId = readActiveTrainingChildId();
    if (!activeChildId) {
      return { ok: false, reason: 'missing_child' };
    }
    if (recovery.childId !== activeChildId) {
      clearPlanActivityRecovery();
      return { ok: false, reason: 'missing_child' };
    }

    return {
      ok: true,
      childId: activeChildId,
      planId: recovery.planId,
      sessionDifficulty: recovery.difficulty,
      goalIds: resolveAssignmentGoalIds(recovery.planId, recovery.order),
    };
  }

  return {
    ok: true,
    childId: resolveStandaloneActivityChildId(),
    goalIds: [],
  };
}

export function clearPlanActivityRecoveryAfterPlanSessionComplete(): void {
  clearPlanActivityRecovery();
}

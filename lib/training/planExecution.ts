/**
 * تنفيذ TrainingPlan — الطبقة بين الطفل والأنشطة.
 * لا ينشئ محاولات ولا يطبّق منطق نشاط محدد.
 */

import { resolveTrainingActivityRouteOrThrow } from '@/lib/training/activityRoutes';
import { isPlanExecutionComplete } from '@/lib/training/createPlan';
import { findMediaInChapter, loadChapterById } from '@/lib/training/loadChapter';
import { clearLiveTrainingSession } from '@/lib/training/liveSessionDraft';
import { clearPlanActivityRecoveryAfterPlanSessionComplete } from '@/lib/training/planActivitySafety';
import { publishGameSession } from '@/lib/airtableRealtimeClient';
import { persistCompletedTrainingSession } from '@/lib/training/sessionPersistence';
import {
  getCompletionApplyRecord,
  inferLegacyCompletionFullyApplied,
  markCompletionPlanAdvanceApplied,
} from '@/lib/training/storage/completionApplyStore';
import {
  getActiveTrainingPlan,
  getLatestCompletedTrainingPlan,
  getTrainingPlan,
  MULTIPLE_ACTIVE_TRAINING_PLANS,
  saveTrainingPlan,
} from '@/lib/training/storage/planStore';
import { getTrainingSession } from '@/lib/training/storage/sessionStore';
import type {
  TrainingDifficulty,
  TrainingMedia,
  TrainingPlan,
  TrainingPlanAssignment,
} from '@/lib/training/types';
import {
  findAssignmentByOrder,
  lastAssignmentOrder,
  nextAssignmentOrderAfter,
  validateTrainingPlanDocument,
} from '@/lib/training/validatePlan';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';

export class TrainingPlanExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TrainingPlanExecutionError';
  }
}

export type TrainingPlanExecutionResult = {
  plan: TrainingPlan | null;
  assignment: TrainingPlanAssignment | null;
  media: TrainingMedia | null;
  difficulty: TrainingDifficulty | null;
  isComplete: boolean;
  activityRoute: string | null;
};

function assertValidPlan(plan: TrainingPlan): void {
  const validation = validateTrainingPlanDocument(plan);
  if (!validation.valid) {
    throw new TrainingPlanExecutionError(validation.errors.join('; '));
  }
}

function resolveMediaForAssignment(
  plan: TrainingPlan,
  assignment: TrainingPlanAssignment
): TrainingMedia {
  const chapter = loadChapterById(plan.chapterId);
  const media = findMediaInChapter(chapter, assignment.mediaId);
  if (!media) {
    throw new TrainingPlanExecutionError(
      `الوسيلة غير موجودة في الفصل: ${assignment.mediaId}`
    );
  }
  return media;
}

export function resolveTrainingPlanExecution(
  childId: string
): TrainingPlanExecutionResult {
  let plan: TrainingPlan | null;
  try {
    plan = getActiveTrainingPlan(childId);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith(MULTIPLE_ACTIVE_TRAINING_PLANS)
    ) {
      throw new TrainingPlanExecutionError('خطط نشطة متعددة لنفس الطفل');
    }
    throw error;
  }

  if (!plan) {
    return {
      plan: null,
      assignment: null,
      media: null,
      difficulty: null,
      isComplete: false,
      activityRoute: null,
    };
  }

  return resolveTrainingPlanExecutionForPlan(plan);
}

export function resolveTrainingPlanExecutionForPlan(
  plan: TrainingPlan
): TrainingPlanExecutionResult {
  assertValidPlan(plan);

  if (plan.status === 'completed' || isPlanExecutionComplete(plan)) {
    return {
      plan,
      assignment: null,
      media: null,
      difficulty: null,
      isComplete: true,
      activityRoute: null,
    };
  }

  if (plan.status !== 'active') {
    throw new TrainingPlanExecutionError(
      `الخطة غير قابلة للتنفيذ — status=${plan.status}`
    );
  }

  const assignment = findAssignmentByOrder(plan, plan.cursor.nextOrder);
  if (!assignment) {
    return {
      plan,
      assignment: null,
      media: null,
      difficulty: null,
      isComplete: true,
      activityRoute: null,
    };
  }

  const media = resolveMediaForAssignment(plan, assignment);
  const activityRoute = resolveTrainingActivityRouteOrThrow(
    plan.chapterId,
    assignment.mediaId
  );

  return {
    plan,
    assignment,
    media,
    difficulty: assignment.difficulty,
    isComplete: false,
    activityRoute,
  };
}

export function advanceTrainingPlan(
  planId: string,
  context?: { completedMediaId: string }
): TrainingPlan {
  const plan = getTrainingPlan(planId);
  if (!plan) {
    throw new TrainingPlanExecutionError(`الخطة غير موجودة: ${planId}`);
  }

  assertValidPlan(plan);

  if (plan.status === 'completed') {
    throw new TrainingPlanExecutionError('لا يمكن تقديم خطة مكتملة');
  }

  if (plan.status === 'archived') {
    throw new TrainingPlanExecutionError('لا يمكن تقديم خطة مؤرشفة');
  }

  const currentOrder = plan.cursor.nextOrder;
  const currentAssignment = findAssignmentByOrder(plan, currentOrder);
  if (!currentAssignment) {
    throw new TrainingPlanExecutionError(
      `cursor.nextOrder غير صالح: ${currentOrder}`
    );
  }

  if (
    context?.completedMediaId &&
    currentAssignment.mediaId !== context.completedMediaId
  ) {
    throw new TrainingPlanExecutionError(
      'الوسيلة المكتملة لا تطابق المهمة الحالية في الخطة'
    );
  }

  const nextOrder = nextAssignmentOrderAfter(plan, currentOrder);
  if (nextOrder === null) {
    const updated: TrainingPlan = {
      ...plan,
      status: 'completed',
      cursor: { nextOrder: lastAssignmentOrder(plan) + 1 },
    };
    assertValidPlan(updated);
    return saveTrainingPlan(updated);
  }

  const updated: TrainingPlan = {
    ...plan,
    cursor: { nextOrder },
  };
  assertValidPlan(updated);
  return saveTrainingPlan(updated);
}

function planAdvanceAlreadyApplied(session: TrainingSessionRuntime): boolean {
  const ledger = getCompletionApplyRecord(session.id);
  if (ledger) {
    return ledger.planAdvanceApplied;
  }
  const stored = getTrainingSession(session.id);
  return (
    Boolean(session.planId) &&
    inferLegacyCompletionFullyApplied(
      session.id,
      stored?.status === 'completed'
    )
  );
}

/** بعد اكتمال الجلسة بنجاح — يحفظ التقدم ويقدّم مؤشر الخطة */
export function persistSessionAndAdvancePlan(
  session: TrainingSessionRuntime
) {
  const result = persistCompletedTrainingSession(session);
  if (result.applied) {
    publishGameSession({
      sessionKey: session.id,
      childId: session.childId,
      gameCode: session.mediaId,
      independence: result.metrics.independence,
      mood: session.postSessionMood,
      accuracy: result.metrics.accuracy,
      levelReached: session.difficulty,
      totalTrials: result.metrics.totalTrials,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      summary: `جلسة ${session.mediaId}: استقلال ${result.metrics.independence}%${
        session.postSessionMood ? ` — مزاج ${session.postSessionMood}` : ''
      }`,
    });
  }
  if (session.planId) {
    if (!planAdvanceAlreadyApplied(session)) {
      advanceTrainingPlan(session.planId, {
        completedMediaId: session.mediaId,
      });
      markCompletionPlanAdvanceApplied(session.id);
    }
    clearPlanActivityRecoveryAfterPlanSessionComplete();
  }
  clearLiveTrainingSession(session.id);
  return result;
}

export type TrainingEntryState =
  | { kind: 'no_plan' }
  | { kind: 'complete'; plan: TrainingPlan }
  | { kind: 'ready'; execution: TrainingPlanExecutionResult };

export function resolveTrainingEntryState(childId: string): TrainingEntryState {
  let plan: TrainingPlan | null;
  try {
    plan = getActiveTrainingPlan(childId);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith(MULTIPLE_ACTIVE_TRAINING_PLANS)
    ) {
      throw new TrainingPlanExecutionError('خطط نشطة متعددة لنفس الطفل');
    }
    throw error;
  }

  if (!plan) {
    const completed = getLatestCompletedTrainingPlan(childId);
    if (completed) {
      return { kind: 'complete', plan: completed };
    }
    return { kind: 'no_plan' };
  }

  const execution = resolveTrainingPlanExecutionForPlan(plan);
  if (execution.isComplete) {
    return { kind: 'complete', plan };
  }

  return { kind: 'ready', execution };
}

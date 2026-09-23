/**
 * بناء TrainingPlan — للاختبار والتهيئة البرمجية فقط.
 * لا يختار وسائل تلقائياً — المتصل يمرّر mediaIds صراحة.
 */

import type {
  TrainingDifficulty,
  TrainingPlan,
  TrainingPlanAssignment,
} from '@/lib/training/types';
import {
  firstAssignmentOrder,
  lastAssignmentOrder,
  validateTrainingPlanDocument,
} from '@/lib/training/validatePlan';

export type CreateTrainingPlanAssignmentInput = {
  mediaId: string;
  difficulty?: TrainingDifficulty;
  order?: number;
  goalIds?: string[];
  skillIds?: string[];
};

export type CreateTrainingPlanInput = {
  id?: string;
  childId: string;
  chapterId: string;
  assignments: CreateTrainingPlanAssignmentInput[];
  goalIds?: string[];
  status?: TrainingPlan['status'];
  startDate?: string;
  targetDate?: string;
  cursorOrder?: number;
};

function createPlanId(): string {
  return `training_plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildTrainingPlanAssignments(
  inputs: CreateTrainingPlanAssignmentInput[]
): TrainingPlanAssignment[] {
  if (inputs.length === 0) {
    throw new Error('assignments مطلوبة — لا يمكن إنشاء خطة فارغة');
  }

  return inputs.map((item, index) => {
    if (!item.mediaId.trim()) {
      throw new Error(`assignments[${index}].mediaId مطلوب`);
    }

    const difficulty = item.difficulty ?? 1;
    if (difficulty !== 1 && difficulty !== 2 && difficulty !== 3) {
      throw new Error(`assignments[${index}].difficulty غير صالح`);
    }

    const assignment: TrainingPlanAssignment = {
      mediaId: item.mediaId.trim(),
      difficulty,
      order: item.order ?? index + 1,
    };
    if (item.goalIds !== undefined) {
      assignment.goalIds = [...new Set(item.goalIds)];
    }
    if (item.skillIds !== undefined && item.skillIds.length > 0) {
      assignment.skillIds = [...new Set(item.skillIds)];
    }
    return assignment;
  });
}

export function createTrainingPlan(input: CreateTrainingPlanInput): TrainingPlan {
  const assignments = buildTrainingPlanAssignments(input.assignments);
  const sortedOrders = [...assignments].map((item) => item.order).sort((a, b) => a - b);
  const uniqueOrders = new Set(sortedOrders);
  if (uniqueOrders.size !== assignments.length) {
    throw new Error('assignments.order يجب أن تكون فريدة');
  }

  const uniqueMedia = new Set(assignments.map((item) => item.mediaId));
  if (uniqueMedia.size !== assignments.length) {
    throw new Error('assignments.mediaId يجب أن تكون فريدة');
  }

  const status = input.status ?? 'active';
  const firstOrder = Math.min(...assignments.map((item) => item.order));
  const lastOrder = Math.max(...assignments.map((item) => item.order));

  let nextOrder = input.cursorOrder ?? firstOrder;
  if (status === 'completed') {
    nextOrder = lastOrder + 1;
  }

  const plan: TrainingPlan = {
    id: input.id?.trim() || createPlanId(),
    childId: input.childId.trim(),
    chapterId: input.chapterId.trim(),
    goalIds: input.goalIds,
    assignments,
    cursor: { nextOrder },
    startDate: input.startDate ?? new Date().toISOString(),
    targetDate: input.targetDate,
    status,
  };

  const validation = validateTrainingPlanDocument(plan);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  return plan;
}

/** خطة اختبارية — كل وسائل attention-focus بالترتيب الافتراضي */
export function createAttentionFocusTestPlan(
  childId: string,
  options?: {
    mediaIds?: string[];
    status?: TrainingPlan['status'];
    goalIds?: string[];
  }
): TrainingPlan {
  const mediaIds =
    options?.mediaIds ??
    ([
      'follow-star',
      'match-me',
      'where-did-it-go',
      'find-the-target',
      'wait-then-touch',
    ] as const);

  return createTrainingPlan({
    childId,
    chapterId: 'attention-focus',
    goalIds: options?.goalIds,
    status: options?.status ?? 'active',
    assignments: mediaIds.map((mediaId, index) => ({
      mediaId,
      difficulty: 1 as TrainingDifficulty,
      order: index + 1,
    })),
  });
}

export function isPlanExecutionComplete(plan: TrainingPlan): boolean {
  return (
    plan.status === 'completed' ||
    plan.cursor.nextOrder > lastAssignmentOrder(plan)
  );
}

export { firstAssignmentOrder, lastAssignmentOrder };

/**
 * التحقق من TrainingPlan — طبقة التنفيذ.
 */

import {
  isC15ProgressionDimensionSkillId,
  isC15TargetSkillId,
} from '@/lib/training/c15SkillClassification';
import { OBSERVER_IMITATION_MEDIA_ID } from '@/lib/training/observerImitationEngine';
import { isValidTrainingDifficulty } from '@/lib/training/engine/mediaLoader';
import { findMediaInChapter, loadChapterById } from '@/lib/training/loadChapter';
import type {
  TrainingPlan,
  TrainingPlanAssignment,
  TrainingValidationResult,
} from '@/lib/training/types';

export const TRAINING_PLAN_STATUSES: TrainingPlan['status'][] = [
  'draft',
  'active',
  'paused',
  'completed',
  'archived',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  return !Number.isNaN(Date.parse(value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function validateAssignment(
  assignment: unknown,
  index: number,
  errors: string[]
): assignment is TrainingPlanAssignment {
  if (!isRecord(assignment)) {
    errors.push(`assignments[${index}] يجب أن يكون كائناً`);
    return false;
  }

  if (typeof assignment.mediaId !== 'string' || !assignment.mediaId.trim()) {
    errors.push(`assignments[${index}].mediaId مطلوب`);
  }

  if (!isValidTrainingDifficulty(Number(assignment.difficulty))) {
    errors.push(`assignments[${index}].difficulty يجب أن يكون 1 أو 2 أو 3`);
  }

  const order = Number(assignment.order);
  if (!Number.isInteger(order) || order < 1) {
    errors.push(`assignments[${index}].order يجب أن يكون عدداً صحيحاً موجباً`);
  }

  if (assignment.goalIds !== undefined) {
    if (!isStringArray(assignment.goalIds)) {
      errors.push(`assignments[${index}].goalIds يجب أن يكون مصفوفة نصوص`);
    } else if (new Set(assignment.goalIds).size !== assignment.goalIds.length) {
      errors.push(`assignments[${index}].goalIds يجب أن تكون فريدة`);
    }
  }

  if (assignment.skillIds !== undefined) {
    if (!isStringArray(assignment.skillIds)) {
      errors.push(`assignments[${index}].skillIds يجب أن يكون مصفوفة نصوص`);
    } else if (assignment.skillIds.length === 0) {
      errors.push(
        `assignments[${index}].skillIds يجب أن تكون غير فارغة عند التعريف`
      );
    } else if (new Set(assignment.skillIds).size !== assignment.skillIds.length) {
      errors.push(`assignments[${index}].skillIds يجب أن تكون فريدة`);
    }
  }

  return true;
}

function validateAssignmentSkillIdsAgainstChapter(
  assignment: Record<string, unknown>,
  index: number,
  chapterId: string,
  errors: string[]
) {
  if (assignment.skillIds === undefined) return;

  const skillIds = assignment.skillIds;
  if (!isStringArray(skillIds) || skillIds.length === 0) return;

  const mediaId =
    typeof assignment.mediaId === 'string' ? assignment.mediaId.trim() : '';
  if (!mediaId) return;

  let chapter;
  try {
    chapter = loadChapterById(chapterId);
  } catch {
    errors.push(`chapterId غير معروف: ${chapterId}`);
    return;
  }

  const media = findMediaInChapter(chapter, mediaId);
  if (!media) {
    errors.push(
      `assignments[${index}].mediaId غير موجود في الفصل ${chapterId}: ${mediaId}`
    );
    return;
  }

  const knownSkillIds = new Set(chapter.skills.map((skill) => skill.skillId));
  const mediaSkillIds = new Set(media.skillIds);

  for (const skillId of skillIds) {
    if (!knownSkillIds.has(skillId)) {
      errors.push(
        `assignments[${index}].skillIds يشير إلى مهارة غير معرّفة في الفصل: ${skillId}`
      );
      continue;
    }

    if (mediaId === OBSERVER_IMITATION_MEDIA_ID) {
      if (isC15ProgressionDimensionSkillId(skillId)) {
        // خطط قديمة قد تحتوي S4/S5 — نبقيها صالحة دون migration
        continue;
      }
      if (!isC15TargetSkillId(skillId)) {
        errors.push(
          `assignments[${index}].skillIds: ${skillId} ليست مهارة target لـ observer-imitation`
        );
        continue;
      }
    }

    if (!mediaSkillIds.has(skillId)) {
      errors.push(
        `assignments[${index}].skillIds: المهارة ${skillId} غير مرتبطة بالوسيلة ${mediaId}`
      );
    }
  }
}

export function sortedPlanAssignments(
  plan: Pick<TrainingPlan, 'assignments'>
): TrainingPlanAssignment[] {
  return [...plan.assignments].sort((a, b) => a.order - b.order);
}

export function validateTrainingPlanDocument(
  input: unknown
): TrainingValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ['TrainingPlan يجب أن يكون كائناً'] };
  }

  if (typeof input.id !== 'string' || !input.id.trim()) {
    errors.push('id مطلوب');
  }
  if (typeof input.childId !== 'string' || !input.childId.trim()) {
    errors.push('childId مطلوب');
  }
  if (typeof input.chapterId !== 'string' || !input.chapterId.trim()) {
    errors.push('chapterId مطلوب');
  }
  if (!isIsoDate(input.startDate)) {
    errors.push('startDate يجب أن يكون تاريخاً صالحاً');
  }
  if (input.targetDate !== undefined && !isIsoDate(input.targetDate)) {
    errors.push('targetDate يجب أن يكون تاريخاً صالحاً');
  }
  if (
    typeof input.status !== 'string' ||
    !TRAINING_PLAN_STATUSES.includes(input.status as TrainingPlan['status'])
  ) {
    errors.push('status غير صالح');
  }
  if (input.goalIds !== undefined && !isStringArray(input.goalIds)) {
    errors.push('goalIds يجب أن يكون مصفوفة نصوص');
  }

  if (!Array.isArray(input.assignments) || input.assignments.length === 0) {
    errors.push('assignments يجب أن يكون مصفوفة غير فارغة');
  } else {
    const orders = new Set<number>();
    const mediaIds = new Set<string>();

    input.assignments.forEach((assignment, index) => {
      validateAssignment(assignment, index, errors);
      if (!isRecord(assignment)) return;

      const order = Number(assignment.order);
      if (Number.isInteger(order)) {
        if (orders.has(order)) {
          errors.push(`assignments[${index}].order مكرر: ${order}`);
        }
        orders.add(order);
      }

      const mediaId =
        typeof assignment.mediaId === 'string' ? assignment.mediaId.trim() : '';
      if (mediaId) {
        if (mediaIds.has(mediaId)) {
          errors.push(`assignments[${index}].mediaId مكرر: ${mediaId}`);
        }
        mediaIds.add(mediaId);
      }

      const chapterId =
        typeof input.chapterId === 'string' ? input.chapterId.trim() : '';
      if (chapterId) {
        validateAssignmentSkillIdsAgainstChapter(
          assignment,
          index,
          chapterId,
          errors
        );
      }
    });
  }

  if (!isRecord(input.cursor)) {
    errors.push('cursor مطلوب');
  } else {
    const nextOrder = Number(input.cursor.nextOrder);
    if (!Number.isInteger(nextOrder) || nextOrder < 1) {
      errors.push('cursor.nextOrder يجب أن يكون عدداً صحيحاً موجباً');
    } else if (Array.isArray(input.assignments) && input.assignments.length > 0) {
      const orders = input.assignments
        .map((item) => (isRecord(item) ? Number(item.order) : NaN))
        .filter((value) => Number.isInteger(value));
      const maxOrder = Math.max(...orders);
      const status = input.status as TrainingPlan['status'];

      if (status === 'completed') {
        if (nextOrder <= maxOrder) {
          errors.push(
            'cursor.nextOrder يجب أن يتجاوز آخر ترتيب عند status=completed'
          );
        }
      } else if (status === 'active' || status === 'paused' || status === 'draft') {
        if (!orders.includes(nextOrder)) {
          errors.push('cursor.nextOrder لا يطابق أي assignment.order نشط');
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function findAssignmentByOrder(
  plan: TrainingPlan,
  order: number
): TrainingPlanAssignment | undefined {
  return plan.assignments.find((assignment) => assignment.order === order);
}

export function firstAssignmentOrder(plan: TrainingPlan): number {
  return sortedPlanAssignments(plan)[0].order;
}

export function lastAssignmentOrder(plan: TrainingPlan): number {
  const sorted = sortedPlanAssignments(plan);
  return sorted[sorted.length - 1].order;
}

export function nextAssignmentOrderAfter(
  plan: TrainingPlan,
  currentOrder: number
): number | null {
  const sorted = sortedPlanAssignments(plan);
  const index = sorted.findIndex((assignment) => assignment.order === currentOrder);
  if (index < 0) return null;
  return sorted[index + 1]?.order ?? null;
}

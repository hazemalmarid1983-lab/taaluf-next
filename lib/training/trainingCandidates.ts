/**
 * مرشّحات التدريب — criterion → skill → media فقط.
 * لا يختار نشاطاً ولا ينشئ خطة ولا يشخّص.
 *
 * نطاق الفصل الحالي: attention-focus فقط (قابل للتوسيع لاحقاً).
 * معايير التقييم: data/taalof_criteria_v3.json فقط (CRITERIA_LIST).
 */

import type { TrackedGoal } from '@/lib/goalsEngine';
import { loadGoalsLocal } from '@/lib/goalsStore';
import {
  CANONICAL_CRITERIA_SOURCE,
  getCriterionById,
} from '@/lib/training/canonicalCriteria';
import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '@/lib/training/loadChapter';
import type { TrainingMedia, TrainingSkill } from '@/lib/training/types';
import type { Criterion } from '@/types/taalof';

/** الفصل الوحيد المدعوم في هذه المرحلة */
export const TRAINING_CANDIDATE_CHAPTER_ID = ATTENTION_FOCUS_CHAPTER_ID;

export class TrainingCandidateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TrainingCandidateError';
  }
}

export type TrainingCandidatesResult = {
  goal: TrackedGoal;
  criterion: Criterion;
  criterionId: string;
  chapterId: string;
  skills: TrainingSkill[];
  media: TrainingMedia[];
};

export type TrainingCriterionCandidatesResult = {
  criterion: Criterion;
  criterionId: string;
  chapterId: string;
  skills: TrainingSkill[];
  media: TrainingMedia[];
};

function resolveAttentionFocusCandidates(criterionId: string): {
  chapterId: string;
  skills: TrainingSkill[];
  media: TrainingMedia[];
} {
  const chapter = loadAttentionFocusChapter();
  const skills = chapter.skills.filter((skill) =>
    skill.criterionIds.includes(criterionId)
  );
  const skillIds = new Set(skills.map((skill) => skill.skillId));
  const media = chapter.media.filter((item) =>
    item.skillIds.some((id) => skillIds.has(id))
  );

  return {
    chapterId: ATTENTION_FOCUS_CHAPTER_ID,
    skills,
    media,
  };
}

export function getTrainingCandidatesForCriterion(
  criterionId: string
): TrainingCriterionCandidatesResult {
  const trimmed = criterionId.trim();
  if (!trimmed) {
    throw new TrainingCandidateError('criterionId مطلوب');
  }

  const criterion = getCriterionById(trimmed);
  if (!criterion) {
    throw new TrainingCandidateError(`معيار غير صالح: ${trimmed}`);
  }

  const resolved = resolveAttentionFocusCandidates(trimmed);

  return {
    criterion,
    criterionId: trimmed,
    chapterId: resolved.chapterId,
    skills: resolved.skills,
    media: resolved.media,
  };
}

export function getTrainingCandidatesForTrackedGoal(
  goal: TrackedGoal
): TrainingCandidatesResult {
  const candidates = getTrainingCandidatesForCriterion(goal.criterionId);
  return {
    goal,
    ...candidates,
  };
}

export function getTrainingCandidatesForGoal(
  goalId: string
): TrainingCandidatesResult {
  const trimmed = goalId.trim();
  if (!trimmed) {
    throw new TrainingCandidateError('goalId مطلوب');
  }

  const goal = loadGoalsLocal().find((item) => item.id === trimmed);
  if (!goal) {
    throw new TrainingCandidateError(`الهدف غير موجود: ${trimmed}`);
  }

  return getTrainingCandidatesForTrackedGoal(goal);
}

/** للاختبارات والتوثيق — يؤكد مصدر المعايير المعتمد */
export function getTrainingCandidateCriteriaSource(): string {
  return CANONICAL_CRITERIA_SOURCE;
}

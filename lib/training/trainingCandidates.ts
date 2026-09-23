/**
 * مرشّحات التدريب — criterion → skill → media فقط.
 * لا يختار نشاطاً ولا ينشئ خطة ولا يشخّص.
 *
 * نطاق الفصول: attention-focus + communication-language + motor-social-imitation.
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
  listTrainingChapterIds,
  loadChapterById,
} from '@/lib/training/loadChapter';
import type { TrainingMedia, TrainingSkill } from '@/lib/training/types';
import type { Criterion } from '@/types/taalof';

/** @deprecated استخدم chapterId من نتيجة getTrainingCandidatesForCriterion */
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

function resolveTrainingCandidatesForChapter(
  chapterId: string,
  criterionId: string
): {
  chapterId: string;
  skills: TrainingSkill[];
  media: TrainingMedia[];
} | null {
  const chapter = loadChapterById(chapterId);
  const skills = chapter.skills.filter((skill) =>
    skill.criterionIds.includes(criterionId)
  );
  if (skills.length === 0) {
    return null;
  }
  const skillIds = new Set(skills.map((skill) => skill.skillId));
  const media = chapter.media.filter((item) =>
    item.skillIds.some((id) => skillIds.has(id))
  );

  return {
    chapterId,
    skills,
    media,
  };
}

function resolveTrainingCandidates(criterionId: string): {
  chapterId: string;
  skills: TrainingSkill[];
  media: TrainingMedia[];
} {
  for (const chapterId of listTrainingChapterIds()) {
    const resolved = resolveTrainingCandidatesForChapter(chapterId, criterionId);
    if (resolved) {
      return resolved;
    }
  }
  return { chapterId: '', skills: [], media: [] };
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

  const resolved = resolveTrainingCandidates(trimmed);

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

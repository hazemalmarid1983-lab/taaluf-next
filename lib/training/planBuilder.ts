/**
 * منطق بناء خطة التدريب للمختص — orchestration فقط.
 * الأهداف: goalsStore | المرشّحون: trainingCandidates | الحفظ: createPlan + planStore
 */

import type { TrackedGoal } from '@/lib/goalsEngine';
import { loadGoalsLocal } from '@/lib/goalsStore';
import {
  createTrainingPlan,
  type CreateTrainingPlanAssignmentInput,
} from '@/lib/training/createPlan';
import { loadAttentionFocusChapter } from '@/lib/training/loadChapter';
import {
  getActiveTrainingPlan,
  MULTIPLE_ACTIVE_TRAINING_PLANS,
  saveTrainingPlan,
} from '@/lib/training/storage/planStore';
import {
  getTrainingCandidatesForTrackedGoal,
  TRAINING_CANDIDATE_CHAPTER_ID,
  type TrainingCandidatesResult,
} from '@/lib/training/trainingCandidates';
import type { TrainingDifficulty, TrainingPlan } from '@/lib/training/types';
import { sortedPlanAssignments } from '@/lib/training/validatePlan';

export const TRAINING_PLAN_BUILDER_DISCLAIMER =
  'اقتراح محتوى تدريبي — قرار الخطة للمختص/ولي الأمر.';

export const PLAN_BUILDER_EMPTY_CANDIDATES_MESSAGE =
  'لا توجد أنشطة تدريبية مرتبطة بهذا الهدف حاليًا.';

export const PLAN_BUILDER_EMPTY_CANDIDATES_HINT =
  'يمكن إضافة محتوى تدريبي لهذا المعيار لاحقًا.';

export const PLAN_BUILDER_ACTIVE_PLAN_MESSAGE =
  'يوجد بالفعل برنامج تدريبي نشط لهذا الطفل.';

export class PlanBuilderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanBuilderError';
  }
}

export type PlanBuilderGoalView = {
  goal: TrackedGoal;
  candidates: TrainingCandidatesResult;
  hasCandidates: boolean;
};

export type PlanBuilderCandidateEntry = {
  goalId: string;
  goalTitle: string;
  criterionId: string;
  criterionTitle: string;
  skillId: string;
  skillTitleAr: string;
  mediaId: string;
  mediaTitleAr: string;
};

export type PlanBuilderMediaOption = {
  mediaId: string;
  mediaTitleAr: string;
  skillId: string;
  skillTitleAr: string;
  relatedGoalIds: string[];
  relatedGoalTitles: string[];
  criterionId: string;
  criterionTitle: string;
};

export type PlanBuilderActivePlanCheck =
  | { allowed: true; activePlan: null }
  | { allowed: false; activePlan: TrainingPlan; reason: 'active_plan_exists' }
  | { allowed: false; activePlan: null; reason: 'multiple_active_plans' };

export function loadGoalsForPlanBuilder(childId: string): TrackedGoal[] {
  return loadGoalsLocal(childId);
}

export function checkPlanBuilderActivePlan(
  childId: string
): PlanBuilderActivePlanCheck {
  try {
    const activePlan = getActiveTrainingPlan(childId);
    if (activePlan) {
      return {
        allowed: false,
        activePlan,
        reason: 'active_plan_exists',
      };
    }
    return { allowed: true, activePlan: null };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith(MULTIPLE_ACTIVE_TRAINING_PLANS)
    ) {
      return { allowed: false, activePlan: null, reason: 'multiple_active_plans' };
    }
    throw error;
  }
}

export function resolvePlanBuilderGoalViews(
  childId: string,
  selectedGoalIds: string[]
): PlanBuilderGoalView[] {
  if (selectedGoalIds.length === 0) {
    throw new PlanBuilderError('يجب اختيار هدف واحد على الأقل');
  }

  const childGoals = loadGoalsLocal(childId);

  return selectedGoalIds.map((goalId) => {
    const goal = childGoals.find((item) => item.id === goalId);
    if (!goal) {
      throw new PlanBuilderError(`الهدف غير موجود لهذا الطفل: ${goalId}`);
    }

    const candidates = getTrainingCandidatesForTrackedGoal(goal);
    return {
      goal,
      candidates,
      hasCandidates: candidates.media.length > 0,
    };
  });
}

export function listCandidateEntriesForGoal(
  view: PlanBuilderGoalView
): PlanBuilderCandidateEntry[] {
  if (!view.hasCandidates) return [];

  const chapter = loadAttentionFocusChapter();

  return view.candidates.media.map((media) => {
    const skill =
      chapter.skills.find((item) => media.skillIds.includes(item.skillId)) ??
      view.candidates.skills.find((item) => media.skillIds.includes(item.skillId));

    if (!skill) {
      throw new PlanBuilderError(
        `مهارة غير معروفة للوسيلة ${media.mediaId} في الهدف ${view.goal.id}`
      );
    }

    return {
      goalId: view.goal.id,
      goalTitle: view.goal.title,
      criterionId: view.candidates.criterionId,
      criterionTitle: view.candidates.criterion.name,
      skillId: skill.skillId,
      skillTitleAr: skill.titleAr,
      mediaId: media.mediaId,
      mediaTitleAr: media.titleAr,
    };
  });
}

export function buildMediaOptionsFromGoalViews(
  views: PlanBuilderGoalView[]
): PlanBuilderMediaOption[] {
  const chapter = loadAttentionFocusChapter();
  const byMedia = new Map<string, PlanBuilderMediaOption>();

  for (const view of views) {
    if (!view.hasCandidates) continue;

    for (const media of view.candidates.media) {
      const skill =
        chapter.skills.find((item) => media.skillIds.includes(item.skillId)) ??
        view.candidates.skills.find((item) => media.skillIds.includes(item.skillId));

      if (!skill) continue;

      const existing = byMedia.get(media.mediaId);
      if (existing) {
        if (!existing.relatedGoalIds.includes(view.goal.id)) {
          existing.relatedGoalIds.push(view.goal.id);
          existing.relatedGoalTitles.push(view.goal.title);
        }
        continue;
      }

      byMedia.set(media.mediaId, {
        mediaId: media.mediaId,
        mediaTitleAr: media.titleAr,
        skillId: skill.skillId,
        skillTitleAr: skill.titleAr,
        relatedGoalIds: [view.goal.id],
        relatedGoalTitles: [view.goal.title],
        criterionId: view.candidates.criterionId,
        criterionTitle: view.candidates.criterion.name,
      });
    }
  }

  return Array.from(byMedia.values());
}

export function assertValidPlanBuilderDifficulty(
  difficulty: number
): TrainingDifficulty {
  if (difficulty !== 1 && difficulty !== 2 && difficulty !== 3) {
    throw new PlanBuilderError('الصعوبة يجب أن تكون 1 أو 2 أو 3');
  }
  return difficulty;
}

export function buildOrderedAssignments(
  orderedMediaIds: string[],
  difficulties: Record<string, TrainingDifficulty>
): CreateTrainingPlanAssignmentInput[] {
  if (orderedMediaIds.length === 0) {
    throw new PlanBuilderError('يجب اختيار نشاط واحد على الأقل');
  }

  const unique = new Set(orderedMediaIds);
  if (unique.size !== orderedMediaIds.length) {
    throw new PlanBuilderError('لا يمكن تكرار نفس النشاط في الخطة');
  }

  return orderedMediaIds.map((mediaId, index) => ({
    mediaId,
    difficulty: assertValidPlanBuilderDifficulty(
      difficulties[mediaId] ?? 1
    ),
    order: index + 1,
  }));
}

export function saveTrainingPlanFromBuilder(input: {
  childId: string;
  selectedGoalIds: string[];
  orderedMediaIds: string[];
  difficulties: Record<string, TrainingDifficulty>;
}): TrainingPlan {
  const activeCheck = checkPlanBuilderActivePlan(input.childId);
  if (!activeCheck.allowed) {
    if (activeCheck.reason === 'active_plan_exists') {
      throw new PlanBuilderError(PLAN_BUILDER_ACTIVE_PLAN_MESSAGE);
    }
    throw new PlanBuilderError('خطط نشطة متعددة لنفس الطفل');
  }

  resolvePlanBuilderGoalViews(input.childId, input.selectedGoalIds);

  const assignments = buildOrderedAssignments(
    input.orderedMediaIds,
    input.difficulties
  );

  const plan = createTrainingPlan({
    childId: input.childId,
    chapterId: TRAINING_CANDIDATE_CHAPTER_ID,
    goalIds: [...new Set(input.selectedGoalIds)],
    assignments,
    status: 'active',
  });

  return saveTrainingPlan(plan);
}

export function describeSavedPlan(plan: TrainingPlan): {
  activityCount: number;
  firstActivityMediaId: string | null;
  firstActivityTitleAr: string | null;
} {
  const sorted = sortedPlanAssignments(plan);
  const first = sorted[0];
  if (!first) {
    return {
      activityCount: 0,
      firstActivityMediaId: null,
      firstActivityTitleAr: null,
    };
  }

  const chapter = loadAttentionFocusChapter();
  const media = chapter.media.find((item) => item.mediaId === first.mediaId);

  return {
    activityCount: sorted.length,
    firstActivityMediaId: first.mediaId,
    firstActivityTitleAr: media?.titleAr ?? null,
  };
}

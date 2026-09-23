/**
 * منطق بناء خطة التدريب للمختص — orchestration فقط.
 * الأهداف: goalsStore | المرشّحون: trainingCandidates | الحفظ: createPlan + planStore
 */

import type { TrackedGoal } from '@/lib/goalsEngine';
import { loadGoalsLocal } from '@/lib/goalsStore';
import {
  filterObserverImitationTargetSkillIds,
  isC15ProgressionDimensionSkillId,
} from '@/lib/training/c15SkillClassification';
import {
  createTrainingPlan,
  type CreateTrainingPlanAssignmentInput,
} from '@/lib/training/createPlan';
import {
  findChapterIdForMedia,
  loadChapterById,
} from '@/lib/training/loadChapter';
import { OBSERVER_IMITATION_MEDIA_ID } from '@/lib/training/observerImitationEngine';
import {
  getActiveTrainingPlan,
  MULTIPLE_ACTIVE_TRAINING_PLANS,
  saveTrainingPlan,
} from '@/lib/training/storage/planStore';
import {
  getTrainingCandidatesForTrackedGoal,
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

/** اختيار مهارات per-media في Plan Builder */
export type PlanBuilderActivitySkills = Record<string, string[]>;

export type PlanBuilderConfigureRow = {
  mediaId: string;
  mediaTitleAr: string;
  skillIds: string[];
  skillTitlesAr: string[];
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

export function resolveChapterIdForPlanMedia(orderedMediaIds: string[]): string {
  if (orderedMediaIds.length === 0) {
    throw new PlanBuilderError('يجب اختيار نشاط واحد على الأقل');
  }
  const chapterIds = orderedMediaIds.map((mediaId) => {
    const chapterId = findChapterIdForMedia(mediaId);
    if (!chapterId) {
      throw new PlanBuilderError(`نشاط تدريب غير معروف: ${mediaId}`);
    }
    return chapterId;
  });
  const unique = new Set(chapterIds);
  if (unique.size > 1) {
    throw new PlanBuilderError(
      'الخطة الحالية تدعم فصلاً تدريبياً واحداً في كل برنامج'
    );
  }
  return chapterIds[0];
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

  const chapter = loadChapterById(view.candidates.chapterId);

  return view.candidates.media.flatMap((media) => {
    const skills = view.candidates.skills.filter((item) =>
      media.skillIds.includes(item.skillId)
    );

    const resolved =
      skills.length > 0
        ? skills
        : (() => {
            const fallback =
              chapter.skills.find((item) =>
                media.skillIds.includes(item.skillId)
              ) ??
              view.candidates.skills.find((item) =>
                media.skillIds.includes(item.skillId)
              );
            return fallback ? [fallback] : [];
          })();

    if (resolved.length === 0) {
      throw new PlanBuilderError(
        `مهارة غير معروفة للوسيلة ${media.mediaId} في الهدف ${view.goal.id}`
      );
    }

    return resolved.map((skill) => ({
      goalId: view.goal.id,
      goalTitle: view.goal.title,
      criterionId: view.candidates.criterionId,
      criterionTitle: view.candidates.criterion.name,
      skillId: skill.skillId,
      skillTitleAr: skill.titleAr,
      mediaId: media.mediaId,
      mediaTitleAr: media.titleAr,
    }));
  });
}

export function buildMediaOptionsFromGoalViews(
  views: PlanBuilderGoalView[]
): PlanBuilderMediaOption[] {
  const byMedia = new Map<string, PlanBuilderMediaOption>();

  for (const view of views) {
    if (!view.hasCandidates) continue;

    const chapter = loadChapterById(view.candidates.chapterId);

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

export function isPlanBuilderSkillSelected(
  selection: PlanBuilderActivitySkills,
  mediaId: string,
  skillId: string
): boolean {
  return (selection[mediaId] ?? []).includes(skillId);
}

export function togglePlanBuilderActivitySkill(
  selection: PlanBuilderActivitySkills,
  mediaOrder: string[],
  mediaId: string,
  skillId: string
): { selection: PlanBuilderActivitySkills; mediaOrder: string[] } {
  if (
    mediaId === OBSERVER_IMITATION_MEDIA_ID &&
    isC15ProgressionDimensionSkillId(skillId)
  ) {
    throw new PlanBuilderError(
      'S4/S5 أبعاد تقدم/بروتوكول — لا تُختار كمهارات target في الخطة'
    );
  }
  const current = selection[mediaId] ?? [];
  const nextSelection = { ...selection };

  if (current.includes(skillId)) {
    const filtered = current.filter((id) => id !== skillId);
    if (filtered.length === 0) {
      delete nextSelection[mediaId];
      return {
        selection: nextSelection,
        mediaOrder: mediaOrder.filter((id) => id !== mediaId),
      };
    }
    nextSelection[mediaId] = filtered;
    return { selection: nextSelection, mediaOrder };
  }

  nextSelection[mediaId] = [...current, skillId];
  const nextOrder = mediaOrder.includes(mediaId)
    ? mediaOrder
    : [...mediaOrder, mediaId];
  return { selection: nextSelection, mediaOrder: nextOrder };
}

export function countSelectedPlanBuilderActivities(
  mediaOrder: string[],
  selection: PlanBuilderActivitySkills
): number {
  return mediaOrder.filter((mediaId) => (selection[mediaId] ?? []).length > 0)
    .length;
}

export function countSelectedSkillsForMedia(
  selection: PlanBuilderActivitySkills,
  mediaId: string
): number {
  return selection[mediaId]?.length ?? 0;
}

export function buildPlanBuilderConfigureRows(
  views: PlanBuilderGoalView[],
  selection: PlanBuilderActivitySkills,
  mediaOrder: string[]
): PlanBuilderConfigureRow[] {
  const goalIdsByMedia = new Map<string, string[]>();
  const goalTitlesByMedia = new Map<string, string[]>();
  const metaByMedia = new Map<
    string,
    { mediaTitleAr: string; criterionId: string; criterionTitle: string }
  >();

  for (const view of views) {
    if (!view.hasCandidates) continue;
    for (const entry of listCandidateEntriesForGoal(view)) {
      if (!metaByMedia.has(entry.mediaId)) {
        metaByMedia.set(entry.mediaId, {
          mediaTitleAr: entry.mediaTitleAr,
          criterionId: entry.criterionId,
          criterionTitle: entry.criterionTitle,
        });
      }
      const goalIds = goalIdsByMedia.get(entry.mediaId) ?? [];
      if (!goalIds.includes(entry.goalId)) {
        goalIds.push(entry.goalId);
        goalIdsByMedia.set(entry.mediaId, goalIds);
        const titles = goalTitlesByMedia.get(entry.mediaId) ?? [];
        titles.push(entry.goalTitle);
        goalTitlesByMedia.set(entry.mediaId, titles);
      }
    }
  }

  const chapterCache = new Map<string, ReturnType<typeof loadChapterById>>();

  return mediaOrder
    .filter((mediaId) => (selection[mediaId] ?? []).length > 0)
    .map((mediaId) => {
      const skillIds = [...new Set(selection[mediaId] ?? [])];
      const meta = metaByMedia.get(mediaId);
      const chapterId = views.find((v) =>
        v.candidates.media.some((m) => m.mediaId === mediaId)
      )?.candidates.chapterId;

      let skillTitlesAr = skillIds.map((id) => id);
      if (chapterId) {
        if (!chapterCache.has(chapterId)) {
          chapterCache.set(chapterId, loadChapterById(chapterId));
        }
        const chapter = chapterCache.get(chapterId)!;
        skillTitlesAr = skillIds.map((id) => {
          const skill = chapter.skills.find((item) => item.skillId === id);
          return skill?.titleAr ?? id;
        });
      }

      return {
        mediaId,
        mediaTitleAr: meta?.mediaTitleAr ?? mediaId,
        skillIds,
        skillTitlesAr,
        relatedGoalIds: goalIdsByMedia.get(mediaId) ?? [],
        relatedGoalTitles: goalTitlesByMedia.get(mediaId) ?? [],
        criterionId: meta?.criterionId ?? '',
        criterionTitle: meta?.criterionTitle ?? '',
      };
    });
}

export function buildOrderedAssignments(
  orderedMediaIds: string[],
  difficulties: Record<string, TrainingDifficulty>,
  selectedActivitySkills: PlanBuilderActivitySkills = {}
): CreateTrainingPlanAssignmentInput[] {
  if (orderedMediaIds.length === 0) {
    throw new PlanBuilderError('يجب اختيار نشاط واحد على الأقل');
  }

  const unique = new Set(orderedMediaIds);
  if (unique.size !== orderedMediaIds.length) {
    throw new PlanBuilderError('لا يمكن تكرار نفس النشاط في الخطة');
  }

  return orderedMediaIds.map((mediaId, index) => {
    const skillIds = selectedActivitySkills[mediaId];
    const assignment: CreateTrainingPlanAssignmentInput = {
      mediaId,
      difficulty: assertValidPlanBuilderDifficulty(
        difficulties[mediaId] ?? 1
      ),
      order: index + 1,
    };
    const filtered =
      mediaId === OBSERVER_IMITATION_MEDIA_ID
        ? filterObserverImitationTargetSkillIds(skillIds)
        : skillIds?.length
          ? [...new Set(skillIds)]
          : undefined;
    if (filtered && filtered.length > 0) {
      assignment.skillIds = filtered;
    }
    return assignment;
  });
}

export function saveTrainingPlanFromBuilder(input: {
  childId: string;
  selectedGoalIds: string[];
  orderedMediaIds: string[];
  difficulties: Record<string, TrainingDifficulty>;
  selectedActivitySkills?: PlanBuilderActivitySkills;
}): TrainingPlan {
  const activeCheck = checkPlanBuilderActivePlan(input.childId);
  if (!activeCheck.allowed) {
    if (activeCheck.reason === 'active_plan_exists') {
      throw new PlanBuilderError(PLAN_BUILDER_ACTIVE_PLAN_MESSAGE);
    }
    throw new PlanBuilderError('خطط نشطة متعددة لنفس الطفل');
  }

  const views = resolvePlanBuilderGoalViews(
    input.childId,
    input.selectedGoalIds
  );
  const mediaOptions = buildMediaOptionsFromGoalViews(views);
  const goalIdsByMedia = new Map(
    mediaOptions.map((option) => [option.mediaId, option.relatedGoalIds])
  );

  const assignments = buildOrderedAssignments(
    input.orderedMediaIds,
    input.difficulties,
    input.selectedActivitySkills ?? {}
  ).map((assignment) => ({
    ...assignment,
    goalIds: goalIdsByMedia.get(assignment.mediaId) ?? [],
  }));

  const plan = createTrainingPlan({
    childId: input.childId,
    chapterId: resolveChapterIdForPlanMedia(input.orderedMediaIds),
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

  const chapter = loadChapterById(plan.chapterId);
  const media = chapter.media.find((item) => item.mediaId === first.mediaId);

  return {
    activityCount: sorted.length,
    firstActivityMediaId: first.mediaId,
    firstActivityTitleAr: media?.titleAr ?? null,
  };
}

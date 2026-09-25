/**
 * تفعيل خطة تدريب بعد تقييم مكتمل.
 * أنشطة ممارسة منزلية مُحضّرة من التقييم — ليست حكم إتقان معيار.
 */

import {
  ASSESSMENT_DRAFT_KEY,
  getLatestAssessmentForChild,
  type AssessmentDraft,
} from '@/lib/assessmentGate';
import {
  childResponseNeed,
  collectMergedAssessmentScores,
  isFourSourceGateOpen,
  screeningDomainNeeds,
} from '@/lib/childRoom/gate';
import {
  buildActiveTargetedGoals,
  GOAL_CHAIN_MAX,
  GOAL_CHAIN_MIN,
  type TrackedGoal,
} from '@/lib/goalsEngine';
import { publishFourSourceSnapshot } from '@/lib/airtableRealtimeClient';
import { loadGoalsLocal, saveGoalsLocal } from '@/lib/goalsStore';
import { createTrainingPlan } from '@/lib/training/createPlan';
import { filterObserverImitationTargetSkillIds } from '@/lib/training/c15SkillClassification';
import {
  ATTENTION_FOCUS_CHAPTER_ID,
  COMMUNICATION_LANGUAGE_CHAPTER_ID,
  listTrainingChapterIds,
  loadChapterById,
  MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
} from '@/lib/training/loadChapter';
import { OBSERVER_IMITATION_MEDIA_ID } from '@/lib/training/observerImitationEngine';
import {
  getActiveTrainingPlan,
  listTrainingPlans,
  MULTIPLE_ACTIVE_TRAINING_PLANS,
  saveTrainingPlan,
} from '@/lib/training/storage/planStore';
import { getTrainingCandidatesForTrackedGoal } from '@/lib/training/trainingCandidates';
import type { TrainingPlan } from '@/lib/training/types';

export const ASSESSMENT_TRAINING_PLAN_PREFIX = 'training_plan_assessment_';

const PARENT_ASSESSMENT_KEY = 'taaluf.parentAssessment.v1';
const MAX_PREPARED_ACTIVITIES = GOAL_CHAIN_MAX;

const CHAIN_CHAPTERS = [
  ATTENTION_FOCUS_CHAPTER_ID,
  COMMUNICATION_LANGUAGE_CHAPTER_ID,
  MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
] as const;

const STARTER_MEDIA = [
  'follow-star',
  'match-me',
  'where-did-it-go',
  'find-the-target',
  'wait-then-touch',
] as const;

type ScoreRow = { criterionId: string; score: number };

type ParentAssessmentRow = {
  childId?: string;
  mappedScores?: Array<{ criterionId?: string; score?: number }>;
  answers?: unknown[];
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parentAssessmentCompleted(childId: string): boolean {
  const rows = readJson<ParentAssessmentRow[]>(PARENT_ASSESSMENT_KEY, []);
  if (!Array.isArray(rows)) return false;
  return rows.some(
    (row) =>
      row?.childId === childId &&
      ((row.mappedScores?.length ?? 0) > 0 || (row.answers?.length ?? 0) > 0)
  );
}

function scoresFromDraft(childId: string): ScoreRow[] {
  const draft = readJson<AssessmentDraft | null>(ASSESSMENT_DRAFT_KEY, null);
  if (
    !draft ||
    draft.childId !== childId ||
    draft.status !== 'completed_pending_report' ||
    !draft.scores
  ) {
    return [];
  }
  return Object.entries(draft.scores).map(([criterionId, score]) => ({
    criterionId,
    score: Number(score),
  }));
}

export function hasCompletedAssessmentForTraining(childId: string): boolean {
  if (!childId) return false;
  if (getLatestAssessmentForChild(childId)) return true;
  if (parentAssessmentCompleted(childId)) return true;
  return scoresFromDraft(childId).length > 0;
}

function ensureGoals(childId: string): TrackedGoal[] {
  const existing = loadGoalsLocal(childId);
  if (existing.length >= GOAL_CHAIN_MIN) return existing.slice(0, GOAL_CHAIN_MAX);
  const created = buildActiveTargetedGoals({
    childId,
    parentScores: collectMergedAssessmentScores(childId),
    teacherScores: [],
    screeningDomains: screeningDomainNeeds(childId),
    childResponseNeed: childResponseNeed(childId),
  });
  const have = new Set(existing.map((goal) => goal.criterionId));
  const chain = [...existing, ...created.filter((goal) => !have.has(goal.criterionId))].slice(
    0,
    GOAL_CHAIN_MAX
  );
  if (chain.length === 0) return [];
  const others = loadGoalsLocal().filter((goal) => goal.childId !== childId);
  saveGoalsLocal([...chain, ...others]);
  return chain;
}

function pickChapterActivities(goals: TrackedGoal[]): {
  chapterId: string;
  mediaIds: string[];
  goalIds: string[];
  skillIdsByMedia: Record<string, string[]>;
} | null {
  const buckets = new Map<
    string,
    { media: Set<string>; goals: Set<string>; skills: Map<string, Set<string>> }
  >();

  for (const goal of goals) {
    let candidates;
    try {
      candidates = getTrainingCandidatesForTrackedGoal(goal);
    } catch {
      continue;
    }
    if (!candidates.chapterId || candidates.media.length === 0) continue;
    const bucket = buckets.get(candidates.chapterId) ?? {
      media: new Set<string>(),
      goals: new Set<string>(),
      skills: new Map<string, Set<string>>(),
    };
    const skillIds = new Set(candidates.skills.map((skill) => skill.skillId));
    for (const media of candidates.media) {
      bucket.media.add(media.mediaId);
      const linked = bucket.skills.get(media.mediaId) ?? new Set<string>();
      for (const skillId of media.skillIds) {
        if (skillIds.has(skillId)) linked.add(skillId);
      }
      bucket.skills.set(media.mediaId, linked);
    }
    bucket.goals.add(goal.id);
    buckets.set(candidates.chapterId, bucket);
  }

  let chosenId = '';
  let chosenCount = 0;
  for (const chapterId of listTrainingChapterIds()) {
    const count = buckets.get(chapterId)?.media.size ?? 0;
    if (count > chosenCount) {
      chosenId = chapterId;
      chosenCount = count;
    }
  }
  if (!chosenId) return null;

  const bucket = buckets.get(chosenId);
  if (!bucket) return null;
  const chapter = loadChapterById(chosenId);
  const matched = chapter.chapter.orderedMedia.filter((mediaId) => bucket.media.has(mediaId));
  const rest = chapter.chapter.orderedMedia.filter((mediaId) => !bucket.media.has(mediaId));
  const mediaIds = [...matched, ...rest].slice(0, MAX_PREPARED_ACTIVITIES);
  if (mediaIds.length === 0) return null;

  const skillIdsByMedia: Record<string, string[]> = {};
  for (const mediaId of mediaIds) {
    const raw = [...(bucket.skills.get(mediaId) ?? [])];
    const skillIds =
      mediaId === OBSERVER_IMITATION_MEDIA_ID
        ? filterObserverImitationTargetSkillIds(raw)
        : raw.length > 0
          ? raw
          : undefined;
    if (skillIds && skillIds.length > 0) {
      skillIdsByMedia[mediaId] = skillIds;
    }
  }

  return {
    chapterId: chosenId,
    mediaIds,
    goalIds: [...bucket.goals],
    skillIdsByMedia,
  };
}

function buildPreparedPlan(childId: string): TrainingPlan {
  const goals = ensureGoals(childId);
  const picked = pickChapterActivities(goals);
  const chapterId = picked?.chapterId ?? ATTENTION_FOCUS_CHAPTER_ID;
  const mediaIds = picked?.mediaIds ?? [...STARTER_MEDIA];
  const goalIds = picked?.goalIds ?? goals.map((goal) => goal.id);

  return createTrainingPlan({
    id: `${ASSESSMENT_TRAINING_PLAN_PREFIX}${childId}_${Date.now().toString(36)}`,
    childId,
    chapterId,
    goalIds,
    status: 'active',
    assignments: mediaIds.map((mediaId, index) => ({
      mediaId,
      difficulty: 1 as const,
      order: index + 1,
      goalIds,
      skillIds: picked?.skillIdsByMedia[mediaId],
    })),
  });
}

export function isAssessmentPreparedPlan(plan: { id: string } | null | undefined): boolean {
  return Boolean(plan?.id.startsWith(ASSESSMENT_TRAINING_PLAN_PREFIX));
}

/**
 * ينشئ خطة نشطة مرة واحدة بعد تقييم مكتمل إذا لم تكن هناك خطة نشطة أو مكتملة.
 * لا يستبدل خطة نشطة ولا يعيد فتح خطة أُنهيت.
 */
export function ensureActiveTrainingPlanFromAssessment(
  childId: string
): TrainingPlan | null {
  try {
    return computeActiveTrainingPlanFromAssessment(childId);
  } finally {
    if (childId) publishFourSourceSnapshot(childId);
  }
}

function computeActiveTrainingPlanFromAssessment(
  childId: string
): TrainingPlan | null {
  if (!childId) return null;

  try {
    const active = getActiveTrainingPlan(childId);
    if (active) return lengthenShortAssessmentPlan(active);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith(MULTIPLE_ACTIVE_TRAINING_PLANS)
    ) {
      return null;
    }
    throw error;
  }

  const existing = listTrainingPlans(childId);
  const resumable = existing.find(
    (plan) => plan.status === 'draft' || plan.status === 'paused'
  );
  if (resumable) {
    return saveTrainingPlan({ ...resumable, status: 'active' });
  }
  if (existing.some((plan) => plan.status === 'completed')) {
    return null;
  }
  if (!isFourSourceGateOpen(childId)) {
    return null;
  }

  return saveTrainingPlan(buildPreparedPlan(childId));
}

function lengthenShortAssessmentPlan(plan: TrainingPlan): TrainingPlan {
  if (!isAssessmentPreparedPlan(plan) || plan.status !== 'active') return plan;
  if (plan.assignments.length >= GOAL_CHAIN_MIN) return plan;
  const ordered = loadChapterById(plan.chapterId).chapter.orderedMedia;
  const have = new Set(plan.assignments.map((item) => item.mediaId));
  const extra = ordered.filter((mediaId) => !have.has(mediaId));
  if (extra.length === 0) return plan;
  const assignments = [...plan.assignments];
  let order = Math.max(...assignments.map((item) => item.order));
  for (const mediaId of extra) {
    if (assignments.length >= GOAL_CHAIN_MAX) break;
    order += 1;
    assignments.push({
      mediaId,
      difficulty: 1,
      order,
      goalIds: plan.goalIds,
    });
  }
  return saveTrainingPlan({ ...plan, assignments });
}

function nextUnusedChainSlice(childId: string): { chapterId: string; mediaIds: string[] } | null {
  const used = new Set(
    listTrainingPlans(childId).flatMap((plan) => plan.assignments.map((item) => item.mediaId))
  );
  for (const chapterId of CHAIN_CHAPTERS) {
    const mediaIds = loadChapterById(chapterId)
      .chapter.orderedMedia.filter((mediaId) => !used.has(mediaId))
      .slice(0, GOAL_CHAIN_MAX);
    if (mediaIds.length > 0) return { chapterId, mediaIds };
  }
  return null;
}

export function hasRemainingPreparedMedia(childId: string): boolean {
  return Boolean(childId && nextUnusedChainSlice(childId));
}

/** يفتح الشريحة التالية من السلسلة بعد جلسة يومية، دون كتابة هدف يدوي. */
export function continuePreparedGoalChain(childId: string): TrainingPlan | null {
  if (!childId) return null;
  try {
    const active = getActiveTrainingPlan(childId);
    if (active) return active;
  } catch {
    return null;
  }
  const slice = nextUnusedChainSlice(childId);
  if (!slice) return null;
  const goals = ensureGoals(childId);
  publishFourSourceSnapshot(childId);
  const goalIds = goals.map((goal) => goal.id);
  return saveTrainingPlan(
    createTrainingPlan({
      id: `${ASSESSMENT_TRAINING_PLAN_PREFIX}${childId}_${Date.now().toString(36)}`,
      childId,
      chapterId: slice.chapterId,
      goalIds,
      status: 'active',
      assignments: slice.mediaIds.map((mediaId, index) => ({
        mediaId,
        difficulty: 1 as const,
        order: index + 1,
        goalIds,
      })),
    })
  );
}

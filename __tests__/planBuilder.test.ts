import type { TrackedGoal } from '../lib/goalsEngine';
import * as goalsStore from '../lib/goalsStore';
import { createTrainingPlan } from '../lib/training/createPlan';
import {
  assertValidPlanBuilderDifficulty,
  buildMediaOptionsFromGoalViews,
  buildOrderedAssignments,
  checkPlanBuilderActivePlan,
  PlanBuilderError,
  resolvePlanBuilderGoalViews,
  saveTrainingPlanFromBuilder,
} from '../lib/training/planBuilder';
import { resolveTrainingPlanExecutionForPlan } from '../lib/training/planExecution';
import {
  getTrainingCandidatesForCriterion,
  getTrainingCandidatesForTrackedGoal,
} from '../lib/training/trainingCandidates';
import {
  clearAllTrainingStorage,
  getTrainingPlan,
  resetTrainingStorageAdapter,
  saveTrainingPlan,
  setTrainingStorageAdapter,
} from '../lib/training/storage';

const memory = new Map<string, string>();

function installMemoryStorage() {
  memory.clear();
  setTrainingStorageAdapter({
    isAvailable: () => true,
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
  });
}

function sampleGoal(
  childId: string,
  criterionId: string,
  overrides: Partial<TrackedGoal> = {}
): TrackedGoal {
  return {
    id: `tg_${childId}_${criterionId}_test`,
    childId,
    criterionId,
    domain: 'test',
    title: `هدف ${criterionId}`,
    smartText: 'هدف اختبار',
    baseline: 30,
    target: 70,
    current: 35,
    startDate: '2026-09-08T00:00:00.000Z',
    targetDate: '2026-10-08T00:00:00.000Z',
    status: 'active',
    sessions: [],
    ...overrides,
  };
}

beforeEach(() => {
  resetTrainingStorageAdapter();
  installMemoryStorage();
  clearAllTrainingStorage();
});

afterEach(() => {
  resetTrainingStorageAdapter();
  memory.clear();
  jest.restoreAllMocks();
});

describe('planBuilder candidate resolution', () => {
  it('C11 goal surfaces follow-star candidate', () => {
    const goal = sampleGoal('child_1', 'C11');
    const result = getTrainingCandidatesForTrackedGoal(goal);
    expect(result.media.map((item) => item.mediaId)).toEqual(['follow-star']);
  });

  it('C25 goal surfaces five candidates', () => {
    const goal = sampleGoal('child_1', 'C25');
    const result = getTrainingCandidatesForTrackedGoal(goal);
    expect(result.media).toHaveLength(5);
  });

  it('C26 goal is valid with zero candidates', () => {
    const goal = sampleGoal('child_1', 'C26');
    const result = getTrainingCandidatesForTrackedGoal(goal);
    expect(result.criterion.id).toBe('C26');
    expect(result.skills).toEqual([]);
    expect(result.media).toEqual([]);
  });

  it('C12 returns zero candidates without error', () => {
    const result = getTrainingCandidatesForCriterion('C12');
    expect(result.skills).toEqual([]);
    expect(result.media).toEqual([]);
  });
});

describe('planBuilder save rules', () => {
  const childId = 'child_builder';

  it('rejects empty activity selection', () => {
    expect(() => buildOrderedAssignments([], {})).toThrow(PlanBuilderError);
  });

  it('creates one assignment when one activity selected', () => {
    const assignments = buildOrderedAssignments(['follow-star'], {
      'follow-star': 2,
    });
    expect(assignments).toEqual([
      { mediaId: 'follow-star', difficulty: 2, order: 1 },
    ]);
  });

  it('creates deterministic unique order for multiple activities', () => {
    const assignments = buildOrderedAssignments(
      ['match-me', 'follow-star', 'wait-then-touch'],
      {
        'match-me': 1,
        'follow-star': 2,
        'wait-then-touch': 3,
      }
    );
    expect(assignments.map((item) => item.order)).toEqual([1, 2, 3]);
    expect(assignments.map((item) => item.mediaId)).toEqual([
      'match-me',
      'follow-star',
      'wait-then-touch',
    ]);
  });

  it('deduplicates media surfaced by multiple goals into one assignment', () => {
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([
      sampleGoal(childId, 'C25', { id: 'goal_a' }),
      sampleGoal(childId, 'C25', { id: 'goal_b', title: 'هدف B' }),
    ]);

    const views = resolvePlanBuilderGoalViews(childId, ['goal_a', 'goal_b']);
    const options = buildMediaOptionsFromGoalViews(views);
    expect(options.find((item) => item.mediaId === 'follow-star')?.relatedGoalIds)
      .toHaveLength(2);

    const plan = saveTrainingPlanFromBuilder({
      childId,
      selectedGoalIds: ['goal_a', 'goal_b'],
      orderedMediaIds: ['follow-star'],
      difficulties: { 'follow-star': 1 },
    });

    expect(plan.assignments[0].goalIds).toEqual(['goal_a', 'goal_b']);
    expect(plan.assignments).toHaveLength(1);
  });

  it('accepts only difficulty values 1 | 2 | 3', () => {
    expect(assertValidPlanBuilderDifficulty(2)).toBe(2);
    expect(() => assertValidPlanBuilderDifficulty(4)).toThrow(PlanBuilderError);
  });

  it('refuses save when an active plan already exists', () => {
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([
      sampleGoal(childId, 'C25', { id: 'goal_a' }),
    ]);

    saveTrainingPlan(
      createTrainingPlan({
        childId,
        chapterId: 'attention-focus',
        assignments: [{ mediaId: 'follow-star', difficulty: 1, order: 1 }],
        status: 'active',
      })
    );

    expect(checkPlanBuilderActivePlan(childId).allowed).toBe(false);
    expect(() =>
      saveTrainingPlanFromBuilder({
        childId,
        selectedGoalIds: ['goal_a'],
        orderedMediaIds: ['match-me'],
        difficulties: { 'match-me': 1 },
      })
    ).toThrow(PlanBuilderError);
  });

  it('saved plan is consumable by training launcher execution', () => {
    const c11Goal = sampleGoal(childId, 'C11');
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([c11Goal]);

    const plan = saveTrainingPlanFromBuilder({
      childId,
      selectedGoalIds: [c11Goal.id],
      orderedMediaIds: ['follow-star'],
      difficulties: { 'follow-star': 2 },
    });

    const stored = getTrainingPlan(plan.id);
    expect(stored?.assignments[0].difficulty).toBe(2);

    const execution = resolveTrainingPlanExecutionForPlan(plan);
    expect(execution.isComplete).toBe(false);
    expect(execution.media?.mediaId).toBe('follow-star');
    expect(execution.difficulty).toBe(2);
    expect(execution.activityRoute).toContain('follow-star');
  });
});

describe('resolvePlanBuilderGoalViews', () => {
  it('throws for goals not belonging to child context', () => {
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([
      sampleGoal('child_a', 'C11'),
    ]);

    expect(() =>
      resolvePlanBuilderGoalViews('child_a', ['tg_child_b_C11_test'])
    ).toThrow(PlanBuilderError);
  });
});

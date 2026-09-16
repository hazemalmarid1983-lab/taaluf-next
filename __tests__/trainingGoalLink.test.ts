import type { TrackedGoal } from '../lib/goalsEngine';
import * as goalsStore from '../lib/goalsStore';
import { loadGoalsLocal } from '../lib/goalsStore';
import { createTrainingPlan } from '../lib/training/createPlan';
import {
  applyTrainingSessionToTrackedGoals,
  trainingGoalCurrentIncrement,
} from '../lib/training/goalFeedback';
import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '../lib/training/loadChapter';
import { preparePlanActivityBegin } from '../lib/training/planActivitySafety';
import { setTrainingPlanLaunchContext } from '../lib/training/planLaunchContext';
import { saveTrainingPlanFromBuilder } from '../lib/training/planBuilder';
import {
  calculateSessionMetrics,
  createTrainingSession,
  endTrainingSession,
  recordTrial,
  requireTrainingMedia,
  startTrial,
} from '../lib/training/engine';
import { persistCompletedTrainingSession } from '../lib/training/sessionPersistence';
import * as trainingStorage from '../lib/training/storage';
import {
  clearAllTrainingStorage,
  resetTrainingStorageAdapter,
  saveTrainingPlan,
  setTrainingStorageAdapter,
} from '../lib/training/storage';

const memory = new Map<string, string>();
const GOALS_KEY = 'taaluf.goals.v1';
const browserLocal = new Map<string, string>();
const browserSession = new Map<string, string>();

function installBrowserStorage() {
  browserLocal.clear();
  browserSession.clear();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: globalThis,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => browserLocal.get(key) ?? null,
      setItem: (key: string, value: string) => browserLocal.set(key, value),
      removeItem: (key: string) => browserLocal.delete(key),
      clear: () => browserLocal.clear(),
    },
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => browserSession.get(key) ?? null,
      setItem: (key: string, value: string) => browserSession.set(key, value),
      removeItem: (key: string) => browserSession.delete(key),
      clear: () => browserSession.clear(),
    },
  });
}

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
    id: `goal_${criterionId}_${overrides.id || 'x'}`,
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

function seedGoals(goals: TrackedGoal[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

beforeEach(() => {
  resetTrainingStorageAdapter();
  installMemoryStorage();
  installBrowserStorage();
  clearAllTrainingStorage();
  jest.restoreAllMocks();
});

afterEach(() => {
  resetTrainingStorageAdapter();
  memory.clear();
});

describe('training goal link — plan assignments', () => {
  const childId = 'child_link';

  it('A: goalA + follow-star → assignment.goalIds=[goalA]', () => {
    const goalA = sampleGoal(childId, 'C11', { id: 'goal_a' });
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([goalA]);

    const plan = saveTrainingPlanFromBuilder({
      childId,
      selectedGoalIds: [goalA.id],
      orderedMediaIds: ['follow-star'],
      difficulties: { 'follow-star': 1 },
    });

    expect(plan.assignments[0].goalIds).toEqual([goalA.id]);
  });

  it('B: goalA + goalB + follow-star → shared assignment goalIds', () => {
    const goalA = sampleGoal(childId, 'C25', { id: 'goal_a' });
    const goalB = sampleGoal(childId, 'C25', { id: 'goal_b', title: 'هدف B' });
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([goalA, goalB]);

    const plan = saveTrainingPlanFromBuilder({
      childId,
      selectedGoalIds: [goalA.id, goalB.id],
      orderedMediaIds: ['follow-star'],
      difficulties: { 'follow-star': 1 },
    });

    expect(plan.assignments).toHaveLength(1);
    expect(plan.assignments[0].goalIds).toEqual([goalA.id, goalB.id]);
  });

  it('C: per-assignment goalIds scoped by candidate media overlap', () => {
    const goalA = sampleGoal(childId, 'C11', { id: 'goal_a' });
    const goalB = sampleGoal(childId, 'C25', { id: 'goal_b' });
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([goalA, goalB]);

    const plan = saveTrainingPlanFromBuilder({
      childId,
      selectedGoalIds: [goalA.id, goalB.id],
      orderedMediaIds: ['follow-star', 'match-me'],
      difficulties: { 'follow-star': 1, 'match-me': 1 },
    });

    const follow = plan.assignments.find((item) => item.mediaId === 'follow-star');
    const match = plan.assignments.find((item) => item.mediaId === 'match-me');

    expect(follow?.goalIds).toEqual([goalA.id, goalB.id]);
    expect(match?.goalIds).toEqual([goalB.id]);
  });
});

describe('training goal link — session begin', () => {
  const childId = 'child_begin';

  beforeEach(() => {
    localStorage.setItem(
      'taaluf.activeStudent',
      JSON.stringify({ id: childId, name: 'Test' })
    );
  });

  it('passes assignment goalIds through preparePlanActivityBegin', () => {
    const plan = saveTrainingPlan(
      createTrainingPlan({
        childId,
        chapterId: 'attention-focus',
        goalIds: ['goal_a'],
        assignments: [
          {
            mediaId: 'follow-star',
            difficulty: 1,
            order: 1,
            goalIds: ['goal_a'],
          },
        ],
        status: 'active',
      })
    );

    setTrainingPlanLaunchContext({
      planId: plan.id,
      chapterId: 'attention-focus',
      mediaId: 'follow-star',
      difficulty: 1,
      order: 1,
    });

    const begin = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
    expect(begin.ok).toBe(true);
    if (begin.ok) {
      expect(begin.goalIds).toEqual(['goal_a']);
    }
  });

  it('D: legacy plan without assignment.goalIds → empty goalIds, no crash', () => {
    const plan = saveTrainingPlan(
      createTrainingPlan({
        childId,
        chapterId: 'attention-focus',
        goalIds: ['goal_a'],
        assignments: [{ mediaId: 'follow-star', difficulty: 1, order: 1 }],
        status: 'active',
      })
    );

    setTrainingPlanLaunchContext({
      planId: plan.id,
      chapterId: 'attention-focus',
      mediaId: 'follow-star',
      difficulty: 1,
      order: 1,
    });

    const begin = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
    expect(begin.ok).toBe(true);
    if (begin.ok) {
      expect(begin.goalIds).toEqual([]);
    }

    const media = requireTrainingMedia(loadAttentionFocusChapter(), 'follow-star');
    const session = createTrainingSession({
      childId,
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
      planId: plan.id,
      goalIds: begin.ok ? begin.goalIds : [],
    });
    expect(session.goalIds).toBeUndefined();
  });

  it('C: assignment-scoped goalIds do not cross between distinct media', () => {
    const plan = saveTrainingPlan(
      createTrainingPlan({
        childId,
        chapterId: 'attention-focus',
        goalIds: ['goal_a', 'goal_b'],
        assignments: [
          {
            mediaId: 'follow-star',
            difficulty: 1,
            order: 1,
            goalIds: ['goal_a'],
          },
          {
            mediaId: 'match-me',
            difficulty: 1,
            order: 2,
            goalIds: ['goal_b'],
          },
        ],
        status: 'active',
      })
    );

    setTrainingPlanLaunchContext({
      planId: plan.id,
      chapterId: 'attention-focus',
      mediaId: 'follow-star',
      difficulty: 1,
      order: 1,
    });

    const followBegin = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
    expect(followBegin.ok).toBe(true);
    if (followBegin.ok) {
      expect(followBegin.goalIds).toEqual(['goal_a']);
    }

    setTrainingPlanLaunchContext({
      planId: plan.id,
      chapterId: 'attention-focus',
      mediaId: 'match-me',
      difficulty: 1,
      order: 2,
    });

    const matchBegin = preparePlanActivityBegin({ pageMediaId: 'match-me' });
    expect(matchBegin.ok).toBe(true);
    if (matchBegin.ok) {
      expect(matchBegin.goalIds).toEqual(['goal_b']);
    }
  });

  it('B: session carries both goalIds for shared assignment', () => {
    const plan = saveTrainingPlan(
      createTrainingPlan({
        childId,
        chapterId: 'attention-focus',
        goalIds: ['goal_a', 'goal_b'],
        assignments: [
          {
            mediaId: 'follow-star',
            difficulty: 1,
            order: 1,
            goalIds: ['goal_a', 'goal_b'],
          },
        ],
        status: 'active',
      })
    );

    setTrainingPlanLaunchContext({
      planId: plan.id,
      chapterId: 'attention-focus',
      mediaId: 'follow-star',
      difficulty: 1,
      order: 1,
    });

    const begin = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
    expect(begin.ok).toBe(true);
    if (!begin.ok) return;

    const media = requireTrainingMedia(loadAttentionFocusChapter(), 'follow-star');
    const session = createTrainingSession({
      childId,
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
      planId: plan.id,
      goalIds: begin.goalIds,
    });

    expect(session.goalIds).toEqual(['goal_a', 'goal_b']);
  });
});

describe('training goal link — tracked goal feedback', () => {
  const childId = 'child_feedback';
  const media = requireTrainingMedia(loadAttentionFocusChapter(), 'follow-star');

  function completedSession(goalIds: string[], sessionId = 'sess_feedback') {
    let session = createTrainingSession({
      id: sessionId,
      childId,
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
      goalIds,
    });
    session = startTrial(session);
    session = recordTrial(session, {
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 400,
    });
    return endTrainingSession(session);
  }

  it('E: completed session updates linked TrackedGoals with same session reference', () => {
    const goalA = sampleGoal(childId, 'C11', { id: 'goal_a', current: 40 });
    const goalB = sampleGoal(childId, 'C25', { id: 'goal_b', current: 42 });
    seedGoals([goalA, goalB]);

    const session = completedSession(['goal_a', 'goal_b'], 'sess_shared');
    const metrics = calculateSessionMetrics(session.trials);

    const updated = applyTrainingSessionToTrackedGoals(session, metrics);
    expect(updated).toHaveLength(2);

    const storedA = loadGoalsLocal(childId).find((g) => g.id === 'goal_a');
    const storedB = loadGoalsLocal(childId).find((g) => g.id === 'goal_b');

    expect(storedA?.current).toBe(40 + trainingGoalCurrentIncrement(100));
    expect(storedB?.current).toBe(42 + trainingGoalCurrentIncrement(100));
    expect(storedA?.sessions[0].notes).toContain('trainingSessionId=sess_shared');
    expect(storedB?.sessions[0].notes).toContain('trainingSessionId=sess_shared');
    expect(storedA?.sessions).toHaveLength(1);
    expect(storedB?.sessions).toHaveLength(1);
  });

  it('does not update goals when goalIds missing', () => {
    const goalA = sampleGoal(childId, 'C11', { id: 'goal_a', current: 40 });
    seedGoals([goalA]);

    const session = completedSession([], 'sess_no_goals');
    applyTrainingSessionToTrackedGoals(session, calculateSessionMetrics(session.trials));

    expect(loadGoalsLocal(childId)[0].current).toBe(40);
    expect(loadGoalsLocal(childId)[0].sessions).toHaveLength(0);
  });

  it('F: persistence failure does not update TrackedGoal', () => {
    const goalA = sampleGoal(childId, 'C11', { id: 'goal_a', current: 40 });
    seedGoals([goalA]);

    const session = completedSession(['goal_a'], 'sess_fail');
    jest.spyOn(trainingStorage, 'saveTrainingSession').mockImplementation(() => {
      throw new Error('save failed');
    });

    expect(() => persistCompletedTrainingSession(session)).toThrow('save failed');
    expect(loadGoalsLocal(childId)[0].current).toBe(40);
    expect(loadGoalsLocal(childId)[0].sessions).toHaveLength(0);
  });

  it('persistCompletedTrainingSession updates goal after successful save', () => {
    const goalA = sampleGoal(childId, 'C11', { id: 'goal_a', current: 40 });
    seedGoals([goalA]);

    const session = completedSession(['goal_a'], 'sess_ok');
    persistCompletedTrainingSession(session);

    expect(loadGoalsLocal(childId)[0].current).toBe(
      40 + trainingGoalCurrentIncrement(100)
    );
    expect(loadGoalsLocal(childId)[0].sessions).toHaveLength(1);
  });
});

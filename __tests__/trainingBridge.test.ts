import type { TrackedGoal } from '../lib/goalsEngine';
import { createTrainingPlan } from '../lib/training/createPlan';
import { ATTENTION_FOCUS_CHAPTER_ID } from '../lib/training/loadChapter';
import {
  clearAllTrainingStorage,
  resetTrainingStorageAdapter,
  saveTrainingPlan,
  setTrainingStorageAdapter,
} from '../lib/training/storage';
import {
  buildTrainingPlanLaunchContextFromExecution,
  hasExecutableTrainingCandidate,
  resolveNoPlanTrainingHref,
  resolveTrainingBridgeState,
} from '../lib/training/trainingBridge';
import { resolveTrainingEntryState } from '../lib/training/planExecution';

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

function attentionGoal(childId: string): TrackedGoal {
  return {
    id: `tg_${childId}_C11_bridge`,
    childId,
    criterionId: 'C11',
    domain: 'cognitive',
    title: 'الانتباه المشترك',
    smartText: 'أن يتابع الطفل هدفاً بصرياً',
    baseline: 30,
    target: 70,
    current: 35,
    startDate: '2026-09-08T00:00:00.000Z',
    targetDate: '2026-10-08T00:00:00.000Z',
    status: 'active',
    sessions: [],
  };
}

function requestGoal(childId: string): TrackedGoal {
  return {
    ...attentionGoal(childId),
    id: `tg_${childId}_C1_bridge`,
    criterionId: 'C1',
    domain: 'communication',
    title: 'الطلب الوظيفي',
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
});

describe('trainingBridge.resolveTrainingBridgeState', () => {
  const childId = 'child_bridge_test';

  it('loaded criterion + matching assignment → ready', () => {
    const plan = saveTrainingPlan(
      createTrainingPlan({
        childId,
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        assignments: [{ mediaId: 'follow-star', difficulty: 1, order: 1 }],
        status: 'active',
      })
    );

    const state = resolveTrainingBridgeState(childId, attentionGoal(childId));
    expect(state.status).toBe('ready');
    if (state.status === 'ready') {
      expect(state.activityRoute).toContain('follow-star');
      expect(state.launch.planId).toBe(plan.id);
      expect(state.launch.mediaId).toBe('follow-star');
    }
  });

  it('candidate exists but the next activity is a different skill → mismatch', () => {
    saveTrainingPlan(
      createTrainingPlan({
        childId,
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        assignments: [{ mediaId: 'follow-star', difficulty: 1, order: 1 }],
        status: 'active',
      })
    );

    expect(resolveTrainingBridgeState(childId, requestGoal(childId)).status).toBe(
      'mismatch'
    );
  });

  it('criterion with a loaded candidate and no plan → no_plan', () => {
    expect(resolveTrainingBridgeState(childId, attentionGoal(childId)).status).toBe(
      'no_plan'
    );
  });

  it('completed plan only → complete', () => {
    saveTrainingPlan(
      createTrainingPlan({
        childId,
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        assignments: [{ mediaId: 'follow-star', difficulty: 1, order: 1 }],
        status: 'completed',
      })
    );

    expect(resolveTrainingBridgeState(childId, attentionGoal(childId)).status).toBe(
      'complete'
    );
  });

  it('criterion without a loaded candidate → unavailable', () => {
    const goal = attentionGoal(childId);
    goal.criterionId = 'C12';
    expect(resolveTrainingBridgeState(childId, goal).status).toBe('unavailable');
    expect(hasExecutableTrainingCandidate(goal)).toBe(false);
  });

  it('goal without valid criterionId → unavailable', () => {
    const goal = attentionGoal(childId);
    goal.criterionId = '';
    expect(resolveTrainingBridgeState(childId, goal).status).toBe('unavailable');
  });
});

describe('trainingBridge helpers', () => {
  it('buildTrainingPlanLaunchContextFromExecution matches entry execution', () => {
    const childId = 'child_launch_ctx';
    saveTrainingPlan(
      createTrainingPlan({
        childId,
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        assignments: [{ mediaId: 'follow-star', difficulty: 2, order: 1 }],
        status: 'active',
      })
    );

    const entry = resolveTrainingEntryState(childId);
    expect(entry.kind).toBe('ready');
    if (entry.kind !== 'ready') return;

    const launch = buildTrainingPlanLaunchContextFromExecution(entry.execution);
    expect(launch?.mediaId).toBe('follow-star');
    expect(launch?.difficulty).toBe(2);
    expect(launch).not.toHaveProperty('skillIds');
  });

  it('resolveNoPlanTrainingHref respects parent vs specialist', () => {
    expect(resolveNoPlanTrainingHref(true)).toBe('/dashboard/training');
    expect(resolveNoPlanTrainingHref(false)).toBe(
      '/dashboard/training/plans/new'
    );
  });

  it('C11 has an executable candidate and C12 does not', () => {
    expect(hasExecutableTrainingCandidate(attentionGoal('c11'))).toBe(true);
    const unloaded = attentionGoal('c12');
    unloaded.criterionId = 'C12';
    expect(hasExecutableTrainingCandidate(unloaded)).toBe(false);
  });
});

import {
  createTrainingPlan,
  createAttentionFocusTestPlan,
} from '../lib/training/createPlan';
import {
  advanceTrainingPlan,
  persistSessionAndAdvancePlan,
  resolveTrainingEntryState,
  resolveTrainingPlanExecution,
  resolveTrainingPlanExecutionForPlan,
  TrainingPlanExecutionError,
} from '../lib/training/planExecution';
import {
  createTrainingSession,
  requireTrainingMedia,
  runTrainingTrialLoop,
} from '../lib/training/engine';
import { loadAttentionFocusChapter } from '../lib/training/loadChapter';
import {
  clearAllTrainingStorage,
  getActiveTrainingPlan,
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

beforeEach(() => {
  resetTrainingStorageAdapter();
  installMemoryStorage();
  clearAllTrainingStorage();
});

afterEach(() => {
  resetTrainingStorageAdapter();
  memory.clear();
});

describe('resolveTrainingPlanExecution', () => {
  it('returns empty result when no active plan', () => {
    const result = resolveTrainingPlanExecution('child_1');
    expect(result.plan).toBeNull();
    expect(result.isComplete).toBe(false);
  });

  it('resolves active plan and next assignment', () => {
    const plan = createTrainingPlan({
      childId: 'child_1',
      chapterId: 'attention-focus',
      assignments: [
        { mediaId: 'follow-star', difficulty: 2, order: 1 },
        { mediaId: 'match-me', difficulty: 1, order: 2 },
      ],
    });
    saveTrainingPlan(plan);

    const result = resolveTrainingPlanExecution('child_1');
    expect(result.plan?.id).toBe(plan.id);
    expect(result.assignment?.mediaId).toBe('follow-star');
    expect(result.difficulty).toBe(2);
    expect(result.media?.titleAr).toBeTruthy();
    expect(result.activityRoute).toContain('follow-star');
    expect(result.isComplete).toBe(false);
  });

  it('marks plan complete when status is completed', () => {
    const plan = createTrainingPlan({
      childId: 'child_1',
      chapterId: 'attention-focus',
      status: 'completed',
      assignments: [{ mediaId: 'follow-star', order: 1 }],
    });

    const result = resolveTrainingPlanExecutionForPlan(plan);
    expect(result.isComplete).toBe(true);
  });

  it('throws for missing media in chapter', () => {
    const plan = createTrainingPlan({
      childId: 'child_1',
      chapterId: 'attention-focus',
      assignments: [{ mediaId: 'unknown-media', order: 1 }],
    });
    saveTrainingPlan(plan);

    expect(() => resolveTrainingPlanExecution('child_1')).toThrow(
      TrainingPlanExecutionError
    );
  });

  it('throws when multiple active plans exist', () => {
    saveTrainingPlan(
      createTrainingPlan({
        id: 'plan_a',
        childId: 'child_1',
        chapterId: 'attention-focus',
        assignments: [{ mediaId: 'follow-star', order: 1 }],
      })
    );
    saveTrainingPlan(
      createTrainingPlan({
        id: 'plan_b',
        childId: 'child_1',
        chapterId: 'attention-focus',
        assignments: [{ mediaId: 'match-me', order: 1 }],
      })
    );

    expect(() => resolveTrainingPlanExecution('child_1')).toThrow(
      TrainingPlanExecutionError
    );
    expect(() => getActiveTrainingPlan('child_1')).toThrow();
  });
});

describe('advanceTrainingPlan', () => {
  it('moves cursor from first to second assignment', () => {
    const plan = createTrainingPlan({
      childId: 'child_1',
      chapterId: 'attention-focus',
      assignments: [
        { mediaId: 'follow-star', order: 1 },
        { mediaId: 'match-me', order: 2 },
      ],
    });
    saveTrainingPlan(plan);

    const advanced = advanceTrainingPlan(plan.id);
    expect(advanced.cursor.nextOrder).toBe(2);
    expect(advanced.status).toBe('active');
  });

  it('completes plan after last assignment', () => {
    const plan = createTrainingPlan({
      childId: 'child_1',
      chapterId: 'attention-focus',
      assignments: [{ mediaId: 'follow-star', order: 1 }],
    });
    saveTrainingPlan(plan);

    const advanced = advanceTrainingPlan(plan.id);
    expect(advanced.status).toBe('completed');
    expect(advanced.cursor.nextOrder).toBe(2);
  });

  it('rejects advancing a completed plan', () => {
    const plan = createTrainingPlan({
      childId: 'child_1',
      chapterId: 'attention-focus',
      status: 'completed',
      assignments: [{ mediaId: 'follow-star', order: 1 }],
    });
    saveTrainingPlan(plan);

    expect(() => advanceTrainingPlan(plan.id)).toThrow(TrainingPlanExecutionError);
  });

  it('rejects advancing when completed media does not match current assignment', () => {
    const plan = createTrainingPlan({
      childId: 'child_1',
      chapterId: 'attention-focus',
      assignments: [{ mediaId: 'follow-star', order: 1 }],
    });
    saveTrainingPlan(plan);

    expect(() =>
      advanceTrainingPlan(plan.id, { completedMediaId: 'match-me' })
    ).toThrow(TrainingPlanExecutionError);
  });

  it('advances only once per session completion via persistSessionAndAdvancePlan', () => {
    const plan = createTrainingPlan({
      childId: 'child_1',
      chapterId: 'attention-focus',
      assignments: [
        { mediaId: 'follow-star', order: 1 },
        { mediaId: 'match-me', order: 2 },
      ],
    });
    saveTrainingPlan(plan);

    const doc = loadAttentionFocusChapter();
    const media = requireTrainingMedia(doc, 'follow-star');
    const session = runTrainingTrialLoop(
      createTrainingSession({
        childId: 'child_1',
        chapterId: 'attention-focus',
        media,
        planId: plan.id,
      }),
      [{ correct: true, promptLevel: 'independent', responseTimeMs: 400 }]
    );

    persistSessionAndAdvancePlan(session);
    expect(getTrainingPlan(plan.id)?.cursor.nextOrder).toBe(2);

    expect(() =>
      advanceTrainingPlan(plan.id, { completedMediaId: 'follow-star' })
    ).toThrow(TrainingPlanExecutionError);
  });
});

describe('resolveTrainingEntryState', () => {
  it('returns no_plan when none exists', () => {
    expect(resolveTrainingEntryState('child_1')).toEqual({ kind: 'no_plan' });
  });

  it('returns ready with next activity', () => {
    saveTrainingPlan(createAttentionFocusTestPlan('child_1'));
    const state = resolveTrainingEntryState('child_1');
    expect(state.kind).toBe('ready');
    if (state.kind === 'ready') {
      expect(state.execution.media?.mediaId).toBe('follow-star');
      expect(state.execution.activityRoute).toContain('follow-star');
    }
  });

  it('returns complete when plan is finished', () => {
    const plan = createTrainingPlan({
      childId: 'child_1',
      chapterId: 'attention-focus',
      status: 'completed',
      assignments: [{ mediaId: 'follow-star', order: 1 }],
    });
    saveTrainingPlan(plan);

    const state = resolveTrainingEntryState('child_1');
    expect(state.kind).toBe('complete');
  });
});

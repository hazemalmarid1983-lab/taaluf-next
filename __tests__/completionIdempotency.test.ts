import type { TrackedGoal } from '@/lib/goalsEngine';
import * as goalsStore from '@/lib/goalsStore';
import {
  trainingGoalCurrentIncrement,
} from '@/lib/training/goalFeedback';
import {
  createTrainingSession,
  recordTrial,
  requireTrainingMedia,
  runTrainingTrialLoop,
  startTrial,
} from '@/lib/training/engine';
import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '@/lib/training/loadChapter';
import { persistSessionAndAdvancePlan } from '@/lib/training/planExecution';
import { createTrainingPlan } from '@/lib/training/createPlan';
import {
  persistCompletedTrainingSession,
} from '@/lib/training/sessionPersistence';
import {
  clearAllTrainingStorage,
  getCompletionApplyRecord,
  getTrainingPlan,
  getTrainingProgress,
  listTrainingSessions,
  markCompletionGoalsApplied,
  markCompletionProgressApplied,
  resetTrainingStorageAdapter,
  saveTrainingPlan,
  saveTrainingProgress,
  saveTrainingSession,
  setTrainingStorageAdapter,
} from '@/lib/training/storage';

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

function completedFollowStarSession(id: string, childId: string, planId?: string) {
  const media = requireTrainingMedia(
    loadAttentionFocusChapter(),
    'follow-star'
  );
  return runTrainingTrialLoop(
    createTrainingSession({
      id,
      childId,
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
      planId,
      goalIds: planId ? ['goal_a'] : undefined,
    }),
    [{ correct: true, promptLevel: 'independent', responseTimeMs: 400 }]
  );
}

beforeEach(() => {
  resetTrainingStorageAdapter();
  installMemoryStorage();
  clearAllTrainingStorage();
  jest.restoreAllMocks();
});

afterEach(() => {
  resetTrainingStorageAdapter();
  memory.clear();
});

describe('PR-01 — completion idempotency', () => {
  it('same session persisted twice → one completed session row', () => {
    const session = completedFollowStarSession('sess_dup_1', 'child_1');
    persistCompletedTrainingSession(session);
    persistCompletedTrainingSession(session);
    expect(
      listTrainingSessions('child_1').filter((s) => s.id === 'sess_dup_1')
    ).toHaveLength(1);
  });

  it('same session persisted twice → progress +1 only', () => {
    const session = completedFollowStarSession('sess_dup_2', 'child_1');
    persistCompletedTrainingSession(session);
    const second = persistCompletedTrainingSession(session);
    expect(second.applied).toBe(false);
    expect(
      getTrainingProgress('child_1', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star')
        ?.completedSessions
    ).toBe(1);
  });

  it('same session persisted twice → goal feedback once', () => {
    let stored: TrackedGoal = {
      id: 'goal_a',
      childId: 'child_1',
      title: 'هدف',
      current: 10,
      target: 100,
      sessions: [],
      lastUpdate: new Date().toISOString(),
    };
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockImplementation(() => [stored]);
    jest.spyOn(goalsStore, 'upsertGoalLocal').mockImplementation((g) => {
      stored = g;
      return g;
    });

    const session = completedFollowStarSession('sess_goal', 'child_1', 'plan_x');
    session.goalIds = ['goal_a'];
    const metricsIndependence = 100;
    persistCompletedTrainingSession(session);
    persistCompletedTrainingSession(session);
    expect(stored.current).toBe(
      10 + trainingGoalCurrentIncrement(metricsIndependence)
    );
    expect(stored.sessions).toHaveLength(1);
  });

  it('same session via persistSessionAndAdvancePlan twice → plan cursor advances once', () => {
    const plan = saveTrainingPlan(
      createTrainingPlan({
        childId: 'child_1',
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        assignments: [
          { mediaId: 'follow-star', order: 1 },
          { mediaId: 'match-me', order: 2 },
        ],
      })
    );
    const session = completedFollowStarSession('sess_plan', 'child_1', plan.id);
    persistSessionAndAdvancePlan(session);
    persistSessionAndAdvancePlan(session);
    expect(getTrainingPlan(plan.id)?.cursor.nextOrder).toBe(2);
  });

  it('standalone completed session → progress once', () => {
    const session = completedFollowStarSession('sess_stand', 'child_1');
    persistCompletedTrainingSession(session);
    expect(
      getTrainingProgress('child_1', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star')
        ?.completedSessions
    ).toBe(1);
  });

  it('plan-linked completed session → progress + cursor once', () => {
    const plan = saveTrainingPlan(
      createTrainingPlan({
        childId: 'child_1',
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        assignments: [{ mediaId: 'follow-star', order: 1 }],
      })
    );
    const session = completedFollowStarSession('sess_pl_1', 'child_1', plan.id);
    persistSessionAndAdvancePlan(session);
    expect(
      getTrainingProgress('child_1', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star')
        ?.completedSessions
    ).toBe(1);
    expect(getTrainingPlan(plan.id)?.status).toBe('completed');
  });

  it('second completion after first success returns applied: false', () => {
    const session = completedFollowStarSession('sess_applied', 'child_1');
    expect(persistCompletedTrainingSession(session).applied).toBe(true);
    expect(persistCompletedTrainingSession(session).applied).toBe(false);
  });

  it('ACTIVE session cannot use completed persistence', () => {
    const media = requireTrainingMedia(
      loadAttentionFocusChapter(),
      'follow-star'
    );
    let active = createTrainingSession({
      id: 'sess_active',
      childId: 'child_1',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    });
    active = startTrial(active);
    active = recordTrial(active, {
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 300,
    });
    expect(active.status).toBe('active');
    expect(() => persistCompletedTrainingSession(active)).toThrow(
      'لا يمكن حفظ جلسة غير مكتملة'
    );
  });

  it('legacy completed session in store without ledger → duplicate persist is idempotent', () => {
    const session = completedFollowStarSession('sess_legacy', 'child_1');
    saveTrainingSession(session);
    saveTrainingProgress({
      childId: session.childId,
      chapterId: session.chapterId,
      mediaId: session.mediaId,
      completedSessions: 1,
      lastDifficulty: session.difficulty,
      independenceRate: 100,
      masteryLevel: 'emerging',
    });
    persistCompletedTrainingSession(session);
    expect(
      getTrainingProgress('child_1', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star')
        ?.completedSessions
    ).toBe(1);
  });

  it('two different completed sessions each count once', () => {
    persistCompletedTrainingSession(
      completedFollowStarSession('sess_a', 'child_1')
    );
    persistCompletedTrainingSession(
      completedFollowStarSession('sess_b', 'child_1')
    );
    expect(
      getTrainingProgress('child_1', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star')
        ?.completedSessions
    ).toBe(2);
  });

  it('two different sessions for same goal → goal increments twice', () => {
    let stored: TrackedGoal = {
      id: 'goal_a',
      childId: 'child_1',
      title: 'هدف',
      current: 10,
      target: 100,
      sessions: [],
      lastUpdate: new Date().toISOString(),
    };
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockImplementation(() => [stored]);
    jest.spyOn(goalsStore, 'upsertGoalLocal').mockImplementation((g) => {
      stored = g;
      return g;
    });

    const s1 = completedFollowStarSession('sess_g1', 'child_1');
    const s2 = completedFollowStarSession('sess_g2', 'child_1');
    s1.goalIds = ['goal_a'];
    s2.goalIds = ['goal_a'];
    persistCompletedTrainingSession(s1);
    persistCompletedTrainingSession(s2);
    expect(stored.sessions).toHaveLength(2);
    expect(stored.current).toBe(
      10 +
        trainingGoalCurrentIncrement(100) +
        trainingGoalCurrentIncrement(100)
    );
  });

  it('legacy store with session+progress already saved → replay does not double progress', () => {
    const session = completedFollowStarSession('sess_partial', 'child_1');
    saveTrainingSession(session);
    saveTrainingProgress({
      childId: session.childId,
      chapterId: session.chapterId,
      mediaId: session.mediaId,
      completedSessions: 1,
      lastDifficulty: session.difficulty,
      independenceRate: 100,
      masteryLevel: 'emerging',
    });
    expect(getCompletionApplyRecord('sess_partial')).toBeNull();

    persistCompletedTrainingSession(session);
    expect(
      getTrainingProgress('child_1', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star')
        ?.completedSessions
    ).toBe(1);
  });

  it('plan advance ledger set after successful persistSessionAndAdvancePlan', () => {
    const plan = saveTrainingPlan(
      createTrainingPlan({
        childId: 'child_1',
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        assignments: [
          { mediaId: 'follow-star', order: 1 },
          { mediaId: 'match-me', order: 2 },
        ],
      })
    );
    const session = completedFollowStarSession('sess_adv', 'child_1', plan.id);
    persistSessionAndAdvancePlan(session);
    expect(getCompletionApplyRecord('sess_adv')?.planAdvanceApplied).toBe(true);
  });

  it('partial plan advance retry: progress not doubled, advance completes once', () => {
    const plan = saveTrainingPlan(
      createTrainingPlan({
        childId: 'child_1',
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        assignments: [
          { mediaId: 'follow-star', order: 1 },
          { mediaId: 'match-me', order: 2 },
        ],
      })
    );
    const session = completedFollowStarSession('sess_retry', 'child_1', plan.id);
    saveTrainingSession(session);
    saveTrainingProgress({
      childId: session.childId,
      chapterId: session.chapterId,
      mediaId: session.mediaId,
      completedSessions: 1,
      lastDifficulty: session.difficulty,
    });
    markCompletionProgressApplied('sess_retry');
    markCompletionGoalsApplied('sess_retry');

    persistSessionAndAdvancePlan(session);
    expect(
      getTrainingProgress('child_1', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star')
        ?.completedSessions
    ).toBe(1);
    expect(getTrainingPlan(plan.id)?.cursor.nextOrder).toBe(2);
    persistSessionAndAdvancePlan(session);
    expect(getTrainingPlan(plan.id)?.cursor.nextOrder).toBe(2);
  });
});

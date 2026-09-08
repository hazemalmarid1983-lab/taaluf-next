import {
  exitPlanActivityFlow,
  peekPlanActivityRecovery,
  preparePlanActivityBegin,
  resolveTrainingActivityCompletionHref,
  savePlanActivityRecovery,
} from '@/lib/training/planActivitySafety';
import {
  peekTrainingPlanLaunchContext,
  setTrainingPlanLaunchContext,
} from '@/lib/training/planLaunchContext';
import { persistSessionAndAdvancePlan } from '@/lib/training/planExecution';
import { createTrainingPlan } from '@/lib/training/createPlan';
import {
  createTrainingSession,
  requireTrainingMedia,
  runTrainingTrialLoop,
} from '@/lib/training/engine';
import { loadAttentionFocusChapter } from '@/lib/training/loadChapter';
import {
  clearAllTrainingStorage,
  getTrainingPlan,
  resetTrainingStorageAdapter,
  saveTrainingPlan,
  setTrainingStorageAdapter,
} from '@/lib/training/storage';
import {
  readActiveTrainingChildId,
  readTrainingChildId,
} from '@/lib/training/sessionPersistence';

const LAUNCH_KEY = 'taaluf.training.launch.v1';
const ACTIVE_STUDENT_KEY = 'taaluf.activeStudent';

function installBrowserMocks() {
  const localStore: Record<string, string> = {};
  const sessionStore: Record<string, string> = {};

  // @ts-expect-error test env mock
  global.window = global;

  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: (key: string) => localStore[key] ?? null,
      setItem: (key: string, value: string) => {
        localStore[key] = value;
      },
      removeItem: (key: string) => {
        delete localStore[key];
      },
      clear: () => {
        Object.keys(localStore).forEach((key) => delete localStore[key]);
      },
    },
    writable: true,
  });

  Object.defineProperty(global, 'sessionStorage', {
    value: {
      getItem: (key: string) => sessionStore[key] ?? null,
      setItem: (key: string, value: string) => {
        sessionStore[key] = value;
      },
      removeItem: (key: string) => {
        delete sessionStore[key];
      },
      clear: () => {
        Object.keys(sessionStore).forEach((key) => delete sessionStore[key]);
      },
    },
    writable: true,
  });

  return { localStore, sessionStore };
}

function setActiveStudent(id: string) {
  localStorage.setItem(ACTIVE_STUDENT_KEY, JSON.stringify({ id }));
}

function setLaunchContext(mediaId: string) {
  setTrainingPlanLaunchContext({
    planId: 'plan_1',
    chapterId: 'attention-focus',
    mediaId,
    difficulty: 2,
    order: 1,
  });
}

const memory = new Map<string, string>();

function installTrainingStorage() {
  memory.clear();
  setTrainingStorageAdapter({
    isAvailable: () => true,
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
  });
  clearAllTrainingStorage();
}

describe('planActivitySafety', () => {
  beforeEach(() => {
    resetTrainingStorageAdapter();
    installBrowserMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    resetTrainingStorageAdapter();
    memory.clear();
  });

  describe('readActiveTrainingChildId', () => {
    it('returns null when activeStudent is missing', () => {
      expect(readActiveTrainingChildId()).toBeNull();
    });

    it('returns child id when activeStudent is set', () => {
      setActiveStudent('child_real');
      expect(readActiveTrainingChildId()).toBe('child_real');
    });

    it('readTrainingChildId still falls back to child_local for standalone', () => {
      expect(readTrainingChildId()).toBe('child_local');
    });
  });

  describe('resolveTrainingActivityCompletionHref', () => {
    it('returns training entry for plan-linked sessions', () => {
      expect(resolveTrainingActivityCompletionHref('plan_1')).toBe('/dashboard/training');
    });

    it('returns games hub for standalone sessions', () => {
      expect(resolveTrainingActivityCompletionHref()).toBe('/dashboard/games');
      expect(resolveTrainingActivityCompletionHref(undefined)).toBe('/dashboard/games');
    });
  });

  describe('preparePlanActivityBegin', () => {
    it('starts standalone session with child_local when no plan context exists', () => {
      const result = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
      expect(result).toEqual({ ok: true, childId: 'child_local' });
    });

    it('starts plan-linked session when launch mediaId matches page media', () => {
      setActiveStudent('child_1');
      setLaunchContext('follow-star');

      const result = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
      expect(result).toEqual({
        ok: true,
        childId: 'child_1',
        planId: 'plan_1',
        sessionDifficulty: 2,
      });
      expect(peekTrainingPlanLaunchContext()).toBeNull();
      expect(peekPlanActivityRecovery()?.planId).toBe('plan_1');
    });

    it('rejects wrong launch mediaId and clears stale launch', () => {
      setActiveStudent('child_1');
      setLaunchContext('match-me');

      const result = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
      expect(result).toEqual({ ok: false, reason: 'invalid_launch' });
      expect(sessionStorage.getItem(LAUNCH_KEY)).toBeNull();
    });

    it('blocks plan-linked launch when activeStudent is missing', () => {
      setLaunchContext('follow-star');

      const result = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
      expect(result).toEqual({ ok: false, reason: 'missing_child' });
      expect(sessionStorage.getItem(LAUNCH_KEY)).toBeNull();
    });

    it('reconstructs plan linkage from recovery after refresh', () => {
      setActiveStudent('child_1');
      savePlanActivityRecovery({
        planId: 'plan_1',
        chapterId: 'attention-focus',
        mediaId: 'follow-star',
        difficulty: 3,
        order: 1,
        childId: 'child_1',
      });

      const result = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
      expect(result).toEqual({
        ok: true,
        childId: 'child_1',
        planId: 'plan_1',
        sessionDifficulty: 3,
      });
      expect(peekPlanActivityRecovery()?.planId).toBe('plan_1');
    });

    it('clears recovery when active child does not match recovered child', () => {
      setActiveStudent('child_b');
      savePlanActivityRecovery({
        planId: 'plan_1',
        chapterId: 'attention-focus',
        mediaId: 'follow-star',
        difficulty: 2,
        order: 1,
        childId: 'child_a',
      });

      const result = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
      expect(result).toEqual({ ok: false, reason: 'missing_child' });
      expect(peekPlanActivityRecovery()).toBeNull();
    });

    it('preserves plan linkage across launch consume then refresh restart', () => {
      setActiveStudent('child_1');
      setLaunchContext('follow-star');

      const first = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
      expect(first).toMatchObject({ ok: true, planId: 'plan_1' });

      const afterRefresh = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
      expect(afterRefresh).toEqual({
        ok: true,
        childId: 'child_1',
        planId: 'plan_1',
        sessionDifficulty: 2,
      });
    });

    it('ignores recovery for a different activity page', () => {
      savePlanActivityRecovery({
        planId: 'plan_1',
        chapterId: 'attention-focus',
        mediaId: 'match-me',
        difficulty: 2,
        order: 2,
        childId: 'child_1',
      });

      const result = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
      expect(result).toEqual({ ok: true, childId: 'child_local' });
    });
  });

  describe('exitPlanActivityFlow', () => {
    it('clears launch and recovery contexts', () => {
      setLaunchContext('follow-star');
      savePlanActivityRecovery({
        planId: 'plan_1',
        chapterId: 'attention-focus',
        mediaId: 'follow-star',
        difficulty: 2,
        order: 1,
        childId: 'child_1',
      });

      exitPlanActivityFlow();

      expect(peekTrainingPlanLaunchContext()).toBeNull();
      expect(peekPlanActivityRecovery()).toBeNull();
    });
  });

  describe('persistSessionAndAdvancePlan recovery cleanup', () => {
    beforeEach(() => {
      installTrainingStorage();
    });

    it('clears recovery after successful plan-linked completion', () => {
      setActiveStudent('child_1');
      savePlanActivityRecovery({
        planId: 'plan_1',
        chapterId: 'attention-focus',
        mediaId: 'follow-star',
        difficulty: 2,
        order: 1,
        childId: 'child_1',
      });

      const plan = createTrainingPlan({
        childId: 'child_1',
        chapterId: 'attention-focus',
        assignments: [{ mediaId: 'follow-star', order: 1 }],
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

      expect(peekPlanActivityRecovery()).toBeNull();
      expect(getTrainingPlan(plan.id)?.status).toBe('completed');
    });
  });
});

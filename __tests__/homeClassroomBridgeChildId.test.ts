import type { TrackedGoal } from '@/lib/goalsEngine';
import { createTrainingPlan } from '@/lib/training/createPlan';
import { MOTOR_SOCIAL_IMITATION_CHAPTER_ID } from '@/lib/training/loadChapter';
import {
  peekTrainingPlanLaunchContext,
} from '@/lib/training/planLaunchContext';
import { readActiveTrainingChildId } from '@/lib/training/sessionPersistence';
import {
  beginSpecializedTrainingFromBridge,
  readTrainingBridgeActiveChildId,
  resolveSpecializedTrainingBridgeAction,
  resolveTrainingBridgeState,
} from '@/lib/training/trainingBridge';
import {
  clearAllTrainingStorage,
  resetTrainingStorageAdapter,
  saveTrainingPlan,
  setTrainingStorageAdapter,
} from '@/lib/training/storage';

const ACTIVE_STUDENT_KEY = 'taaluf.activeStudent';

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
  localStorage.setItem(ACTIVE_STUDENT_KEY, JSON.stringify({ id, name: id }));
}

function c15Goal(childId: string): TrackedGoal {
  return {
    id: `tg_${childId}_C15_bridge`,
    childId,
    criterionId: 'C15',
    domain: 'social',
    title: 'التقليد الحركي والاجتماعي',
    smartText: 'أن يقلد الطفل حركة بسيطة',
    baseline: 30,
    target: 70,
    current: 35,
    startDate: '2026-09-08T00:00:00.000Z',
    targetDate: '2026-10-08T00:00:00.000Z',
    status: 'active',
    sessions: [],
  };
}

beforeEach(() => {
  installBrowserMocks();
  resetTrainingStorageAdapter();
  installMemoryStorage();
  clearAllTrainingStorage();
});

afterEach(() => {
  resetTrainingStorageAdapter();
  memory.clear();
});

describe('G3 — Home Classroom training bridge child id', () => {
  it('uses activeStudent.id when present', () => {
    setActiveStudent('child_a');
    expect(readTrainingBridgeActiveChildId()).toBe('child_a');
    expect(readActiveTrainingChildId()).toBe('child_a');
  });

  it('blocks specialized bridge when no activeStudent', () => {
    saveTrainingPlan(
      createTrainingPlan({
        childId: 'child_local',
        chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
        assignments: [{ mediaId: 'observer-imitation', difficulty: 1, order: 1 }],
        status: 'active',
      })
    );

    const action = resolveSpecializedTrainingBridgeAction(c15Goal('child_a'), true);
    expect(action).toEqual({ kind: 'blocked', reason: 'missing_child' });
  });

  it('never launches with child_local when activeStudent is missing', () => {
    saveTrainingPlan(
      createTrainingPlan({
        childId: 'child_local',
        chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
        assignments: [{ mediaId: 'observer-imitation', difficulty: 1, order: 1 }],
        status: 'active',
      })
    );

    const stateIfForced = resolveTrainingBridgeState('child_local', c15Goal('child_local'));
    expect(stateIfForced.status).toBe('ready');

    const action = resolveSpecializedTrainingBridgeAction(
      c15Goal('child_local'),
      true
    );
    expect(action.kind).toBe('blocked');
    expect(peekTrainingPlanLaunchContext()).toBeNull();
  });

  it('ready candidate + matching cursor → same ready launch behavior', () => {
    setActiveStudent('child_bridge_test');
    const plan = saveTrainingPlan(
      createTrainingPlan({
        childId: 'child_bridge_test',
        chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
        assignments: [
          {
            mediaId: 'observer-imitation',
            difficulty: 1,
            order: 1,
            skillIds: ['skill-c15-s1-gross'],
          },
        ],
        status: 'active',
      })
    );

    const action = resolveSpecializedTrainingBridgeAction(
      c15Goal('child_bridge_test'),
      true
    );
    expect(action.kind).toBe('ready');
    if (action.kind !== 'ready') return;

    expect(action.childId).toBe('child_bridge_test');
    expect(action.launch.planId).toBe(plan.id);
    expect(action.launch.mediaId).toBe('observer-imitation');
    expect(action.activityRoute).toContain('observer-imitation');
  });

  it('mismatch → same navigate + notice flag', () => {
    setActiveStudent('child_bridge_test');
    saveTrainingPlan(
      createTrainingPlan({
        childId: 'child_bridge_test',
        chapterId: 'attention-focus',
        assignments: [{ mediaId: 'follow-star', difficulty: 1, order: 1 }],
        status: 'active',
      })
    );

    const action = resolveSpecializedTrainingBridgeAction(
      c15Goal('child_bridge_test'),
      false
    );
    expect(action).toEqual({
      kind: 'navigate',
      href: '/dashboard/training',
      mismatchNotice: true,
    });
  });

  it('no_plan → same parent/specialist destinations', () => {
    setActiveStudent('child_bridge_test');

    expect(
      resolveSpecializedTrainingBridgeAction(c15Goal('child_bridge_test'), true)
    ).toEqual({
      kind: 'navigate',
      href: '/dashboard/training',
    });

    expect(
      resolveSpecializedTrainingBridgeAction(c15Goal('child_bridge_test'), false)
    ).toEqual({
      kind: 'navigate',
      href: '/dashboard/training/plans/new',
    });
  });

  it('child A active — does not use child B plan via bridge action', () => {
    setActiveStudent('child_a');
    saveTrainingPlan(
      createTrainingPlan({
        childId: 'child_b',
        chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
        assignments: [{ mediaId: 'observer-imitation', difficulty: 1, order: 1 }],
        status: 'active',
      })
    );

    const blocked = resolveSpecializedTrainingBridgeAction(c15Goal('child_b'), true);
    expect(blocked).toEqual({ kind: 'blocked', reason: 'goal_child_mismatch' });

    const forA = resolveSpecializedTrainingBridgeAction(c15Goal('child_a'), true);
    expect(forA.kind).toBe('navigate');
    if (forA.kind === 'navigate') {
      expect(forA.href).toBe('/dashboard/training');
    }
  });

  it('re-reads canonical active child after storage update (re-entry)', () => {
    expect(readTrainingBridgeActiveChildId()).toBeNull();
    setActiveStudent('child_a');
    expect(readTrainingBridgeActiveChildId()).toBe('child_a');
    localStorage.setItem(
      ACTIVE_STUDENT_KEY,
      JSON.stringify({ id: 'child_a_refreshed', name: 'A' })
    );
    expect(readTrainingBridgeActiveChildId()).toBe('child_a_refreshed');
  });

  it('beginSpecializedTrainingFromBridge sets launch for active child plan', () => {
    setActiveStudent('child_launch');
    const plan = saveTrainingPlan(
      createTrainingPlan({
        childId: 'child_launch',
        chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
        assignments: [{ mediaId: 'observer-imitation', difficulty: 2, order: 1 }],
        status: 'active',
      })
    );

    const action = resolveSpecializedTrainingBridgeAction(
      c15Goal('child_launch'),
      true
    );
    if (action.kind !== 'ready') {
      throw new Error('expected ready');
    }

    const navigated: string[] = [];
    beginSpecializedTrainingFromBridge({
      launch: action.launch,
      activityRoute: action.activityRoute,
      navigate: (href) => navigated.push(href),
    });

    expect(readActiveTrainingChildId()).toBe('child_launch');
    expect(peekTrainingPlanLaunchContext()).toEqual({
      planId: plan.id,
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      mediaId: 'observer-imitation',
      difficulty: 2,
      order: 1,
    });
    expect(navigated[0]).toContain('observer-imitation');
  });

  it('C15 bridge → observer-imitation route and skillIds unchanged', () => {
    setActiveStudent('child_c15');
    saveTrainingPlan(
      createTrainingPlan({
        childId: 'child_c15',
        chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
        assignments: [
          {
            mediaId: 'observer-imitation',
            difficulty: 1,
            order: 1,
            skillIds: ['skill-c15-s1-gross'],
          },
        ],
        status: 'active',
      })
    );

    const direct = resolveTrainingBridgeState('child_c15', c15Goal('child_c15'));
    expect(direct.status).toBe('ready');
    if (direct.status !== 'ready') return;

    const viaAction = resolveSpecializedTrainingBridgeAction(
      c15Goal('child_c15'),
      true
    );
    expect(viaAction.kind).toBe('ready');
    if (viaAction.kind !== 'ready') return;

    expect(viaAction.launch).toEqual(direct.launch);
    expect(viaAction.activityRoute).toBe(direct.activityRoute);
    expect(viaAction.launch.skillIds).toEqual(['skill-c15-s1-gross']);
  });
});

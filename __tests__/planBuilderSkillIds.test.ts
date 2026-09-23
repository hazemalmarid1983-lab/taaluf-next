import type { TrackedGoal } from '../lib/goalsEngine';
import * as goalsStore from '../lib/goalsStore';
import { createTrainingPlan } from '../lib/training/createPlan';
import {
  clearAllTrainingStorage,
  resetTrainingStorageAdapter,
  saveTrainingPlan,
  setTrainingStorageAdapter,
} from '../lib/training/storage';
import {
  buildOrderedAssignments,
  buildPlanBuilderConfigureRows,
  countSelectedPlanBuilderActivities,
  isPlanBuilderSkillSelected,
  resolvePlanBuilderGoalViews,
  saveTrainingPlanFromBuilder,
  togglePlanBuilderActivitySkill,
} from '../lib/training/planBuilder';
import { resolveTrainingPlanExecutionForPlan } from '../lib/training/planExecution';
import { preparePlanActivityBegin } from '../lib/training/planActivitySafety';
import { setTrainingPlanLaunchContext } from '../lib/training/planLaunchContext';
const ACTIVE_STUDENT_KEY = 'taaluf.activeStudent';

function installBrowserStorageMocks() {
  // @ts-expect-error test env
  global.window = global;
  const localStore: Record<string, string> = {};
  const sessionStore: Record<string, string> = {};
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: (key: string) => localStore[key] ?? null,
      setItem: (key: string, value: string) => {
        localStore[key] = value;
      },
      removeItem: (key: string) => {
        delete localStore[key];
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
    },
    writable: true,
  });
}

function setActiveStudentForTest(id: string) {
  localStorage.setItem(ACTIVE_STUDENT_KEY, JSON.stringify({ id }));
}
import { validateTrainingPlanDocument } from '../lib/training/validatePlan';
import { beginObserverImitationSession } from '../lib/training/observerImitationSessionFlow';
import {
  loadMotorSocialImitationChapter,
  MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
} from '../lib/training/loadChapter';
import { requireTrainingMedia } from '../lib/training/engine';
const C15_SKILLS = {
  S1: 'skill-c15-s1-gross',
  S2: 'skill-c15-s2-fine',
  S3: 'skill-c15-s3-social',
  S4: 'skill-c15-s4-replay',
  S5: 'skill-c15-s5-fading',
} as const;

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
  installBrowserStorageMocks();
  resetTrainingStorageAdapter();
  installMemoryStorage();
  clearAllTrainingStorage();
});

afterEach(() => {
  resetTrainingStorageAdapter();
  memory.clear();
  jest.restoreAllMocks();
});

function sampleGoal(childId: string, criterionId: string): TrackedGoal {
  return {
    id: `tg_${childId}_${criterionId}_test`,
    childId,
    criterionId,
    domain: 'social',
    title: 'التقليد الحركي والاجتماعي',
    smartText: 'هدف',
    baseline: 30,
    target: 70,
    current: 35,
    startDate: '2026-09-08T00:00:00.000Z',
    targetDate: '2026-10-08T00:00:00.000Z',
    status: 'active',
    sessions: [],
  };
}

describe('TrainingPlanAssignment.skillIds validation', () => {
  it('legacy assignment without skillIds stays valid', () => {
    const plan = createTrainingPlan({
      childId: 'child_legacy',
      chapterId: 'attention-focus',
      assignments: [{ mediaId: 'follow-star', difficulty: 1, order: 1 }],
      status: 'active',
    });
    expect(validateTrainingPlanDocument(plan).valid).toBe(true);
  });

  it('accepts valid skillIds on C15 assignment', () => {
    const plan = createTrainingPlan({
      childId: 'child_c15',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      assignments: [
        {
          mediaId: 'observer-imitation',
          difficulty: 1,
          order: 1,
          skillIds: [C15_SKILLS.S1, C15_SKILLS.S2],
        },
      ],
      status: 'active',
    });
    expect(validateTrainingPlanDocument(plan).valid).toBe(true);
  });

  it('rejects duplicate skillIds', () => {
    const plan = {
      id: 'p1',
      childId: 'c1',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      startDate: new Date().toISOString(),
      status: 'active',
      cursor: { nextOrder: 1 },
      assignments: [
        {
          mediaId: 'observer-imitation',
          difficulty: 1,
          order: 1,
          skillIds: [C15_SKILLS.S1, C15_SKILLS.S1],
        },
      ],
    };
    const result = validateTrainingPlanDocument(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('skillIds'))).toBe(true);
  });

  it('rejects skill not in chapter', () => {
    const plan = {
      id: 'p1',
      childId: 'c1',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      startDate: new Date().toISOString(),
      status: 'active',
      cursor: { nextOrder: 1 },
      assignments: [
        {
          mediaId: 'observer-imitation',
          difficulty: 1,
          order: 1,
          skillIds: ['skill-unknown'],
        },
      ],
    };
    const result = validateTrainingPlanDocument(plan);
    expect(result.valid).toBe(false);
  });

  it('rejects skill not linked to media', () => {
    const plan = {
      id: 'p1',
      childId: 'c1',
      chapterId: 'communication-language',
      startDate: new Date().toISOString(),
      status: 'active',
      cursor: { nextOrder: 1 },
      assignments: [
        {
          mediaId: 'tap-to-request',
          difficulty: 1,
          order: 1,
          skillIds: ['skill-symbol-request'],
        },
      ],
    };
    const result = validateTrainingPlanDocument(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('غير مرتبطة'))).toBe(true);
  });

  it('observer-imitation plan without skillIds remains valid', () => {
    const plan = createTrainingPlan({
      childId: 'c1',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      assignments: [{ mediaId: 'observer-imitation', difficulty: 1, order: 1 }],
      status: 'active',
    });
    expect(validateTrainingPlanDocument(plan).valid).toBe(true);
  });
});

describe('plan builder skill selection', () => {
  const childId = 'child_c15_builder';

  it('selects S1 only independently', () => {
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([
      sampleGoal(childId, 'C15'),
    ]);
    let selection = {};
    let order: string[] = [];
    const toggled = togglePlanBuilderActivitySkill(
      selection,
      order,
      'observer-imitation',
      C15_SKILLS.S1
    );
    selection = toggled.selection;
    order = toggled.mediaOrder;
    expect(isPlanBuilderSkillSelected(selection, 'observer-imitation', C15_SKILLS.S1)).toBe(
      true
    );
    expect(isPlanBuilderSkillSelected(selection, 'observer-imitation', C15_SKILLS.S2)).toBe(
      false
    );
    expect(countSelectedPlanBuilderActivities(order, selection)).toBe(1);
  });

  it('selects S1 + S2 for same media as one activity', () => {
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([
      sampleGoal(childId, 'C15'),
    ]);
    let selection = {};
    let order: string[] = [];
    for (const skillId of [C15_SKILLS.S1, C15_SKILLS.S2]) {
      const toggled = togglePlanBuilderActivitySkill(
        selection,
        order,
        'observer-imitation',
        skillId
      );
      selection = toggled.selection;
      order = toggled.mediaOrder;
    }
    expect(countSelectedPlanBuilderActivities(order, selection)).toBe(1);
    expect(selection['observer-imitation']).toEqual([
      C15_SKILLS.S1,
      C15_SKILLS.S2,
    ]);
  });

  it('configure step shows one media row with multiple skills', () => {
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([
      sampleGoal(childId, 'C15'),
    ]);
    const views = resolvePlanBuilderGoalViews(childId, [
      sampleGoal(childId, 'C15').id,
    ]);
    const selection = {
      'observer-imitation': [C15_SKILLS.S1, C15_SKILLS.S2],
    };
    const rows = buildPlanBuilderConfigureRows(views, selection, [
      'observer-imitation',
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.skillIds).toHaveLength(2);
  });

  it('save produces one assignment with three target skillIds only', () => {
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([
      sampleGoal(childId, 'C15'),
    ]);
    const selection = {
      'observer-imitation': [C15_SKILLS.S1, C15_SKILLS.S2, C15_SKILLS.S3],
    };
    const plan = saveTrainingPlanFromBuilder({
      childId,
      selectedGoalIds: [sampleGoal(childId, 'C15').id],
      orderedMediaIds: ['observer-imitation'],
      difficulties: { 'observer-imitation': 1 },
      selectedActivitySkills: selection,
    });
    expect(plan.assignments).toHaveLength(1);
    expect(plan.assignments[0]?.mediaId).toBe('observer-imitation');
    expect(plan.assignments[0]?.skillIds).toEqual([
      C15_SKILLS.S1,
      C15_SKILLS.S2,
      C15_SKILLS.S3,
    ]);
    expect(new Set(plan.assignments.map((a) => a.mediaId)).size).toBe(1);
  });

  it('legacy assignment with S4/S5 in skillIds remains valid', () => {
    const plan = createTrainingPlan({
      childId: 'legacy_s4',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      assignments: [
        {
          mediaId: 'observer-imitation',
          difficulty: 1,
          order: 1,
          skillIds: [C15_SKILLS.S1, C15_SKILLS.S4, C15_SKILLS.S5],
        },
      ],
      status: 'active',
    });
    expect(validateTrainingPlanDocument(plan).valid).toBe(true);
  });

  it('buildOrderedAssignments keeps mediaId uniqueness', () => {
    expect(() =>
      buildOrderedAssignments(['follow-star', 'follow-star'], {}, {})
    ).toThrow();
  });

  it('tap-to-request plan without skillIds stays valid', () => {
    const plan = createTrainingPlan({
      childId: 'child_comm',
      chapterId: 'communication-language',
      assignments: [{ mediaId: 'tap-to-request', difficulty: 1, order: 1 }],
      status: 'active',
    });
    expect(validateTrainingPlanDocument(plan).valid).toBe(true);
    expect(plan.assignments[0]?.skillIds).toBeUndefined();
  });

  it('attention save without skillIds unchanged', () => {
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([
      sampleGoal('child_a', 'C11'),
    ]);
    const plan = saveTrainingPlanFromBuilder({
      childId: 'child_a',
      selectedGoalIds: [sampleGoal('child_a', 'C11').id],
      orderedMediaIds: ['follow-star'],
      difficulties: { 'follow-star': 2 },
    });
    expect(plan.assignments[0]?.skillIds).toBeUndefined();
    expect(validateTrainingPlanDocument(plan).valid).toBe(true);
  });
});

describe('skillIds plan execution → session (metadata only)', () => {
  it('execution assignment retains skillIds for launch wiring', () => {
    const plan = saveTrainingPlan(
      createTrainingPlan({
        childId: 'child_launch',
        chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
        assignments: [
          {
            mediaId: 'observer-imitation',
            difficulty: 1,
            order: 1,
            skillIds: [C15_SKILLS.S1, C15_SKILLS.S2],
          },
        ],
        status: 'active',
      })
    );

    const execution = resolveTrainingPlanExecutionForPlan(plan);
    expect(execution.assignment?.skillIds).toEqual([
      C15_SKILLS.S1,
      C15_SKILLS.S2,
    ]);
  });

  it('preparePlanActivityBegin passes skillIds from stored assignment', () => {
    const childId = 'child_launch_ctx';
    setActiveStudentForTest(childId);
    const plan = saveTrainingPlan(
      createTrainingPlan({
        childId,
        chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
        assignments: [
          {
            mediaId: 'observer-imitation',
            difficulty: 1,
            order: 1,
            skillIds: [C15_SKILLS.S1, C15_SKILLS.S2],
          },
        ],
        status: 'active',
      })
    );

    setTrainingPlanLaunchContext({
      planId: plan.id,
      chapterId: plan.chapterId,
      mediaId: 'observer-imitation',
      difficulty: 1,
      order: 1,
    });

    const begin = preparePlanActivityBegin({ pageMediaId: 'observer-imitation' });
    expect(begin.ok).toBe(true);
    if (begin.ok) {
      expect(begin.skillIds).toEqual([C15_SKILLS.S1, C15_SKILLS.S2]);
    }
  });

  it('session stores skillIds when provided at begin', () => {
    const chapter = loadMotorSocialImitationChapter();
    const media = requireTrainingMedia(chapter, 'observer-imitation');
    const bundle = beginObserverImitationSession({
      childId: 'child_sess',
      chapterId: MOTOR_SOCIAL_IMITATION_CHAPTER_ID,
      media,
      skillIds: [C15_SKILLS.S1],
    });
    expect(bundle.session.skillIds).toEqual([C15_SKILLS.S1]);
  });
});

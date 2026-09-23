import type { TrackedGoal } from '../lib/goalsEngine';
import * as goalsStore from '../lib/goalsStore';
import { readActiveChild } from '../lib/parentJourney';
import { createTrainingPlan } from '../lib/training/createPlan';
import {
  PlanBuilderError,
  saveTrainingPlanFromBuilder,
} from '../lib/training/planBuilder';
import { resolveTrainingEntryState } from '../lib/training/planExecution';
import {
  ACTIVE_STUDENT_STORAGE_KEY,
  readActiveTrainingStudentForUi,
  syncActiveTrainingStudentAfterPlanSave,
} from '../lib/training/trainingActiveChildUx';
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

function installLocalStorage() {
  const localStore: Record<string, string> = {};
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
  return localStore;
}

function sampleGoal(childId: string, criterionId: string): TrackedGoal {
  return {
    id: `tg_${childId}_${criterionId}`,
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
  };
}

function savePlanForChildA() {
  const childA = 'child_a';
  const goal = sampleGoal(childA, 'C11');
  jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([goal]);

  const plan = saveTrainingPlanFromBuilder({
    childId: childA,
    selectedGoalIds: [goal.id],
    orderedMediaIds: ['follow-star'],
    difficulties: { 'follow-star': 1 },
  });

  syncActiveTrainingStudentAfterPlanSave({
    id: childA,
    name: 'Child A',
  });

  return { plan, childA, goal };
}

beforeEach(() => {
  resetTrainingStorageAdapter();
  installMemoryStorage();
  clearAllTrainingStorage();
  installLocalStorage();
  localStorage.clear();
  jest.restoreAllMocks();
});

afterEach(() => {
  resetTrainingStorageAdapter();
  memory.clear();
});

describe('G1 — plan builder / active child sync', () => {
  it('after successful save for child A while active was B, active becomes A', () => {
    localStorage.setItem(
      ACTIVE_STUDENT_STORAGE_KEY,
      JSON.stringify({ id: 'child_b', name: 'Child B' })
    );

    savePlanForChildA();

    expect(readActiveTrainingStudentForUi()).toEqual({
      id: 'child_a',
      name: 'Child A',
    });
    expect(readActiveChild()?.id).toBe('child_a');
  });

  it('dashboard entry resolves child A and finds A active plan', () => {
    const { plan, childA } = savePlanForChildA();

    const entry = resolveTrainingEntryState(childA);
    expect(entry.kind).toBe('ready');
    if (entry.kind !== 'ready') return;

    expect(entry.execution.plan?.id).toBe(plan.id);
    expect(entry.execution.plan?.childId).toBe(childA);
    expect(entry.execution.media?.mediaId).toBe('follow-star');
    expect(getActiveTrainingPlan(childA)?.id).toBe(plan.id);
  });

  it('failed plan save does not change active child', () => {
    localStorage.setItem(
      ACTIVE_STUDENT_STORAGE_KEY,
      JSON.stringify({ id: 'child_b', name: 'Child B' })
    );

    const childA = 'child_a';
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([
      sampleGoal(childA, 'C11'),
    ]);

    saveTrainingPlan(
      createTrainingPlan({
        childId: childA,
        chapterId: 'attention-focus',
        assignments: [{ mediaId: 'follow-star', difficulty: 1, order: 1 }],
        status: 'active',
      })
    );

    expect(() =>
      saveTrainingPlanFromBuilder({
        childId: childA,
        selectedGoalIds: ['tg_child_a_C11'],
        orderedMediaIds: ['match-me'],
        difficulties: { 'match-me': 1 },
      })
    ).toThrow(PlanBuilderError);

    expect(readActiveTrainingStudentForUi()?.id).toBe('child_b');
  });

  it('existing active plan guard still blocks second save', () => {
    const childA = 'child_a';
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockReturnValue([
      sampleGoal(childA, 'C11'),
    ]);

    saveTrainingPlanFromBuilder({
      childId: childA,
      selectedGoalIds: ['tg_child_a_C11'],
      orderedMediaIds: ['follow-star'],
      difficulties: { 'follow-star': 1 },
    });

    expect(() =>
      saveTrainingPlanFromBuilder({
        childId: childA,
        selectedGoalIds: ['tg_child_a_C11'],
        orderedMediaIds: ['match-me'],
        difficulties: { 'match-me': 1 },
      })
    ).toThrow(PlanBuilderError);
  });

  it('child B plan data are not mutated when saving plan for A', () => {
    const childB = 'child_b';
    const goalB = sampleGoal(childB, 'C25');
    jest.spyOn(goalsStore, 'loadGoalsLocal').mockImplementation((id) => {
      if (id === childB) return [goalB];
      if (id === 'child_a') return [sampleGoal('child_a', 'C11')];
      return [];
    });

    const planB = saveTrainingPlanFromBuilder({
      childId: childB,
      selectedGoalIds: [goalB.id],
      orderedMediaIds: ['follow-star'],
      difficulties: { 'follow-star': 2 },
    });

    savePlanForChildA();

    const storedB = getTrainingPlan(planB.id);
    expect(storedB?.childId).toBe(childB);
    expect(storedB?.assignments[0].difficulty).toBe(2);
    expect(getActiveTrainingPlan(childB)?.id).toBe(planB.id);
    expect(getActiveTrainingPlan('child_a')?.childId).toBe('child_a');
  });

  it('refresh preserves active child A via localStorage', () => {
    savePlanForChildA();

    const raw = localStorage.getItem(ACTIVE_STUDENT_STORAGE_KEY);
    expect(raw).toBeTruthy();

    expect(readActiveTrainingStudentForUi()?.id).toBe('child_a');

    const reparsed = JSON.parse(raw!) as { id: string; name: string };
    expect(reparsed.id).toBe('child_a');
    expect(readActiveTrainingStudentForUi()).toEqual({
      id: reparsed.id,
      name: reparsed.name,
    });
  });

  it('backward compatibility — existing plan without sync still loads for correct childId', () => {
    const childA = 'child_a';
    const legacyPlan = saveTrainingPlan(
      createTrainingPlan({
        childId: childA,
        chapterId: 'attention-focus',
        assignments: [{ mediaId: 'follow-star', difficulty: 1, order: 1 }],
        status: 'active',
      })
    );

    localStorage.setItem(
      ACTIVE_STUDENT_STORAGE_KEY,
      JSON.stringify({ id: childA, name: 'Legacy' })
    );

    const entry = resolveTrainingEntryState(childA);
    expect(entry.kind).toBe('ready');
    if (entry.kind === 'ready') {
      expect(entry.execution.plan?.id).toBe(legacyPlan.id);
    }
  });
});

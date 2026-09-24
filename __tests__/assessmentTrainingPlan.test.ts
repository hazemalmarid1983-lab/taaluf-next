import { persistLocalAssessment } from '../lib/assessmentHelpers';
import {
  ensureActiveTrainingPlanFromAssessment,
  hasCompletedAssessmentForTraining,
} from '../lib/training/assessmentTrainingPlan';
import {
  clearAllTrainingStorage,
  getActiveTrainingPlan,
  listTrainingPlans,
  resetTrainingStorageAdapter,
  saveTrainingPlan,
} from '../lib/training/storage';
import { createTrainingPlan } from '../lib/training/createPlan';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, String(value));
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
  };
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    value: storage,
  });
  Object.defineProperty(global, 'window', {
    configurable: true,
    value: global,
  });
  resetTrainingStorageAdapter();
  clearAllTrainingStorage();
});

afterEach(() => {
  resetTrainingStorageAdapter();
  memory.clear();
});

describe('ensureActiveTrainingPlanFromAssessment', () => {
  it('does not create a plan when the child has no completed assessment', () => {
    expect(hasCompletedAssessmentForTraining('child_1')).toBe(false);
    expect(ensureActiveTrainingPlanFromAssessment('child_1')).toBeNull();
    expect(listTrainingPlans('child_1')).toHaveLength(0);
  });

  it('activates a practice plan from a completed assessment and does not duplicate it', () => {
    persistLocalAssessment({
      studentId: 'child_1',
      percentage: 40,
      classification: 'متوسط',
      totalScore: 12,
      maxScore: 30,
      domainAverages: {},
      scores: [{ criterionId: 'C25', score: 2 }],
    });

    const plan = ensureActiveTrainingPlanFromAssessment('child_1');
    expect(plan?.status).toBe('active');
    expect(plan?.chapterId).toBe('attention-focus');
    expect(plan?.assignments[0]?.mediaId).toBe('follow-star');
    expect(plan?.goalIds?.length).toBeGreaterThan(0);

    const again = ensureActiveTrainingPlanFromAssessment('child_1');
    expect(again?.id).toBe(plan?.id);
    expect(listTrainingPlans('child_1')).toHaveLength(1);
    expect(getActiveTrainingPlan('child_1')?.id).toBe(plan?.id);
  });

  it('activates from a completed parent questionnaire when no specialist report exists', () => {
    localStorage.setItem(
      'taaluf.parentAssessment.v1',
      JSON.stringify([
        {
          childId: 'child_parent',
          answers: [{ id: 'p1', value: 2 }],
          mappedScores: [{ criterionId: 'C25', score: 2 }],
        },
      ])
    );

    const plan = ensureActiveTrainingPlanFromAssessment('child_parent');
    expect(plan?.status).toBe('active');
    expect(plan?.childId).toBe('child_parent');
    expect(plan?.assignments.length).toBeGreaterThan(0);
  });

  it('does not replace an existing active plan or reopen a finished plan', () => {
    persistLocalAssessment({
      studentId: 'child_1',
      percentage: 20,
      classification: 'خفيف',
      totalScore: 4,
      maxScore: 30,
      domainAverages: {},
      scores: [{ criterionId: 'C25', score: 2 }],
    });

    const active = saveTrainingPlan(
      createTrainingPlan({
        id: 'plan_specialist',
        childId: 'child_1',
        chapterId: 'attention-focus',
        assignments: [{ mediaId: 'match-me', order: 1 }],
      })
    );
    expect(ensureActiveTrainingPlanFromAssessment('child_1')?.id).toBe(active.id);

    saveTrainingPlan({ ...active, status: 'completed', cursor: { nextOrder: 2 } });
    expect(ensureActiveTrainingPlanFromAssessment('child_1')).toBeNull();
    expect(getActiveTrainingPlan('child_1')).toBeNull();
  });
});

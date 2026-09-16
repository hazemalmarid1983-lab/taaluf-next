import {
  createAttentionFocusTestPlan,
  createTrainingPlan,
  type CreateTrainingPlanInput,
} from '../lib/training/createPlan';
import {
  validateTrainingPlanDocument,
  sortedPlanAssignments,
} from '../lib/training/validatePlan';
import type { TrainingPlan } from '../lib/training/types';

function basePlan(overrides: Partial<CreateTrainingPlanInput> = {}): TrainingPlan {
  return createTrainingPlan({
    id: 'plan_test',
    childId: 'child_1',
    chapterId: 'attention-focus',
    assignments: [
      { mediaId: 'follow-star', difficulty: 1, order: 1 },
      { mediaId: 'match-me', difficulty: 2, order: 2 },
    ],
    ...overrides,
  });
}

describe('validateTrainingPlanDocument', () => {
  it('accepts a valid plan', () => {
    const plan = basePlan();
    expect(validateTrainingPlanDocument(plan).valid).toBe(true);
  });

  it('rejects missing id', () => {
    const plan = basePlan();
    const invalid = { ...plan, id: '' };
    const result = validateTrainingPlanDocument(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('id'))).toBe(true);
  });

  it('rejects duplicate order values', () => {
    const plan = basePlan();
    const invalid = {
      ...plan,
      assignments: [
        { mediaId: 'follow-star', difficulty: 1, order: 1 },
        { mediaId: 'match-me', difficulty: 1, order: 1 },
      ],
    };
    expect(validateTrainingPlanDocument(invalid).valid).toBe(false);
  });

  it('rejects duplicate mediaId', () => {
    expect(() =>
      createTrainingPlan({
        childId: 'child_1',
        chapterId: 'attention-focus',
        assignments: [
          { mediaId: 'follow-star', order: 1 },
          { mediaId: 'follow-star', order: 2 },
        ],
      })
    ).toThrow();
  });

  it('rejects invalid difficulty', () => {
    const plan = basePlan();
    const invalid = {
      ...plan,
      assignments: [{ mediaId: 'follow-star', difficulty: 4, order: 1 }],
    };
    const result = validateTrainingPlanDocument(invalid);
    expect(result.valid).toBe(false);
  });

  it('rejects cursor pointing to missing assignment', () => {
    const plan = basePlan();
    const invalid = {
      ...plan,
      cursor: { nextOrder: 99 },
    };
    const result = validateTrainingPlanDocument(invalid);
    expect(result.valid).toBe(false);
  });

  it('accepts completed plan when cursor is past last order', () => {
    const plan = createTrainingPlan({
      childId: 'child_1',
      chapterId: 'attention-focus',
      status: 'completed',
      assignments: [{ mediaId: 'follow-star', order: 1 }],
    });
    expect(validateTrainingPlanDocument(plan).valid).toBe(true);
    expect(plan.cursor.nextOrder).toBe(2);
  });

  it('accepts active status with valid cursor', () => {
    const plan = basePlan({ status: 'active' });
    expect(validateTrainingPlanDocument(plan).valid).toBe(true);
  });

  it('sorts assignments deterministically', () => {
    const plan = createTrainingPlan({
      childId: 'child_1',
      chapterId: 'attention-focus',
      assignments: [
        { mediaId: 'match-me', order: 2 },
        { mediaId: 'follow-star', order: 1 },
      ],
    });
    const sorted = sortedPlanAssignments(plan);
    expect(sorted.map((item) => item.order)).toEqual([1, 2]);
  });
});

describe('createAttentionFocusTestPlan', () => {
  it('creates five ordered assignments', () => {
    const plan = createAttentionFocusTestPlan('child_1');
    expect(plan.assignments).toHaveLength(5);
    expect(plan.cursor.nextOrder).toBe(1);
    expect(plan.status).toBe('active');
  });
});

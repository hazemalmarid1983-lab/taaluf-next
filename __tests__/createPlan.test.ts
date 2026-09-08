import {
  buildTrainingPlanAssignments,
  createAttentionFocusTestPlan,
  createTrainingPlan,
} from '../lib/training/createPlan';
import { validateTrainingPlanDocument } from '../lib/training/validatePlan';

describe('createTrainingPlan', () => {
  it('assigns deterministic order when omitted', () => {
    const plan = createTrainingPlan({
      childId: 'child_1',
      chapterId: 'attention-focus',
      assignments: [{ mediaId: 'follow-star' }, { mediaId: 'match-me' }],
    });

    expect(plan.assignments.map((item) => item.order)).toEqual([1, 2]);
    expect(plan.cursor.nextOrder).toBe(1);
    expect(validateTrainingPlanDocument(plan).valid).toBe(true);
  });

  it('requires childId and chapterId', () => {
    expect(() =>
      createTrainingPlan({
        childId: '',
        chapterId: 'attention-focus',
        assignments: [{ mediaId: 'follow-star' }],
      })
    ).toThrow();
  });

  it('accepts optional goalIds referencing TrackedGoal ids', () => {
    const plan = createTrainingPlan({
      childId: 'child_1',
      chapterId: 'attention-focus',
      goalIds: ['tracked_goal_1', 'tracked_goal_2'],
      assignments: [{ mediaId: 'follow-star' }],
    });
    expect(plan.goalIds).toEqual(['tracked_goal_1', 'tracked_goal_2']);
  });

  it('does not invent media — caller supplies mediaIds', () => {
    expect(() =>
      createTrainingPlan({
        childId: 'child_1',
        chapterId: 'attention-focus',
        assignments: [],
      })
    ).toThrow();

    const assignments = buildTrainingPlanAssignments([
      { mediaId: 'custom-media-only' },
    ]);
    expect(assignments[0].mediaId).toBe('custom-media-only');
  });

  it('creates attention-focus test plan with five explicit mediaIds', () => {
    const plan = createAttentionFocusTestPlan('child_demo', {
      mediaIds: ['follow-star', 'match-me'],
    });
    expect(plan.assignments).toHaveLength(2);
    expect(plan.assignments[0].mediaId).toBe('follow-star');
  });
});

/**
 * Goal bridge (V1 — documented, not implemented):
 * TrainingPlan.goalIds holds optional references to existing TrackedGoal IDs.
 * No mapper from TrainingGoalLink → TrackedGoal in this phase.
 */

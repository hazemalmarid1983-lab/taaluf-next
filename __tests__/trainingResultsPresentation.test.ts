import type { TrackedGoal } from '../lib/goalsEngine';
import { calculateSessionMetrics } from '../lib/training/engine';
import type { TrainingSessionRuntime } from '../lib/training/engine/types';
import {
  canViewTrainingSession,
  filterCompletedSessionsForChild,
  parseTrainingGoalSessionNotes,
  promptBreakdownEntries,
  promptLevelLabelAr,
  resolveGoalImpactsForSession,
  resolveSessionMetrics,
  TRAINING_SESSION_ID_IN_NOTES,
} from '../lib/training/trainingResultsPresentation';

function completedSession(
  overrides: Partial<TrainingSessionRuntime> = {}
): TrainingSessionRuntime {
  return {
    id: 'sess_test_1',
    childId: 'child_a',
    chapterId: 'attention-focus',
    mediaId: 'follow-star',
    difficulty: 1,
    startedAt: '2026-09-01T10:00:00.000Z',
    endedAt: '2026-09-01T10:10:00.000Z',
    status: 'completed',
    targetTrialCount: 2,
    trials: [
      {
        trialNumber: 1,
        correct: true,
        promptLevel: 'independent',
        responseTimeMs: 500,
        recordedAt: '2026-09-01T10:01:00.000Z',
      },
      {
        trialNumber: 2,
        correct: false,
        promptLevel: 'no_response',
        responseTimeMs: 3000,
        recordedAt: '2026-09-01T10:02:00.000Z',
      },
    ],
    ...overrides,
  };
}

describe('trainingResultsPresentation', () => {
  it('filters completed sessions for active child only', () => {
    const completed = completedSession();
    const active = completedSession({
      id: 'sess_active',
      status: 'active',
      endedAt: undefined,
    });
    const otherChild = completedSession({
      id: 'sess_other',
      childId: 'child_b',
    });
    const list = filterCompletedSessionsForChild(
      [completed, active, otherChild],
      'child_a'
    );
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe('sess_test_1');
  });

  it('blocks wrong child and incomplete session from view', () => {
    const session = completedSession();
    expect(canViewTrainingSession(session, 'child_a')).toBe(true);
    expect(canViewTrainingSession(session, 'child_b')).toBe(false);
    expect(
      canViewTrainingSession(
        completedSession({ status: 'active', endedAt: undefined }),
        'child_a'
      )
    ).toBe(false);
    expect(canViewTrainingSession(null, 'child_a')).toBe(false);
  });

  it('resolveSessionMetrics matches calculateSessionMetrics from trials', () => {
    const session = completedSession();
    const metrics = resolveSessionMetrics(session);
    expect(metrics).toEqual(calculateSessionMetrics(session.trials));
    expect(metrics.totalTrials).toBe(2);
    expect(metrics.correctCount).toBe(1);
    expect(metrics.incorrectCount).toBe(1);
    expect(metrics.promptBreakdown.no_response).toBe(1);
    expect(metrics.promptBreakdown.independent).toBe(1);
  });

  it('prompt breakdown includes no_response and Arabic labels', () => {
    const session = completedSession();
    const entries = promptBreakdownEntries(resolveSessionMetrics(session));
    expect(entries.some((e) => e.level === 'no_response')).toBe(true);
    expect(promptLevelLabelAr('no_response')).toBe('عدم استجابة');
    expect(promptLevelLabelAr('gestural')).toBe('مساعدة بالإيماءة');
  });

  it('parses training goal session notes', () => {
    const notes = `${TRAINING_SESSION_ID_IN_NOTES}sess_x; independence=25%; accuracy=75%`;
    expect(parseTrainingGoalSessionNotes(notes)).toEqual({
      trainingSessionId: 'sess_x',
      independence: 25,
      accuracy: 75,
    });
  });

  it('goal impact shows increment without fabricated before value', () => {
    const session = completedSession({
      id: 'sess_goal_link',
      goalIds: ['goal_1'],
    });
    const goal: TrackedGoal = {
      id: 'goal_1',
      childId: 'child_a',
      criterionId: 'C1',
      domain: 'communication',
      title: 'طلب وظيفي',
      smartText: '…',
      baseline: 0,
      target: 100,
      current: 11,
      startDate: '2026-01-01',
      targetDate: '2026-12-31',
      status: 'active',
      sessions: [
        {
          at: '2026-09-01T10:10:00.000Z',
          activity: 'تدريب: follow-star',
          notes: `${TRAINING_SESSION_ID_IN_NOTES}sess_goal_link; independence=25%; accuracy=50%`,
          progress: 11,
        },
      ],
    };
    const impacts = resolveGoalImpactsForSession(session, [goal]);
    expect(impacts[0]!.recordedProgressAfter).toBe(11);
    expect(impacts[0]!.incrementDisplay).toBe('+1');
    expect(JSON.stringify(impacts)).not.toMatch(/before|قبل/i);
  });

  it('goal impact empty when no linked goal sessions', () => {
    const session = completedSession({ goalIds: ['missing'] });
    const impacts = resolveGoalImpactsForSession(session, []);
    expect(impacts[0]!.incrementDisplay).toBeNull();
    expect(impacts[0]!.recordedProgressAfter).toBeNull();
  });

  it('trials data available for display rows', () => {
    const session = completedSession();
    expect(session.trials[0]!.correct).toBe(true);
    expect(session.trials[1]!.promptLevel).toBe('no_response');
  });
});

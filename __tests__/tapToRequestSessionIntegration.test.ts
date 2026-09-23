import type { TrackedGoal } from '../lib/goalsEngine';
import * as goalsStore from '../lib/goalsStore';
import {
  applyTrainingSessionToTrackedGoals,
  trainingGoalCurrentIncrement,
} from '../lib/training/goalFeedback';
import { loadCommunicationLanguageChapter } from '../lib/training/loadChapter';
import {
  calculateSessionMetrics,
  createTrainingSession,
  endTrainingSession,
  requireTrainingMedia,
} from '../lib/training/engine';
import {
  buildOutcomeAfterObserverRecord,
  buildTapToRequestTrialSpec,
  onChildTapChoice,
  onObserverOpenRecording,
} from '../lib/training/tapToRequestObserverFlow';
import { resolveCommRuntimeSettings } from '../lib/training/communicationChoiceEngine';
import { resolveMediaRuntimeConfig } from '../lib/training/engine';
import {
  beginCommChoiceSession,
  commitCommChoiceTrial,
  finalizeCommChoiceSession,
  isCommChoiceSessionComplete,
  startCommChoiceTrial,
} from '../lib/training/communicationChoiceSessionFlow';
import { persistCompletedTrainingSession } from '../lib/training/sessionPersistence';
import {
  getTrainingProgress,
  getTrainingSession,
  setTrainingStorageAdapter,
} from '../lib/training/storage';

const memory = new Map<string, string>();
beforeEach(() => {
  memory.clear();
  jest.restoreAllMocks();
  setTrainingStorageAdapter({
    isAvailable: () => true,
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
  });
});

function seedGoal(childId: string, goalId: string): TrackedGoal {
  let stored: TrackedGoal = {
    id: goalId,
    childId,
    title: 'طلب وظيفي',
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
  return stored;
}

describe('tap-to-request session → storage → goals', () => {
  const chapter = loadCommunicationLanguageChapter();
  const media = requireTrainingMedia(chapter, 'tap-to-request');
  const settings = resolveCommRuntimeSettings(resolveMediaRuntimeConfig(media));

  it('persists trials with correct, promptLevel, responseTimeMs, recordedAt', () => {
    const bundle = beginCommChoiceSession({
      childId: 'child_tap',
      chapterId: chapter.chapter.chapterId,
      media,
      planId: 'plan_1',
      goalIds: ['goal_1'],
    });
    let session = startCommChoiceTrial(bundle.session);
    const sessionSeed = session.id;

    const observerLevels = [
      'independent',
      'gestural',
      'verbal',
      'partial_physical',
      'full_physical',
      'no_response',
      'independent',
      'gestural',
    ] as const;

    for (let n = 1; n <= session.targetTrialCount; n += 1) {
      const spec = buildTapToRequestTrialSpec(settings, n, sessionSeed);
      const level = observerLevels[n - 1]!;
      let recorded;

      if (level === 'no_response') {
        const open = onObserverOpenRecording({ phase: 'choosing' });
        recorded = buildOutcomeAfterObserverRecord({
          phase: 'awaiting_observer',
          pending: open!.pending,
          spec,
          observerLevel: 'no_response',
          elapsedMsAtRecord: 4000 + n * 100,
        });
      } else {
        const correctId = spec.choices.find((c) => c.isCorrect)!.id;
        const wrongId = spec.choices.find((c) => !c.isCorrect)!.id;
        const pick = n % 3 === 0 ? wrongId : correctId;
        const tap = onChildTapChoice({
          phase: 'choosing',
          spec,
          choiceId: pick,
          elapsedMs: 500 + n * 50,
        });
        recorded = buildOutcomeAfterObserverRecord({
          phase: 'awaiting_observer',
          pending: tap!.pending,
          spec,
          observerLevel: level,
          elapsedMsAtRecord: 900,
        });
      }

      session = commitCommChoiceTrial(session, recorded!.outcome);
      if (n < session.targetTrialCount) {
        session = startCommChoiceTrial(session);
      }
    }

    session = finalizeCommChoiceSession(session);
    const metrics = calculateSessionMetrics(session.trials);

    expect(session.status).toBe('completed');
    expect(session.childId).toBe('child_tap');
    expect(session.chapterId).toBe(chapter.chapter.chapterId);
    expect(session.mediaId).toBe('tap-to-request');
    expect(session.planId).toBe('plan_1');
    expect(session.goalIds).toEqual(['goal_1']);
    expect(session.endedAt).toBeDefined();
    expect(session.trials.length).toBe(session.targetTrialCount);

    for (const trial of session.trials) {
      expect(typeof trial.correct).toBe('boolean');
      expect(trial.promptLevel).toBeTruthy();
      expect(trial.responseTimeMs).toBeGreaterThanOrEqual(0);
      expect(trial.recordedAt).toMatch(/^\d{4}-/);
    }

    expect(metrics.totalTrials).toBe(session.targetTrialCount);
    expect(metrics.promptBreakdown.independent).toBeGreaterThan(0);
    expect(metrics.promptBreakdown.gestural).toBeGreaterThan(0);
    expect(metrics.promptBreakdown.no_response).toBe(1);
    expect(metrics.accuracy).toBeGreaterThan(0);
    expect(metrics.independence).toBeGreaterThan(0);
    expect(metrics.averageResponseTimeMs).not.toBeNull();

    const persisted = persistCompletedTrainingSession(session);
    expect(getTrainingSession(session.id)?.trials.length).toBe(
      session.targetTrialCount
    );
    expect(
      getTrainingProgress(
        'child_tap',
        chapter.chapter.chapterId,
        'tap-to-request'
      )?.completedSessions
    ).toBe(1);
    expect(persisted.metrics.accuracy).toBe(metrics.accuracy);

    seedGoal('child_tap', 'goal_1');
    const updated = applyTrainingSessionToTrackedGoals(session, metrics);
    expect(updated[0]?.current).toBe(
      10 + trainingGoalCurrentIncrement(metrics.independence)
    );

    const currentAfterFirst = updated[0]!.current;
    const again = applyTrainingSessionToTrackedGoals(session, metrics);
    expect(again).toHaveLength(0);
    expect(goalsStore.loadGoalsLocal('child_tap')[0]?.current).toBe(
      currentAfterFirst
    );
  });

  it('does not finalize session before last observer commit', () => {
    let session = createTrainingSession({
      id: 'tap_sess_partial',
      childId: 'child_tap',
      chapterId: chapter.chapter.chapterId,
      media,
    });
    session = startCommChoiceTrial(session);
    const spec = buildTapToRequestTrialSpec(settings, 1, session.id);
    const tap = onChildTapChoice({
      phase: 'choosing',
      spec,
      choiceId: spec.choices.find((c) => c.isCorrect)!.id,
      elapsedMs: 300,
    });
    session = commitCommChoiceTrial(
      session,
      buildOutcomeAfterObserverRecord({
        phase: 'awaiting_observer',
        pending: tap!.pending,
        spec,
        observerLevel: 'verbal',
        elapsedMsAtRecord: 800,
      })!.outcome
    );
    expect(isCommChoiceSessionComplete(session)).toBe(false);
    expect(() => endTrainingSession(session)).not.toThrow();
  });
});

import type { TrainingSessionRuntime } from '../lib/training/engine/types';
import { calculateSessionMetrics } from '../lib/training/engine';
import {
  canViewTrainingSession,
} from '../lib/training/trainingResultsPresentation';
import {
  metricsForCompletedSession,
  resolveTapToRequestDoneHref,
  resolveTapToRequestSessionChildId,
  resolveTapToRequestSessionDetailHref,
  shouldUseTapToRequestCompleteScreen,
  TAP_TO_REQUEST_MEDIA_ID,
} from '../lib/training/tapToRequestCompletion';

function completedTapSession(
  overrides: Partial<TrainingSessionRuntime> = {}
): TrainingSessionRuntime {
  return {
    id: 'sess_tap_complete_99',
    childId: 'child_active_1',
    chapterId: 'communication-language',
    mediaId: 'tap-to-request',
    difficulty: 1,
    startedAt: '2026-09-15T08:00:00.000Z',
    endedAt: '2026-09-15T08:08:00.000Z',
    status: 'completed',
    targetTrialCount: 2,
    planId: 'plan_abc',
    goalIds: ['goal_1'],
    trials: [
      {
        trialNumber: 1,
        correct: true,
        promptLevel: 'independent',
        responseTimeMs: 400,
        recordedAt: '2026-09-15T08:01:00.000Z',
      },
      {
        trialNumber: 2,
        correct: false,
        promptLevel: 'gestural',
        responseTimeMs: 900,
        recordedAt: '2026-09-15T08:02:00.000Z',
      },
    ],
    ...overrides,
  };
}

describe('tap-to-request completion flow', () => {
  it('uses TapToRequestComplete when tap-to-request session is completed', () => {
    const session = completedTapSession();
    expect(
      shouldUseTapToRequestCompleteScreen(
        TAP_TO_REQUEST_MEDIA_ID,
        session,
        'complete'
      )
    ).toBe(true);
    expect(
      shouldUseTapToRequestCompleteScreen(
        TAP_TO_REQUEST_MEDIA_ID,
        session,
        'playing'
      )
    ).toBe(false);
    expect(
      shouldUseTapToRequestCompleteScreen('symbol-board-request', session, 'complete')
    ).toBe(false);
  });

  it('does not fall back to generic complete for completed tap session', () => {
    const session = completedTapSession();
    expect(
      shouldUseTapToRequestCompleteScreen(TAP_TO_REQUEST_MEDIA_ID, session, 'complete')
    ).toBe(true);
  });

  it('metricsForCompletedSession matches trials (real metrics at render)', () => {
    const session = completedTapSession();
    const metrics = metricsForCompletedSession(session);
    expect(metrics).toEqual(calculateSessionMetrics(session.trials));
    expect(metrics.totalTrials).toBe(2);
    expect(metrics.correctCount).toBe(1);
    expect(metrics.incorrectCount).toBe(1);
    expect(metrics.promptBreakdown.independent).toBe(1);
    expect(metrics.promptBreakdown.gestural).toBe(1);
  });

  it('session detail href uses session.id', () => {
    expect(resolveTapToRequestSessionDetailHref('sess_tap_complete_99')).toBe(
      '/dashboard/training/sessions/sess_tap_complete_99'
    );
  });

  it('done button href for tap-to-request goes to /dashboard/training', () => {
    expect(resolveTapToRequestDoneHref(TAP_TO_REQUEST_MEDIA_ID)).toBe(
      '/dashboard/training'
    );
  });

  it('plan-linked tap-to-request uses activeChildId not child_local', () => {
    const resolution = resolveTapToRequestSessionChildId({
      mediaId: TAP_TO_REQUEST_MEDIA_ID,
      beginChildId: 'child_local',
      activeChildId: 'child_active_1',
      planId: 'plan_abc',
    });
    expect(resolution.ok).toBe(true);
    if (resolution.ok) {
      expect(resolution.childId).toBe('child_active_1');
    }
  });

  it('tap-to-request blocks without activeStudent', () => {
    expect(
      resolveTapToRequestSessionChildId({
        mediaId: TAP_TO_REQUEST_MEDIA_ID,
        beginChildId: 'child_local',
        activeChildId: null,
      }).ok
    ).toBe(false);
  });

  it('completed session is viewable on detail page for same active child', () => {
    const session = completedTapSession();
    expect(canViewTrainingSession(session, 'child_active_1')).toBe(true);
    expect(canViewTrainingSession(session, 'child_other')).toBe(false);
  });
});

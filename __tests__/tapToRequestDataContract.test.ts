import { calculateSessionMetrics } from '../lib/training/engine/metrics';
import {
  requireTrainingMedia,
  resolveMediaRuntimeConfig,
} from '../lib/training/engine';
import {
  validateTrainingSessionRuntime,
  validateTrainingTrial,
} from '../lib/training/engine/validate';
import { loadCommunicationLanguageChapter } from '../lib/training/loadChapter';
import {
  beginCommChoiceSession,
  commitCommChoiceTrial,
  finalizeCommChoiceSession,
  startCommChoiceTrial,
} from '../lib/training/communicationChoiceSessionFlow';
import { resolveCommRuntimeSettings } from '../lib/training/communicationChoiceEngine';
import {
  buildTapToRequestTrialSpec,
  buildOutcomeAfterObserverRecord,
  onChildTapChoice,
  onObserverOpenRecording,
} from '../lib/training/tapToRequestObserverFlow';
import { TAP_TO_REQUEST_PROTOCOL_REVISION } from '../lib/training/types';

describe('tap-to-request Data Contract v1', () => {
  const chapter = loadCommunicationLanguageChapter();
  const media = requireTrainingMedia(chapter, 'tap-to-request');
  const settings = resolveCommRuntimeSettings(resolveMediaRuntimeConfig(media));

  function beginSession() {
    return beginCommChoiceSession({
      childId: 'child_contract',
      chapterId: chapter.chapter.chapterId,
      media,
    });
  }

  it('sets protocolRevision on new tap-to-request session', () => {
    const { session } = beginSession();
    expect(session.protocolRevision).toBe(TAP_TO_REQUEST_PROTOCOL_REVISION);
  });

  it('persists correct child tap contract fields on trial', () => {
    const spec = buildTapToRequestTrialSpec(settings, 1, 'seed_sess');
    const correctId = spec.choices.find((c) => c.isCorrect)!.id;
    const tap = onChildTapChoice({
      phase: 'choosing',
      spec,
      choiceId: correctId,
      elapsedMs: 420,
    });
    const recorded = buildOutcomeAfterObserverRecord({
      phase: 'awaiting_observer',
      pending: tap!.pending,
      spec,
      observerLevel: 'independent',
      elapsedMsAtRecord: 500,
    });

    expect(recorded!.outcome.correct).toBe(true);
    expect(recorded!.outcome.targetId).toBe(spec.target.id);
    expect(recorded!.outcome.responseMode).toBe('child_tap');
    expect(recorded!.outcome.responseChoiceId).toBe(correctId);

    let { session } = beginSession();
    session = startCommChoiceTrial(session);
    session = commitCommChoiceTrial(session, recorded!.outcome);
    const trial = session.trials[0];

    expect(trial.targetId).toBe(spec.target.id);
    expect(trial.responseMode).toBe('child_tap');
    expect(trial.responseChoiceId).toBe(correctId);
    expect(trial.correct).toBe(true);
  });

  it('persists incorrect child tap contract fields on trial', () => {
    const spec = buildTapToRequestTrialSpec(settings, 2, 'seed_sess');
    const wrongId = spec.choices.find((c) => !c.isCorrect)!.id;
    const tap = onChildTapChoice({
      phase: 'choosing',
      spec,
      choiceId: wrongId,
      elapsedMs: 380,
    });
    const recorded = buildOutcomeAfterObserverRecord({
      phase: 'awaiting_observer',
      pending: tap!.pending,
      spec,
      observerLevel: 'gestural',
      elapsedMsAtRecord: 600,
    });

    expect(recorded!.outcome.correct).toBe(false);
    expect(recorded!.outcome.responseChoiceId).toBe(wrongId);

    let { session } = beginSession();
    session = startCommChoiceTrial(session);
    session = commitCommChoiceTrial(session, recorded!.outcome);
    expect(session.trials[0].correct).toBe(false);
    expect(session.trials[0].responseMode).toBe('child_tap');
    expect(session.trials[0].targetId).toBe(spec.target.id);
  });

  it('perserves observer no-response with responseChoiceId null', () => {
    const spec = buildTapToRequestTrialSpec(settings, 3, 'seed_sess');
    const opened = onObserverOpenRecording({ phase: 'choosing' });
    const recorded = buildOutcomeAfterObserverRecord({
      phase: 'awaiting_observer',
      pending: opened!.pending,
      spec,
      observerLevel: 'no_response',
      elapsedMsAtRecord: 8000,
    });

    expect(recorded!.outcome.correct).toBe(false);
    expect(recorded!.outcome.responseMode).toBe('observer_no_response');
    expect(recorded!.outcome.responseChoiceId).toBeNull();
    expect(recorded!.outcome.targetId).toBe(spec.target.id);

    let { session } = beginSession();
    session = startCommChoiceTrial(session);
    session = commitCommChoiceTrial(session, recorded!.outcome);
    expect(session.trials[0].responseChoiceId).toBeNull();
    expect(session.trials[0].responseMode).toBe('observer_no_response');
  });

  it('keeps protocolRevision after session finalize', () => {
    const spec = buildTapToRequestTrialSpec(settings, 1, 'seed_fin');
    const tap = onChildTapChoice({
      phase: 'choosing',
      spec,
      choiceId: spec.choices.find((c) => c.isCorrect)!.id,
      elapsedMs: 300,
    });
    const recorded = buildOutcomeAfterObserverRecord({
      phase: 'awaiting_observer',
      pending: tap!.pending,
      spec,
      observerLevel: 'independent',
      elapsedMsAtRecord: 400,
    });

    let { session } = beginSession();
    session = startCommChoiceTrial(session);
    session = commitCommChoiceTrial(session, recorded!.outcome);
    session = finalizeCommChoiceSession(session);

    expect(session.protocolRevision).toBe(TAP_TO_REQUEST_PROTOCOL_REVISION);
    expect(validateTrainingSessionRuntime(session).valid).toBe(true);
  });

  it('validates legacy trials and sessions without contract fields', () => {
    const legacyTrial = {
      trialNumber: 1,
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 500,
      recordedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(validateTrainingTrial(legacyTrial).valid).toBe(true);

    const legacySession = {
      id: 'legacy_sess',
      childId: 'c1',
      chapterId: 'communication-language',
      mediaId: 'follow-star',
      difficulty: 1,
      startedAt: '2026-01-01T00:00:00.000Z',
      endedAt: '2026-01-01T00:05:00.000Z',
      trials: [legacyTrial],
      status: 'completed',
      targetTrialCount: 1,
    };
    expect(validateTrainingSessionRuntime(legacySession).valid).toBe(true);
  });

  it('does not change calculateSessionMetrics semantics with contract fields', () => {
    const trialsWithout = [
      {
        trialNumber: 1,
        correct: true,
        promptLevel: 'independent' as const,
        responseTimeMs: 400,
        recordedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        trialNumber: 2,
        correct: false,
        promptLevel: 'gestural' as const,
        responseTimeMs: 900,
        recordedAt: '2026-01-01T00:01:00.000Z',
      },
    ];

    const trialsWith = trialsWithout.map((t, i) =>
      i === 0
        ? {
            ...t,
            targetId: 'water',
            responseChoiceId: 'c-water',
            responseMode: 'child_tap' as const,
          }
        : {
            ...t,
            targetId: 'food',
            responseChoiceId: null,
            responseMode: 'observer_no_response' as const,
          }
    );

    expect(calculateSessionMetrics(trialsWithout)).toEqual(
      calculateSessionMetrics(trialsWith)
    );
  });
});

import { loadCommunicationLanguageChapter } from '../lib/training/loadChapter';
import { requireTrainingMedia, resolveMediaRuntimeConfig } from '../lib/training/engine';
import {
  buildCommTrialSpec,
  getCommDisplayedChoices,
  resolveCommAssistanceStage,
  resolveCommObserverTrialOutcome,
  resolveCommRuntimeSettings,
} from '../lib/training/communicationChoiceEngine';
import {
  beginCommChoiceSession,
  commitCommChoiceTrial,
  finalizeCommChoiceSession,
  isCommChoiceSessionComplete,
  startCommChoiceTrial,
} from '../lib/training/communicationChoiceSessionFlow';
import type { PromptHierarchyLevel } from '../lib/promptHierarchy';
import {
  buildOutcomeAfterObserverRecord,
  canCommitSessionTrial,
  onChildTapChoice,
  onObserverOpenRecording,
  resolveTapToRequestAssistanceStageForElapsed,
  resolveTapToRequestDisplayedChoices,
  shouldApplyTapToRequestTimedVisualAssistance,
  shouldCommitTrialOnResponseWindow,
} from '../lib/training/tapToRequestObserverFlow';

describe('tap-to-request observer flow', () => {
  const media = requireTrainingMedia(
    loadCommunicationLanguageChapter(),
    'tap-to-request'
  );
  const settings = resolveCommRuntimeSettings(resolveMediaRuntimeConfig(media));

  function specForTrial(n: number) {
    return buildCommTrialSpec(settings, n);
  }

  it('does not apply timed visual assistance in tap-to-request', () => {
    expect(shouldApplyTapToRequestTimedVisualAssistance()).toBe(false);
  });

  it('responseWindowMs does not change assistanceStage in tap-to-request', () => {
    const spec = specForTrial(1);
    const elapsedPastWindow = spec.responseWindowMs + 8000;
    expect(resolveCommAssistanceStage(elapsedPastWindow, true)).not.toBe('none');
    expect(resolveTapToRequestAssistanceStageForElapsed()).toBe('none');
  });

  it('responseWindowMs does not change displayed choice count', () => {
    const spec = specForTrial(1);
    const elapsedPastWindow = spec.responseWindowMs + 8000;
    const tapChoices = resolveTapToRequestDisplayedChoices(spec);
    const timedCommChoices = getCommDisplayedChoices(
      spec,
      resolveCommAssistanceStage(elapsedPastWindow, true)
    );
    expect(tapChoices.length).toBe(spec.choices.length);
    expect(tapChoices.map((c) => c.id)).toEqual(spec.choices.map((c) => c.id));
    if (timedCommChoices.length !== spec.choices.length) {
      expect(tapChoices.length).toBeGreaterThan(timedCommChoices.length);
    }
  });

  it('responseWindowMs does not auto-highlight correct choice in tap-to-request model', () => {
    expect(resolveTapToRequestAssistanceStageForElapsed()).not.toBe(
      'direct_visual_assistance'
    );
  });

  it('correct tap then wait stays in awaiting_observer', () => {
    const spec = specForTrial(1);
    const correctId = spec.choices.find((c) => c.isCorrect)!.id;
    const tap = onChildTapChoice({
      phase: 'choosing',
      spec,
      choiceId: correctId,
      elapsedMs: 600,
    });
    expect(tap?.phase).toBe('awaiting_observer');
    expect(
      canCommitSessionTrial({ phase: tap!.phase, observerHasRecorded: false })
    ).toBe(false);
  });

  it('incorrect tap then wait stays in awaiting_observer', () => {
    const spec = specForTrial(1);
    const wrongId = spec.choices.find((c) => !c.isCorrect)!.id;
    const tap = onChildTapChoice({
      phase: 'choosing',
      spec,
      choiceId: wrongId,
      elapsedMs: 600,
    });
    expect(tap?.phase).toBe('awaiting_observer');
    expect(tap?.pending.source).toBe('child_tap');
    if (tap!.pending.source === 'child_tap') {
      expect(tap.pending.correct).toBe(false);
    }
  });

  it('responseWindowMs does not end trial (no auto-commit on timeout)', () => {
    expect(shouldCommitTrialOnResponseWindow()).toBe(false);
    const spec = specForTrial(1);
    expect(spec.responseWindowMs).toBeGreaterThan(0);
    expect(
      onChildTapChoice({
        phase: 'choosing',
        spec,
        choiceId: spec.choices[0]!.id,
        elapsedMs: spec.responseWindowMs + 5000,
      })?.phase
    ).toBe('awaiting_observer');
  });

  it('does not auto-advance when response window elapses without observer', () => {
    const spec = specForTrial(1);
    const correctId = spec.choices.find((c) => c.isCorrect)!.id;
    const tap = onChildTapChoice({
      phase: 'choosing',
      spec,
      choiceId: correctId,
      elapsedMs: spec.responseWindowMs + 1000,
    });
    expect(tap?.phase).toBe('awaiting_observer');
    expect(
      canCommitSessionTrial({ phase: tap!.phase, observerHasRecorded: false })
    ).toBe(false);
  });

  it('child choice without observer record does not produce session commit', () => {
    const spec = specForTrial(1);
    const correctId = spec.choices.find((c) => c.isCorrect)!.id;
    const tap = onChildTapChoice({
      phase: 'choosing',
      spec,
      choiceId: correctId,
      elapsedMs: 1200,
    });
    expect(tap).not.toBeNull();
    expect(
      buildOutcomeAfterObserverRecord({
        phase: 'awaiting_observer',
        pending: null,
        spec,
        observerLevel: 'independent',
        elapsedMsAtRecord: 2000,
      })
    ).toBeNull();
  });

  const humanLevels: PromptHierarchyLevel[] = [
    'independent',
    'gestural',
    'verbal',
    'partial_physical',
    'full_physical',
    'no_response',
  ];

  it.each(humanLevels.map((level) => [level]))(
    'observer level %s is stored as promptLevel',
    (level) => {
      const spec = specForTrial(1);
      const correctId = spec.choices.find((c) => c.isCorrect)!.id;
      const tap = onChildTapChoice({
        phase: 'choosing',
        spec,
        choiceId: correctId,
        elapsedMs: 800,
      });
      const recorded = buildOutcomeAfterObserverRecord({
        phase: 'awaiting_observer',
        pending: tap!.pending,
        spec,
        observerLevel: level,
        elapsedMsAtRecord: 1500,
      });
      expect(recorded?.outcome.promptLevel).toBe(level);
    }
  );

  it('correct answer with gestural prompt stays correct with non-independent promptLevel', () => {
    const spec = specForTrial(1);
    const correctId = spec.choices.find((c) => c.isCorrect)!.id;
    const outcome = resolveCommObserverTrialOutcome({
      spec,
      choiceId: correctId,
      observerPromptLevel: 'gestural',
      responseTimeMs: 900,
    });
    expect(outcome.correct).toBe(true);
    expect(outcome.promptLevel).toBe('gestural');
  });

  it('incorrect answer can still be recorded independent promptLevel', () => {
    const spec = specForTrial(1);
    const wrongId = spec.choices.find((c) => !c.isCorrect)!.id;
    const outcome = resolveCommObserverTrialOutcome({
      spec,
      choiceId: wrongId,
      observerPromptLevel: 'independent',
      responseTimeMs: 600,
    });
    expect(outcome.correct).toBe(false);
    expect(outcome.promptLevel).toBe('independent');
  });

  it('no_response uses elapsed at observer record when child did not tap', () => {
    const spec = specForTrial(1);
    const open = onObserverOpenRecording({ phase: 'choosing' });
    const recorded = buildOutcomeAfterObserverRecord({
      phase: 'awaiting_observer',
      pending: open!.pending,
      spec,
      observerLevel: 'no_response',
      elapsedMsAtRecord: 12_345,
    });
    expect(recorded?.outcome.promptLevel).toBe('no_response');
    expect(recorded?.outcome.correct).toBe(false);
    expect(recorded?.outcome.responseTimeMs).toBe(12_345);
  });

  it('next trial in session only after commitTrial (observer recorded)', () => {
    const bundle = beginCommChoiceSession({
      childId: 'child_test',
      chapterId: 'communication-language',
      media,
    });
    let session = startCommChoiceTrial(bundle.session);
    expect(session.trials.length).toBe(0);

    const spec = specForTrial(1);
    const correctId = spec.choices.find((c) => c.isCorrect)!.id;
    const tap = onChildTapChoice({
      phase: 'choosing',
      spec,
      choiceId: correctId,
      elapsedMs: 500,
    });
    const recorded = buildOutcomeAfterObserverRecord({
      phase: 'awaiting_observer',
      pending: tap!.pending,
      spec,
      observerLevel: 'independent',
      elapsedMsAtRecord: 900,
    });
    expect(
      canCommitSessionTrial({
        phase: recorded!.phase,
        observerHasRecorded: true,
      })
    ).toBe(true);

    session = commitCommChoiceTrial(session, recorded!.outcome);
    expect(session.trials.length).toBe(1);
    session = startCommChoiceTrial(session);
    expect(session.activeTrialNumber).toBe(2);
  });

  it('session does not finalize before all trials committed', () => {
    const bundle = beginCommChoiceSession({
      childId: 'child_test',
      chapterId: 'communication-language',
      media,
    });
    let session = startCommChoiceTrial(bundle.session);
    const targetCount = session.targetTrialCount;

    for (let n = 1; n < targetCount; n += 1) {
      const spec = specForTrial(n);
      const correctId = spec.choices.find((c) => c.isCorrect)!.id;
      const tap = onChildTapChoice({
        phase: 'choosing',
        spec,
        choiceId: correctId,
        elapsedMs: 400,
      });
      const recorded = buildOutcomeAfterObserverRecord({
        phase: 'awaiting_observer',
        pending: tap!.pending,
        spec,
        observerLevel: 'independent',
        elapsedMsAtRecord: 800,
      })!;
      session = commitCommChoiceTrial(session, recorded.outcome);
      expect(isCommChoiceSessionComplete(session)).toBe(false);
      session = startCommChoiceTrial(session);
    }

    const lastSpec = specForTrial(targetCount);
    const lastCorrect = lastSpec.choices.find((c) => c.isCorrect)!.id;
    const lastTap = onChildTapChoice({
      phase: 'choosing',
      spec: lastSpec,
      choiceId: lastCorrect,
      elapsedMs: 300,
    });
    const lastRecorded = buildOutcomeAfterObserverRecord({
      phase: 'awaiting_observer',
      pending: lastTap!.pending,
      spec: lastSpec,
      observerLevel: 'verbal',
      elapsedMsAtRecord: 700,
    })!;
    session = commitCommChoiceTrial(session, lastRecorded.outcome);
    expect(isCommChoiceSessionComplete(session)).toBe(true);
    session = finalizeCommChoiceSession(session);
    expect(session.trials.length).toBe(targetCount);
    expect(session.endedAt).toBeDefined();
  });
});

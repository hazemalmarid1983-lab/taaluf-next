import { loadAttentionFocusChapter } from '../lib/training/loadChapter';
import {
  requireTrainingMedia,
  resolveMediaRuntimeConfig,
} from '../lib/training/engine';
import type { ResolvedMediaConfig } from '../lib/training/engine/types';
import {
  buildWaitThenTouchTrialSpec,
  canTransitionWaitThenTouchPhase,
  controlLevelFromDifficulty,
  deriveWaitThenTouchSessionSeed,
  resolveControlLevel,
  resolveWaitThenTouchAssistanceStage,
  resolveWaitThenTouchRuntimeSettings,
  resolveWaitThenTouchTrialOutcome,
  WAIT_THEN_TOUCH_ASSISTANCE_SCHEDULE,
  WAIT_THEN_TOUCH_VALID_TRANSITIONS,
  waitDurationIncreasesWithControlLevel,
  waitDurationVariesAcrossTrials,
} from '../lib/training/waitThenTouchEngine';

describe('wait-then-touch engine', () => {
  const media = requireTrainingMedia(
    loadAttentionFocusChapter(),
    'wait-then-touch'
  );
  const runtimeConfig = resolveMediaRuntimeConfig(media);
  const settings = resolveWaitThenTouchRuntimeSettings(runtimeConfig);
  const sessionSeed = deriveWaitThenTouchSessionSeed('session-wait-touch');

  it('reads runtime settings from media config via difficulty → control level', () => {
    expect(settings.trialCount).toBe(10);
    expect(settings.difficulty).toBe(1);
    expect(settings.controlLevel).toBe(1);
    expect(settings.responseWindowMs).toBe(6000);
    expect(settings.prompting).toBe(true);
    expect(settings.goCueStyle).toBe('scale');
    expect(settings.itemPool).toBe('basic_shapes');
  });

  it('maps difficulty to control level deterministically', () => {
    expect(controlLevelFromDifficulty(1)).toBe(1);
    expect(controlLevelFromDifficulty(2)).toBe(3);
    expect(controlLevelFromDifficulty(3)).toBe(4);

    const cfg: ResolvedMediaConfig = {
      ...runtimeConfig,
      difficulty: 2,
      content: { ...runtimeConfig.content, controlLevel: undefined },
    };
    expect(resolveControlLevel(cfg)).toBe(3);
  });

  it('supports level 1 configuration — short wait, large target, no distractors', () => {
    const level1 = resolveWaitThenTouchRuntimeSettings({
      ...runtimeConfig,
      difficulty: 1,
    });
    const spec = buildWaitThenTouchTrialSpec(level1, 1, sessionSeed);

    expect(spec.controlLevel).toBe(1);
    expect(spec.waitDurationMs).toBe(1200);
    expect(spec.targetSizePx).toBeGreaterThanOrEqual(112);
    expect(spec.distractors).toHaveLength(0);
  });

  it('supports level 2 configuration — longer fixed wait', () => {
    const level2 = resolveWaitThenTouchRuntimeSettings({
      ...runtimeConfig,
      difficulty: 1,
      content: { ...runtimeConfig.content, controlLevel: 2 },
    });
    const spec = buildWaitThenTouchTrialSpec(level2, 2, sessionSeed);

    expect(spec.controlLevel).toBe(2);
    expect(spec.waitDurationMs).toBe(1800);
  });

  it('supports level 3 configuration — variable wait duration', () => {
    const level3 = resolveWaitThenTouchRuntimeSettings({
      ...runtimeConfig,
      difficulty: 2,
    });
    const spec = buildWaitThenTouchTrialSpec(level3, 3, sessionSeed);

    expect(spec.controlLevel).toBe(3);
    expect(spec.waitDurationMs).toBeGreaterThanOrEqual(1500);
    expect(spec.waitDurationMs).toBeLessThanOrEqual(2800);
    expect(waitDurationVariesAcrossTrials(3, sessionSeed, 6)).toBe(true);
  });

  it('supports level 4 configuration — distractors and longer variable wait', () => {
    const level4 = resolveWaitThenTouchRuntimeSettings({
      ...runtimeConfig,
      difficulty: 3,
    });
    const spec = buildWaitThenTouchTrialSpec(level4, 4, sessionSeed);

    expect(spec.controlLevel).toBe(4);
    expect(spec.distractors.length).toBe(2);
    expect(spec.distractors.every((d) => d.interactive === false)).toBe(true);
    expect(waitDurationIncreasesWithControlLevel(sessionSeed, 4)).toBe(true);
  });

  it('varies wait duration across session seeds at variable levels', () => {
    const level3 = resolveWaitThenTouchRuntimeSettings({
      ...runtimeConfig,
      difficulty: 2,
    });
    const seedA = deriveWaitThenTouchSessionSeed('child-alpha');
    const seedB = deriveWaitThenTouchSessionSeed('child-beta');
    const specA = buildWaitThenTouchTrialSpec(level3, 2, seedA);
    const specB = buildWaitThenTouchTrialSpec(level3, 2, seedB);

    expect(specA.waitDurationMs).not.toBe(specB.waitDurationMs);
  });

  it('defines explicit valid phase transitions', () => {
    expect(canTransitionWaitThenTouchPhase('ready', 'wait')).toBe(true);
    expect(canTransitionWaitThenTouchPhase('wait', 'go')).toBe(true);
    expect(canTransitionWaitThenTouchPhase('wait', 'feedback')).toBe(true);
    expect(canTransitionWaitThenTouchPhase('go', 'feedback')).toBe(true);
    expect(canTransitionWaitThenTouchPhase('ready', 'go')).toBe(false);
    expect(canTransitionWaitThenTouchPhase('feedback', 'wait')).toBe(false);
    expect(WAIT_THEN_TOUCH_VALID_TRANSITIONS.wait).toContain('feedback');
  });

  it('records correct post-GO response with GO→touch latency only', () => {
    const outcome = resolveWaitThenTouchTrialOutcome({
      promptingEnabled: true,
      outcomeKind: 'correct',
      responseLatencyMs: 850,
      goPhaseElapsedMs: 850,
      responseWindowMs: 6000,
    });

    expect(outcome.correct).toBe(true);
    expect(outcome.outcomeKind).toBe('correct');
    expect(outcome.responseTimeMs).toBe(850);
    expect(outcome.promptLevel).toBe('independent');
  });

  it('records premature response honestly without TrainingTrial schema change', () => {
    const outcome = resolveWaitThenTouchTrialOutcome({
      promptingEnabled: true,
      outcomeKind: 'premature',
      waitElapsedMs: 640,
      responseWindowMs: 6000,
    });

    expect(outcome.correct).toBe(false);
    expect(outcome.outcomeKind).toBe('premature');
    expect(outcome.responseTimeMs).toBe(640);
    expect(outcome.promptLevel).toBe('independent');
    expect(outcome.promptLevel).not.toBe('no_response');
  });

  it('records timeout as no_response', () => {
    const outcome = resolveWaitThenTouchTrialOutcome({
      promptingEnabled: true,
      outcomeKind: 'timeout',
      goPhaseElapsedMs: 6000,
      responseWindowMs: 6000,
    });

    expect(outcome.correct).toBe(false);
    expect(outcome.outcomeKind).toBe('timeout');
    expect(outcome.promptLevel).toBe('no_response');
    expect(outcome.responseTimeMs).toBe(6000);
  });

  it('documents premature responseTimeMs is not comparable to correct latency', () => {
    const correct = resolveWaitThenTouchTrialOutcome({
      promptingEnabled: true,
      outcomeKind: 'correct',
      responseLatencyMs: 900,
      goPhaseElapsedMs: 900,
      responseWindowMs: 6000,
    });
    const premature = resolveWaitThenTouchTrialOutcome({
      promptingEnabled: true,
      outcomeKind: 'premature',
      waitElapsedMs: 900,
      responseWindowMs: 6000,
    });

    expect(correct.responseTimeMs).toBe(premature.responseTimeMs);
    expect(correct.correct).toBe(true);
    expect(premature.correct).toBe(false);
    expect(premature.outcomeKind).toBe('premature');
  });

  it('assigns assistance from GO phase only — not from latency alone before stages', () => {
    expect(resolveWaitThenTouchAssistanceStage(1000, true)).toBe('none');
    expect(resolveWaitThenTouchAssistanceStage(2500, true)).toBe('visual_hint');
    expect(resolveWaitThenTouchAssistanceStage(5000, true)).toBe(
      'direct_visual_assistance'
    );
    expect(WAIT_THEN_TOUCH_ASSISTANCE_SCHEDULE.reducedChoicesMs).toBeUndefined();
  });

  it('maps slow correct GO response to assistance delivered', () => {
    const outcome = resolveWaitThenTouchTrialOutcome({
      promptingEnabled: true,
      outcomeKind: 'correct',
      responseLatencyMs: 5200,
      goPhaseElapsedMs: 5200,
      responseWindowMs: 6000,
    });

    expect(outcome.promptLevel).toBe('direct_visual_assistance');
  });

  it('higher difficulty increases control demand', () => {
    const easy = resolveWaitThenTouchRuntimeSettings({
      ...runtimeConfig,
      difficulty: 1,
    });
    const hard = resolveWaitThenTouchRuntimeSettings({
      ...runtimeConfig,
      difficulty: 3,
    });

    expect(hard.controlLevel).toBeGreaterThan(easy.controlLevel);
    const easySpec = buildWaitThenTouchTrialSpec(easy, 1, sessionSeed);
    const hardSpec = buildWaitThenTouchTrialSpec(hard, 1, sessionSeed);

    expect(hardSpec.waitDurationMs).toBeGreaterThanOrEqual(easySpec.waitDurationMs);
    expect(hardSpec.distractors.length).toBeGreaterThan(easySpec.distractors.length);
    expect(hardSpec.targetSizePx).toBeLessThanOrEqual(easySpec.targetSizePx);
  });

  it('prevents duplicate outcome recording contract', () => {
    const first = resolveWaitThenTouchTrialOutcome({
      promptingEnabled: true,
      outcomeKind: 'correct',
      responseLatencyMs: 700,
      goPhaseElapsedMs: 700,
      responseWindowMs: 6000,
    });
    const second = resolveWaitThenTouchTrialOutcome({
      promptingEnabled: true,
      outcomeKind: 'correct',
      responseLatencyMs: 700,
      goPhaseElapsedMs: 700,
      responseWindowMs: 6000,
    });

    expect(first).toEqual(second);
  });
});

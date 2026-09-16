import { loadAttentionFocusChapter } from '../lib/training/loadChapter';
import {
  requireTrainingMedia,
  resolveMediaRuntimeConfig,
} from '../lib/training/engine';
import {
  buildWhereDidItGoTrialSpec,
  getWhereDidItGoDisplayedLocations,
  isWhereDidItGoSelectionCorrect,
  memoryLevelFromDifficulty,
  MEMORY_LEVEL_LOCATION_COUNT,
  resolveMemoryLevel,
  resolveWhereDidItGoAssistanceStage,
  resolveWhereDidItGoRuntimeSettings,
  resolveWhereDidItGoTrialOutcome,
  WHERE_DID_IT_GO_ASSISTANCE_SCHEDULE,
} from '../lib/training/whereDidItGoEngine';
import type { ResolvedMediaConfig } from '../lib/training/engine/types';

describe('where-did-it-go engine', () => {
  const media = requireTrainingMedia(
    loadAttentionFocusChapter(),
    'where-did-it-go'
  );
  const runtimeConfig = resolveMediaRuntimeConfig(media);
  const settings = resolveWhereDidItGoRuntimeSettings(runtimeConfig);

  it('reads runtime settings from media config via difficulty → memory level', () => {
    expect(settings.trialCount).toBe(8);
    expect(settings.difficulty).toBe(1);
    expect(settings.memoryLevel).toBe(1);
    expect(settings.locationCount).toBe(2);
    expect(settings.displayDurationMs).toBe(2400);
    expect(settings.hideDurationMs).toBe(1100);
    expect(settings.chooseWindowMs).toBe(8000);
    expect(settings.prompting).toBe(true);
    expect(settings.hideAnimation).toBe('fade');
  });

  it('supports memory levels 1–6 location counts', () => {
    expect(MEMORY_LEVEL_LOCATION_COUNT[1]).toBe(2);
    expect(MEMORY_LEVEL_LOCATION_COUNT[2]).toBe(3);
    expect(MEMORY_LEVEL_LOCATION_COUNT[4]).toBe(4);
    expect(MEMORY_LEVEL_LOCATION_COUNT[6]).toBe(4);
  });

  it('builds level 1 trial with two distinct locations', () => {
    const level1Settings = resolveWhereDidItGoRuntimeSettings({
      ...runtimeConfig,
      difficulty: 1,
      choices: 2,
    });
    const spec = buildWhereDidItGoTrialSpec(level1Settings, 1);

    expect(spec.locations).toHaveLength(2);
    expect(spec.locations.filter((l) => l.isCorrect)).toHaveLength(1);
    expect(spec.observeLocation.id).toBe(spec.correctLocationId);
    expect(spec.memoryLevel).toBe(1);
  });

  it('builds level 3 trial with three locations from difficulty 2', () => {
    const level3Settings = resolveWhereDidItGoRuntimeSettings({
      ...runtimeConfig,
      difficulty: 2,
      choices: 3,
    });
    const spec = buildWhereDidItGoTrialSpec(level3Settings, 3);

    expect(spec.locations).toHaveLength(3);
    expect(spec.memoryLevel).toBe(3);
  });

  it('detects correct and incorrect location selections', () => {
    const spec = buildWhereDidItGoTrialSpec(settings, 1);
    const correct = spec.locations.find((l) => l.isCorrect)!;
    const incorrect = spec.locations.find((l) => !l.isCorrect)!;

    expect(isWhereDidItGoSelectionCorrect(correct.id, spec)).toBe(true);
    expect(isWhereDidItGoSelectionCorrect(incorrect.id, spec)).toBe(false);
  });

  it('measures response time as observe + hide + choose elapsed', () => {
    const spec = buildWhereDidItGoTrialSpec(settings, 1);
    const correct = spec.locations.find((l) => l.isCorrect)!;

    const outcome = resolveWhereDidItGoTrialOutcome({
      promptingEnabled: true,
      selected: true,
      locationChoiceId: correct.id,
      spec,
      chooseElapsedMs: 1200,
    });

    expect(outcome.responseTimeMs).toBe(2400 + 1100 + 1200);
    expect(outcome.correct).toBe(true);
  });

  it('slow choose without assistance → independent', () => {
    const spec = buildWhereDidItGoTrialSpec(settings, 1);
    const correct = spec.locations.find((l) => l.isCorrect)!;

    const outcome = resolveWhereDidItGoTrialOutcome({
      promptingEnabled: true,
      selected: true,
      locationChoiceId: correct.id,
      spec,
      chooseElapsedMs: 2000,
    });

    expect(outcome.promptLevel).toBe('independent');
  });

  it('choose after visual hint stage → visual_hint', () => {
    const spec = buildWhereDidItGoTrialSpec(settings, 1);
    const correct = spec.locations.find((l) => l.isCorrect)!;

    const outcome = resolveWhereDidItGoTrialOutcome({
      promptingEnabled: true,
      selected: true,
      locationChoiceId: correct.id,
      spec,
      chooseElapsedMs: 3000,
    });

    expect(outcome.promptLevel).toBe('visual_hint');
  });

  it('choose after reduced choices stage → reduced_choices', () => {
    const level3Settings = resolveWhereDidItGoRuntimeSettings({
      ...runtimeConfig,
      difficulty: 2,
      choices: 3,
    });
    const spec = buildWhereDidItGoTrialSpec(level3Settings, 2);
    const correct = spec.locations.find((l) => l.isCorrect)!;

    expect(
      getWhereDidItGoDisplayedLocations(spec, 'reduced_choices').length
    ).toBeLessThan(spec.locations.length);

    const outcome = resolveWhereDidItGoTrialOutcome({
      promptingEnabled: true,
      selected: true,
      locationChoiceId: correct.id,
      spec,
      chooseElapsedMs: 5000,
    });

    expect(outcome.promptLevel).toBe('reduced_choices');
  });

  it('choose after direct visual assistance → direct_visual_assistance', () => {
    const spec = buildWhereDidItGoTrialSpec(settings, 1);
    const correct = spec.locations.find((l) => l.isCorrect)!;

    const outcome = resolveWhereDidItGoTrialOutcome({
      promptingEnabled: true,
      selected: true,
      locationChoiceId: correct.id,
      spec,
      chooseElapsedMs: 7000,
    });

    expect(outcome.promptLevel).toBe('direct_visual_assistance');
  });

  it('timeout → no_response', () => {
    const spec = buildWhereDidItGoTrialSpec(settings, 1);

    expect(
      resolveWhereDidItGoTrialOutcome({
        promptingEnabled: true,
        selected: false,
        spec,
        chooseElapsedMs: 8000,
      }).promptLevel
    ).toBe('no_response');
  });

  it('incorrect before assistance → independent not verbal', () => {
    const spec = buildWhereDidItGoTrialSpec(settings, 1);
    const incorrect = spec.locations.find((l) => !l.isCorrect)!;

    const outcome = resolveWhereDidItGoTrialOutcome({
      promptingEnabled: true,
      selected: true,
      locationChoiceId: incorrect.id,
      spec,
      chooseElapsedMs: 900,
    });

    expect(outcome.correct).toBe(false);
    expect(outcome.promptLevel).toBe('independent');
  });

  it('derives memory level from difficulty when not explicit', () => {
    const cfg1: ResolvedMediaConfig = {
      ...runtimeConfig,
      content: { ...runtimeConfig.content, memoryLevel: undefined },
      difficulty: 1,
    };
    const cfg2: ResolvedMediaConfig = {
      ...cfg1,
      difficulty: 2,
    };
    const cfg3: ResolvedMediaConfig = {
      ...cfg1,
      difficulty: 3,
    };

    expect(resolveMemoryLevel(cfg1)).toBe(1);
    expect(resolveMemoryLevel(cfg2)).toBe(3);
    expect(resolveMemoryLevel(cfg3)).toBe(4);
    expect(memoryLevelFromDifficulty(1)).toBe(1);
    expect(memoryLevelFromDifficulty(2)).toBe(3);
    expect(memoryLevelFromDifficulty(3)).toBe(4);
  });

  it('ignores matchLevel — not a where-did-it-go config field', () => {
    const withMatchLevel: ResolvedMediaConfig = {
      ...runtimeConfig,
      matchLevel: 6,
      difficulty: 1,
      content: { ...runtimeConfig.content, memoryLevel: undefined },
    };

    expect(resolveMemoryLevel(withMatchLevel)).toBe(1);
  });

  it('higher difficulty produces harder observe/hide timing', () => {
    const easy = resolveWhereDidItGoRuntimeSettings({
      ...runtimeConfig,
      difficulty: 1,
    });
    const hard = resolveWhereDidItGoRuntimeSettings({
      ...runtimeConfig,
      difficulty: 3,
    });

    expect(hard.memoryLevel).toBeGreaterThan(easy.memoryLevel);
    expect(hard.displayDurationMs).toBeLessThanOrEqual(easy.displayDurationMs);
    expect(hard.hideDurationMs).toBeGreaterThan(easy.hideDurationMs);
  });

  it('JSON display/hide durations do not override level-based progression', () => {
    const overridden = resolveWhereDidItGoRuntimeSettings({
      ...runtimeConfig,
      difficulty: 1,
      displayDurationMs: 999,
      hideDurationMs: 888,
    });

    expect(overridden.displayDurationMs).toBe(2400);
    expect(overridden.hideDurationMs).toBe(1100);
  });

  it('escalates assistance from choose phase timing only', () => {
    expect(
      resolveWhereDidItGoAssistanceStage(1000, true)
    ).toBe('none');
    expect(
      resolveWhereDidItGoAssistanceStage(3000, true)
    ).toBe('visual_hint');
    expect(WHERE_DID_IT_GO_ASSISTANCE_SCHEDULE.visualHintMs).toBe(2800);
  });

  it('prevents duplicate outcome recording contract', () => {
    const spec = buildWhereDidItGoTrialSpec(settings, 1);
    const correct = spec.locations.find((l) => l.isCorrect)!;

    const first = resolveWhereDidItGoTrialOutcome({
      promptingEnabled: true,
      selected: true,
      locationChoiceId: correct.id,
      spec,
      chooseElapsedMs: 800,
    });

    const second = resolveWhereDidItGoTrialOutcome({
      promptingEnabled: true,
      selected: true,
      locationChoiceId: correct.id,
      spec,
      chooseElapsedMs: 800,
    });

    expect(first).toEqual(second);
  });
});

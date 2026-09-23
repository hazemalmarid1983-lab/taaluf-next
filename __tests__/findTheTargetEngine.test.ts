import { loadAttentionFocusChapter } from '../lib/training/loadChapter';
import {
  requireTrainingMedia,
  resolveMediaRuntimeConfig,
} from '../lib/training/engine';
import type { ResolvedMediaConfig } from '../lib/training/engine/types';
import {
  buildFindTheTargetTrialSpec,
  deriveFindTheTargetFieldSeed,
  FIND_THE_TARGET_ASSISTANCE_SCHEDULE,
  getFindTheTargetDisplayedItems,
  getFindTheTargetHintRegion,
  getFindTheTargetTargetSlotIndex,
  isFindTheTargetSelectionCorrect,
  resolveFindTheTargetAssistanceStage,
  resolveFindTheTargetRuntimeSettings,
  resolveFindTheTargetTrialOutcome,
  resolveSearchLevel,
  searchLevelFromDifficulty,
  SEARCH_LEVEL_ITEM_COUNT,
} from '../lib/training/findTheTargetEngine';

describe('find-the-target engine', () => {
  const media = requireTrainingMedia(
    loadAttentionFocusChapter(),
    'find-the-target'
  );
  const runtimeConfig = resolveMediaRuntimeConfig(media);
  const settings = resolveFindTheTargetRuntimeSettings(runtimeConfig);
  const fieldSeed = deriveFindTheTargetFieldSeed('session-find-target');

  it('reads runtime settings from media config via difficulty → search level', () => {
    expect(settings.trialCount).toBe(10);
    expect(settings.difficulty).toBe(1);
    expect(settings.searchLevel).toBe(1);
    expect(settings.itemCount).toBe(2);
    expect(settings.targetPreviewMs).toBe(2400);
    expect(settings.searchWindowMs).toBe(10000);
    expect(settings.prompting).toBe(true);
    expect(settings.itemPool).toBe('basic_shapes');
  });

  it('maps difficulty to search level deterministically', () => {
    expect(searchLevelFromDifficulty(1)).toBe(1);
    expect(searchLevelFromDifficulty(2)).toBe(3);
    expect(searchLevelFromDifficulty(3)).toBe(4);

    const cfg: ResolvedMediaConfig = {
      ...runtimeConfig,
      difficulty: 2,
      content: { ...runtimeConfig.content, searchLevel: undefined },
    };
    expect(resolveSearchLevel(cfg)).toBe(3);
  });

  it('supports level 1 configuration — 2 items, large size', () => {
    const level1 = resolveFindTheTargetRuntimeSettings({
      ...runtimeConfig,
      difficulty: 1,
    });
    const spec = buildFindTheTargetTrialSpec(level1, 1, fieldSeed);

    expect(spec.searchLevel).toBe(1);
    expect(spec.fieldItems).toHaveLength(2);
    expect(spec.itemSizePx).toBeGreaterThanOrEqual(104);
    expect(spec.fieldItems.filter((item) => item.isTarget)).toHaveLength(1);
  });

  it('supports level 2 configuration — 3 items', () => {
    const level2 = resolveFindTheTargetRuntimeSettings({
      ...runtimeConfig,
      difficulty: 1,
      content: { ...runtimeConfig.content, searchLevel: 2 },
    });
    const spec = buildFindTheTargetTrialSpec(level2, 2, fieldSeed);

    expect(spec.searchLevel).toBe(2);
    expect(spec.fieldItems).toHaveLength(SEARCH_LEVEL_ITEM_COUNT[2]);
  });

  it('supports level 3 configuration — 4 items with similar distractors possible', () => {
    const level3 = resolveFindTheTargetRuntimeSettings({
      ...runtimeConfig,
      difficulty: 2,
    });
    const spec = buildFindTheTargetTrialSpec(level3, 3, fieldSeed);

    expect(spec.searchLevel).toBe(3);
    expect(spec.fieldItems).toHaveLength(4);
  });

  it('supports level 4 configuration — 5–6 items', () => {
    const level4 = resolveFindTheTargetRuntimeSettings({
      ...runtimeConfig,
      difficulty: 3,
    });
    const specA = buildFindTheTargetTrialSpec(level4, 1, fieldSeed);
    const specB = buildFindTheTargetTrialSpec(level4, 4, fieldSeed);

    expect(specA.searchLevel).toBe(4);
    expect(specA.fieldItems.length).toBeGreaterThanOrEqual(5);
    expect(specA.fieldItems.length).toBeLessThanOrEqual(6);
    expect(specB.fieldItems.length).toBeGreaterThanOrEqual(5);
    expect(specB.fieldItems.length).toBeLessThanOrEqual(6);
  });

  it('generates target and distractors with exactly one valid target', () => {
    const spec = buildFindTheTargetTrialSpec(settings, 1, fieldSeed);
    const targets = spec.fieldItems.filter((item) => item.isTarget);

    expect(targets).toHaveLength(1);
    expect(spec.targetItemId).toBe(targets[0].id);
  });

  it('detects correct and incorrect selections', () => {
    const spec = buildFindTheTargetTrialSpec(settings, 1, fieldSeed);
    const target = spec.fieldItems.find((item) => item.isTarget)!;
    const distractor = spec.fieldItems.find((item) => !item.isTarget)!;

    expect(isFindTheTargetSelectionCorrect(target.id, spec)).toBe(true);
    expect(isFindTheTargetSelectionCorrect(distractor.id, spec)).toBe(false);
  });

  it('varies target position across trials without trialNumber % N pattern', () => {
    const slots = Array.from({ length: 8 }, (_, index) =>
      getFindTheTargetTargetSlotIndex(
        buildFindTheTargetTrialSpec(settings, index + 1, fieldSeed)
      )
    );

    expect(new Set(slots).size).toBeGreaterThan(1);
    expect(slots[0]).not.toBe(slots[1]);
  });

  it('varies field layout across session seeds', () => {
    const seedA = deriveFindTheTargetFieldSeed('child-alpha');
    const seedB = deriveFindTheTargetFieldSeed('child-beta');
    const specA = buildFindTheTargetTrialSpec(settings, 1, seedA);
    const specB = buildFindTheTargetTrialSpec(settings, 1, seedB);

    const posA = specA.fieldItems.map((item) => `${item.x},${item.y}`).join('|');
    const posB = specB.fieldItems.map((item) => `${item.x},${item.y}`).join('|');

    expect(posA).not.toBe(posB);
  });

  it('records responseTimeMs as search latency only', () => {
    const spec = buildFindTheTargetTrialSpec(settings, 1, fieldSeed);
    const target = spec.fieldItems.find((item) => item.isTarget)!;

    const outcome = resolveFindTheTargetTrialOutcome({
      promptingEnabled: true,
      selected: true,
      fieldItemId: target.id,
      spec,
      searchElapsedMs: 1800,
    });

    expect(outcome.responseTimeMs).toBe(1800);
    expect(outcome.correct).toBe(true);
  });

  it('timeout → no_response', () => {
    const spec = buildFindTheTargetTrialSpec(settings, 1, fieldSeed);

    expect(
      resolveFindTheTargetTrialOutcome({
        promptingEnabled: true,
        selected: false,
        spec,
        searchElapsedMs: 10000,
      }).promptLevel
    ).toBe('no_response');
  });

  it('assigns prompt levels from assistance delivered during search', () => {
    const spec = buildFindTheTargetTrialSpec(settings, 1, fieldSeed);
    const target = spec.fieldItems.find((item) => item.isTarget)!;

    expect(
      resolveFindTheTargetTrialOutcome({
        promptingEnabled: true,
        selected: true,
        fieldItemId: target.id,
        spec,
        searchElapsedMs: 1200,
      }).promptLevel
    ).toBe('independent');

    expect(
      resolveFindTheTargetTrialOutcome({
        promptingEnabled: true,
        selected: true,
        fieldItemId: target.id,
        spec,
        searchElapsedMs: 3500,
      }).promptLevel
    ).toBe('visual_hint');

    expect(
      resolveFindTheTargetTrialOutcome({
        promptingEnabled: true,
        selected: true,
        fieldItemId: target.id,
        spec,
        searchElapsedMs: 5600,
      }).promptLevel
    ).toBe('reduced_choices');

    expect(
      resolveFindTheTargetTrialOutcome({
        promptingEnabled: true,
        selected: true,
        fieldItemId: target.id,
        spec,
        searchElapsedMs: 8000,
      }).promptLevel
    ).toBe('direct_visual_assistance');
  });

  it('escalates assistance from search phase timing only', () => {
    expect(resolveFindTheTargetAssistanceStage(1000, true)).toBe('none');
    expect(resolveFindTheTargetAssistanceStage(3500, true)).toBe('visual_hint');
    expect(FIND_THE_TARGET_ASSISTANCE_SCHEDULE.visualHintMs).toBe(3000);
  });

  it('reduces visible items at reduced_choices stage', () => {
    const level3 = resolveFindTheTargetRuntimeSettings({
      ...runtimeConfig,
      difficulty: 2,
    });
    const spec = buildFindTheTargetTrialSpec(level3, 2, fieldSeed);

    expect(
      getFindTheTargetDisplayedItems(spec, 'reduced_choices').length
    ).toBeLessThan(spec.fieldItems.length);
  });

  it('exposes hint region at visual_hint without removing items', () => {
    const spec = buildFindTheTargetTrialSpec(settings, 1, fieldSeed);
    const region = getFindTheTargetHintRegion(spec, 'visual_hint');

    expect(region).toBeTruthy();
    expect(getFindTheTargetDisplayedItems(spec, 'visual_hint')).toHaveLength(
      spec.fieldItems.length
    );
  });

  it('higher difficulty increases search demand', () => {
    const easy = resolveFindTheTargetRuntimeSettings({
      ...runtimeConfig,
      difficulty: 1,
    });
    const hard = resolveFindTheTargetRuntimeSettings({
      ...runtimeConfig,
      difficulty: 3,
    });

    expect(hard.searchLevel).toBeGreaterThan(easy.searchLevel);
    expect(hard.targetPreviewMs).toBeLessThan(easy.targetPreviewMs);
    expect(hard.itemCount).toBeGreaterThan(easy.itemCount);
  });

  it('prevents duplicate outcome recording contract', () => {
    const spec = buildFindTheTargetTrialSpec(settings, 1, fieldSeed);
    const target = spec.fieldItems.find((item) => item.isTarget)!;

    const first = resolveFindTheTargetTrialOutcome({
      promptingEnabled: true,
      selected: true,
      fieldItemId: target.id,
      spec,
      searchElapsedMs: 900,
    });

    const second = resolveFindTheTargetTrialOutcome({
      promptingEnabled: true,
      selected: true,
      fieldItemId: target.id,
      spec,
      searchElapsedMs: 900,
    });

    expect(first).toEqual(second);
  });
});

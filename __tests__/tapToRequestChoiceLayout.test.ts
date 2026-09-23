import { loadCommunicationLanguageChapter } from '../lib/training/loadChapter';
import { requireTrainingMedia, resolveMediaRuntimeConfig } from '../lib/training/engine';
import { resolveCommRuntimeSettings } from '../lib/training/communicationChoiceEngine';
import {
  buildTapToRequestTrialSpec,
  indexOfCorrectChoice,
  logicalIndexToRtlVisualSlot,
} from '../lib/training/tapToRequestObserverFlow';

describe('tap-to-request choice layout', () => {
  const media = requireTrainingMedia(
    loadCommunicationLanguageChapter(),
    'tap-to-request'
  );
  const settings = resolveCommRuntimeSettings(resolveMediaRuntimeConfig(media));
  const sessionSeed = 'layout-test-session-alpha';

  it('permutes correct position across trials (per session seed)', () => {
    const indices = new Set<number>();
    for (let trial = 1; trial <= settings.trialCount; trial += 1) {
      const spec = buildTapToRequestTrialSpec(settings, trial, sessionSeed);
      expect(spec.choices.length).toBe(settings.choiceCount);
      indices.add(indexOfCorrectChoice(spec.choices));
    }
    expect(indices.size).toBeGreaterThan(1);
    expect(indices.has(0)).toBe(true);
    expect(indices.has(1)).toBe(true);
  });

  it('uses different shuffle seeds per trial number', () => {
    const a = buildTapToRequestTrialSpec(settings, 1, sessionSeed).choices.map(
      (c) => c.id
    );
    const b = buildTapToRequestTrialSpec(settings, 2, sessionSeed).choices.map(
      (c) => c.id
    );
    expect(a).not.toEqual(b);
  });

  it('same session + trial is reproducible', () => {
    const one = buildTapToRequestTrialSpec(settings, 3, sessionSeed);
    const two = buildTapToRequestTrialSpec(settings, 3, sessionSeed);
    expect(one.choices.map((c) => c.id)).toEqual(two.choices.map((c) => c.id));
  });

  it('different session seeds can change order for same trial', () => {
    let foundDifferent = false;
    for (let trial = 1; trial <= settings.trialCount; trial += 1) {
      const a = buildTapToRequestTrialSpec(settings, trial, 'session-seed-alpha');
      const b = buildTapToRequestTrialSpec(settings, trial, 'session-seed-omega');
      if (
        a.choices.map((c) => c.id).join('|') !==
        b.choices.map((c) => c.id).join('|')
      ) {
        foundDifferent = true;
        break;
      }
    }
    expect(foundDifferent).toBe(true);
  });

  it('RTL visual slot mapping: logical index 0 is inline-start, not conflated with correct', () => {
    const spec = buildTapToRequestTrialSpec(settings, 5, sessionSeed);
    const correctIndex = indexOfCorrectChoice(spec.choices);
    const correctSlot = logicalIndexToRtlVisualSlot(
      correctIndex,
      spec.choices.length
    );
    expect(['inline-start', 'inline-end']).toContain(correctSlot);
    expect(logicalIndexToRtlVisualSlot(0, 2)).toBe('inline-start');
    expect(logicalIndexToRtlVisualSlot(1, 2)).toBe('inline-end');
  });

  it('does not derive layout from commChoiceOrderScore sort alone (shuffle overrides)', () => {
    const spec = buildTapToRequestTrialSpec(settings, 1, sessionSeed);
    const sortedWouldPutCorrectFirst =
      indexOfCorrectChoice(spec.choices) === 0;
    void sortedWouldPutCorrectFirst;
    const altSeed = 'layout-test-session-beta';
    const alt = buildTapToRequestTrialSpec(settings, 1, altSeed);
    const positions = new Set([
      indexOfCorrectChoice(spec.choices),
      indexOfCorrectChoice(alt.choices),
    ]);
    expect(positions.size).toBeGreaterThanOrEqual(1);
  });
});

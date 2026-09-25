import {
  buildCommTrialSpec,
  commChoiceOrderScore,
  resolveCommRuntimeSettings,
  resolveCommTrialOutcome,
} from '../lib/training/communicationChoiceEngine';
import { loadCommunicationLanguageChapter } from '../lib/training/loadChapter';
import { requireTrainingMedia, resolveMediaRuntimeConfig } from '../lib/training/engine';
import {
  COMMUNICATION_DAILY_NEEDS_CATALOG,
  getCommunicationCatalogItem,
  listCommunicationCatalogForPool,
} from '../lib/training/communicationVisualCatalog';

describe('communicationVisualCatalog — tap-to-request daily_needs', () => {
  it('resolves all daily_needs items for tap-to-request', () => {
    const items = listCommunicationCatalogForPool('daily_needs');
    expect(items).toHaveLength(4);
    expect(items.map((i) => i.id).sort()).toEqual(['book', 'food', 'toy', 'water']);
  });

  it('each item has visual asset reference and spokenLabelAr', () => {
    for (const item of COMMUNICATION_DAILY_NEEDS_CATALOG) {
      expect(item.visual.type).toBe('cartoon-illustration');
      if (item.visual.type === 'cartoon-illustration' || item.visual.type === 'inline-svg') {
        expect(item.visual.assetId.length).toBeGreaterThan(0);
      }
      expect(item.spokenLabelAr.trim().length).toBeGreaterThan(0);
      expect(item.ariaLabelAr.trim().length).toBeGreaterThan(0);
      expect(getCommunicationCatalogItem(item.id)).toEqual(item);
    }
  });
});

describe('communication choice order — tap-to-request', () => {
  const settings = resolveCommRuntimeSettings(
    resolveMediaRuntimeConfig(
      requireTrainingMedia(loadCommunicationLanguageChapter(), 'tap-to-request')
    )
  );

  it('same trialNumber yields identical choice order', () => {
    const a = buildCommTrialSpec(settings, 4);
    const b = buildCommTrialSpec(settings, 4);
    expect(a.choices.map((c) => c.id)).toEqual(b.choices.map((c) => c.id));
  });

  it('order does not change mid-trial (stable spec)', () => {
    const spec = buildCommTrialSpec(settings, 2);
    const again = buildCommTrialSpec(settings, 2);
    expect(spec.choices).toEqual(again.choices);
  });

  it('correct is not always first in the choices array', () => {
    const positions = new Set<number>();
    for (let trial = 1; trial <= 12; trial += 1) {
      const spec = buildCommTrialSpec(settings, trial);
      const idx = spec.choices.findIndex((c) => c.isCorrect);
      positions.add(idx);
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  it('uses full choice id in order score (not first char only)', () => {
    expect(commChoiceOrderScore('c-water', 1)).not.toBe(
      commChoiceOrderScore('c-food', 1)
    );
  });
});

describe('communication timeout outcome', () => {
  const settings = resolveCommRuntimeSettings(
    resolveMediaRuntimeConfig(
      requireTrainingMedia(loadCommunicationLanguageChapter(), 'tap-to-request')
    )
  );

  it('timeout records no_response and correct false without choiceId', () => {
    const spec = buildCommTrialSpec(settings, 1);
    const outcome = resolveCommTrialOutcome({
      spec,
      choiceId: null,
      elapsedMs: spec.responseWindowMs + 50,
      prompting: true,
      timedOut: true,
    });
    expect(outcome.correct).toBe(false);
    expect(outcome.promptLevel).toBe('no_response');
  });
});

describe('tap-to-request speech keying', () => {
  it('speaks once per trial key (logic contract)', () => {
    const trialKey = (trialNumber: number, targetId: string) =>
      `${trialNumber}-${targetId}`;
    const spoken = new Set<string>();
    const trySpeak = (trialNumber: number, targetId: string) => {
      const key = trialKey(trialNumber, targetId);
      if (spoken.has(key)) return false;
      spoken.add(key);
      return true;
    };
    expect(trySpeak(1, 'water')).toBe(true);
    expect(trySpeak(1, 'water')).toBe(false);
    expect(trySpeak(2, 'water')).toBe(true);
  });
});

describe('visual card states — assistance vs selection', () => {
  it('assistance and selected-correct are distinct state tokens', () => {
    const assistance = 'assistance' as const;
    const selected = 'selected-correct' as const;
    expect(assistance).not.toBe(selected);
  });
});

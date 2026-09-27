import { calculateGeneralizationIndex } from '../lib/generalizationIndex';
import {
  GENERALIZATION_PROBES_STORAGE_KEY,
  buildGeneralizationProbe,
  loadGeneralizationProbes,
  saveGeneralizationProbe,
} from '../lib/generalizationProbeStore';

const store = new Map<string, string>();
beforeAll(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
    },
  });
});
beforeEach(() => store.clear());

const ctx = (probeId: string, goalId = 'g1') => ({
  goalId,
  reportedBy: 'professional' as const,
  probeId,
  now: new Date('2026-03-01T10:00:00Z'),
});

describe('buildGeneralizationProbe', () => {
  it('requires a dimension, independence and prompt level', () => {
    expect(buildGeneralizationProbe({}, ctx('p'))).toEqual({
      ok: false,
      errors: ['DIMENSION_REQUIRED', 'INDEPENDENCE_REQUIRED', 'PROMPT_REQUIRED'],
    });
  });

  it('requires the detail that matches the dimension', () => {
    const base = { independencePct: 90, promptLevel: 'Independent' as const };
    expect(buildGeneralizationProbe({ ...base, dimension: 'person' }, ctx('p'))).toMatchObject({
      errors: ['PERSON_REQUIRED'],
    });
    expect(buildGeneralizationProbe({ ...base, dimension: 'place' }, ctx('p'))).toMatchObject({
      errors: ['SETTING_REQUIRED'],
    });
    expect(buildGeneralizationProbe({ ...base, dimension: 'material_stimulus' }, ctx('p'))).toMatchObject({
      errors: ['MATERIAL_REQUIRED'],
    });
  });

  it('builds a probe and reports whether it tests a novel condition', () => {
    const novel = buildGeneralizationProbe(
      { dimension: 'place', setting: 'home', independencePct: '90', promptLevel: 'Independent', isFirstTrialColdProbe: true },
      ctx('p1')
    );
    expect(novel).toMatchObject({
      ok: true,
      countsTowardIndex: true,
      probe: { probe_id: 'p1', goal_id: 'g1', dimension: 'place', independence_pct: 90, is_first_trial_cold_probe: true },
    });

    const clinic = buildGeneralizationProbe(
      { dimension: 'place', setting: 'clinic', independencePct: 100, promptLevel: 'Independent' },
      ctx('p2')
    );
    expect(clinic.ok && clinic.countsTowardIndex).toBe(false);
  });

  it('records parent reports as parent_report', () => {
    const r = buildGeneralizationProbe(
      { dimension: 'person', personType: 'parent', independencePct: 70, promptLevel: 'Verbal' },
      { goalId: 'g1', reportedBy: 'parent_report' }
    );
    expect(r.ok && r.probe.reported_by).toBe('parent_report');
  });
});

describe('probe storage', () => {
  const save = (id: string, dimension: 'person' | 'place' | 'material_stimulus', goalId = 'g1') => {
    const input =
      dimension === 'person'
        ? { personType: 'teacher' as const }
        : dimension === 'place'
          ? { setting: 'school' as const }
          : { materialUsed: 'صورة حقيقية', isNovelMaterial: true };
    const r = buildGeneralizationProbe(
      { dimension, independencePct: 90, promptLevel: 'Independent', ...input },
      ctx(id, goalId)
    );
    if (!r.ok) throw new Error('expected ok');
    return saveGeneralizationProbe(r.probe);
  };

  it('saves, filters by goal, and feeds the index', () => {
    save('a', 'person');
    save('b', 'place');
    save('c', 'material_stimulus');
    save('d', 'person', 'g2');
    const g1 = loadGeneralizationProbes('g1');
    expect(g1).toHaveLength(3);
    expect(calculateGeneralizationIndex(g1).breakdown).toEqual({
      person_score: 33,
      place_score: 33,
      material_score: 33,
    });
    expect(loadGeneralizationProbes()).toHaveLength(4);
  });

  it('replaces a probe saved again with the same id', () => {
    save('a', 'person');
    save('a', 'place');
    expect(loadGeneralizationProbes()).toEqual([expect.objectContaining({ probe_id: 'a', dimension: 'place' })]);
  });

  it('ignores corrupt storage', () => {
    store.set(GENERALIZATION_PROBES_STORAGE_KEY, '{bad json');
    expect(loadGeneralizationProbes()).toEqual([]);
    store.set(GENERALIZATION_PROBES_STORAGE_KEY, JSON.stringify([{ probe_id: 1 }, null]));
    expect(loadGeneralizationProbes()).toEqual([]);
  });
});

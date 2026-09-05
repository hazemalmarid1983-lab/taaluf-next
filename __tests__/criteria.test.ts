import {
  AGE_BAND_LABELS,
  CRITERIA_LIST,
  calculateAssessmentResult,
  getActiveCriteria,
  getClassification,
} from '../types/taalof';

describe('criteria bank', () => {
  it('has 40 unified criteria with question + option descriptions', () => {
    expect(CRITERIA_LIST).toHaveLength(40);
    expect(new Set(CRITERIA_LIST.map((c) => c.domain)).size).toBe(4);
    for (const c of CRITERIA_LIST) {
      expect(c.id).toMatch(/^C\d+$/);
      expect(c.name).toBeTruthy();
      expect(c.question || c.description).toBeTruthy();
      expect(c.domain).toBeTruthy();
      expect(c.recommendation).toBeTruthy();
      expect(c.autoGoal?.length).toBeGreaterThan(20);
      expect(c.ageBands?.length).toBeGreaterThan(0);
      for (const level of ['0', '1', '2', '3'] as const) {
        expect(c.levels[level]?.label).toBeTruthy();
        expect(c.levels[level]?.description.length).toBeGreaterThan(15);
      }
    }
  });

  it('places ten items on each of the four major domains', () => {
    const counts: Record<string, number> = {};
    for (const c of CRITERIA_LIST) {
      counts[c.domain] = (counts[c.domain] || 0) + 1;
    }
    expect(Object.values(counts).every((n) => n === 10)).toBe(true);
    const toilet = CRITERIA_LIST.find((c) => c.id === 'C34');
    expect(toilet?.ageBands).toEqual(['3-4', '5-6']);
  });

  it('labels the four developmental age bands', () => {
    expect(AGE_BAND_LABELS['3-4'].ar).toBe('نبت');
    expect(AGE_BAND_LABELS['5-6'].ar).toBe('شتلة');
    expect(AGE_BAND_LABELS['7-9'].ar).toBe('ثمرة');
    expect(AGE_BAND_LABELS['10-12'].ar).toBe('نضج');
  });

  it('includes core items across age bands from unified source', () => {
    for (const band of ['3-4', '5-6', '7-9', '10-12'] as const) {
      const ids = getActiveCriteria(band).map((c) => c.id);
      expect(ids).toContain('C1');
      expect(ids).toContain('C15');
      expect(ids).toContain('C40');
    }
  });

  it('calculates known assessment result', () => {
    const active = getActiveCriteria('5-6');
    const scores = active.map((c) => ({ criterionId: c.id, score: 0 }));
    const result = calculateAssessmentResult(scores, '5-6');
    expect(result.percentage).toBe(0);
    expect(result.classification).toBe(getClassification(0).label);

    const mid = active.map((c, i) => ({
      criterionId: c.id,
      score: i % 2 === 0 ? 3 : 0,
    }));
    const midResult = calculateAssessmentResult(mid, '5-6');
    expect(midResult.percentage).toBeGreaterThan(0);
    expect(midResult.percentage).toBeLessThanOrEqual(100);
    expect(midResult.classificationMeta).toBeTruthy();
  });
});

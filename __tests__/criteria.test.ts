import {
  CRITERIA_LIST,
  calculateAssessmentResult,
  getActiveCriteria,
  getClassification,
} from '../types/taalof';

describe('criteria bank', () => {
  it('has 36 criteria with required fields', () => {
    expect(CRITERIA_LIST).toHaveLength(36);
    for (const c of CRITERIA_LIST) {
      expect(c.id).toMatch(/^C\d+$/);
      expect(c.name).toBeTruthy();
      expect(c.domain).toBeTruthy();
      expect(c.recommendation).toBeTruthy();
      expect(c.ageBands?.length).toBeGreaterThan(0);
      for (const level of ['0', '1', '2', '3'] as const) {
        expect(c.levels[level]?.label).toBeTruthy();
        expect(c.levels[level]?.description).toBeTruthy();
      }
    }
  });

  it('filters age band 3-4 excluding C20-C22', () => {
    const active = getActiveCriteria('3-4');
    const ids = active.map((c) => c.id);
    expect(ids).not.toContain('C20');
    expect(ids).not.toContain('C21');
    expect(ids).not.toContain('C22');
    expect(ids).toContain('C1');
  });

  it('filters age band 10-12 excluding C32-C34', () => {
    const active = getActiveCriteria('10-12');
    const ids = active.map((c) => c.id);
    expect(ids).not.toContain('C32');
    expect(ids).not.toContain('C33');
    expect(ids).not.toContain('C34');
    expect(ids).toContain('C20');
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

import {
  SCREENING_ITEMS,
  calculateScreening,
} from '../lib/screeningEngine';

describe('screening engine', () => {
  it('all zeros → balanced', () => {
    const answers = SCREENING_ITEMS.map((i) => ({ id: i.id, value: 0 }));
    const result = calculateScreening(answers);
    expect(result.band).toBe('balanced');
    expect(result.overall).toBe(0);
  });

  it('all 3s → elevated', () => {
    const answers = SCREENING_ITEMS.map((i) => ({ id: i.id, value: 3 }));
    const result = calculateScreening(answers);
    expect(result.band).toBe('elevated');
    expect(result.overall).toBe(100);
  });

  it('mixed answers → dimension percentages', () => {
    const answers = SCREENING_ITEMS.map((i, idx) => ({
      id: i.id,
      value: idx % 4,
    }));
    const result = calculateScreening(answers);
    expect(result.domainScores).toHaveLength(4);
    for (const d of result.domainScores) {
      expect(d.scorePercent).toBeGreaterThanOrEqual(0);
      expect(d.scorePercent).toBeLessThanOrEqual(100);
    }
  });

  it('all 12 items have unified question+options', () => {
    expect(SCREENING_ITEMS).toHaveLength(12);
    for (const item of SCREENING_ITEMS as Array<{
      options?: unknown[];
      question?: string;
      text: string;
    }>) {
      expect(item.options).toHaveLength(4);
      expect(item.question || item.text).toBeTruthy();
    }
  });
});

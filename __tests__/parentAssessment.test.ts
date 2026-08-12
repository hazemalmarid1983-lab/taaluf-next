import {
  PARENT_ITEMS,
  mapParentToCriteria,
} from '../lib/parentAssessment';

describe('parent assessment mapping', () => {
  it('maps P1 to C15', () => {
    const mapped = mapParentToCriteria([{ id: 'P1', value: 2 }]);
    expect(mapped[0].criterionId).toBe('C15');
    expect(mapped[0].source).toBe('parent');
    expect(mapped[0].score).toBe(2);
  });

  it('passes unified 0-3 scores through', () => {
    const mapped = mapParentToCriteria([{ id: 'P5', value: 3 }]);
    expect(mapped.find((m) => m.parentItemId === 'P5')?.score).toBe(3);

    const low = mapParentToCriteria([{ id: 'P5', value: 0 }]);
    expect(low.find((m) => m.parentItemId === 'P5')?.score).toBe(0);
  });

  it('all 20 items have options and mappedCriterion', () => {
    expect(PARENT_ITEMS).toHaveLength(20);
    for (const item of PARENT_ITEMS) {
      expect(item.mappedCriterion).toMatch(/^C\d+$/);
      expect(item.options?.length).toBe(4);
      expect(item.question || item.text).toBeTruthy();
    }
    const all = mapParentToCriteria(
      PARENT_ITEMS.map((i) => ({ id: i.id, value: 2 }))
    );
    expect(all).toHaveLength(20);
  });
});

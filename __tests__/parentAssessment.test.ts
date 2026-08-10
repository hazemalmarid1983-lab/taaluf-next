import {
  PARENT_ITEMS,
  mapParentToCriteria,
} from '../lib/parentAssessment';

describe('parent assessment mapping', () => {
  it('maps P1 to C15', () => {
    const mapped = mapParentToCriteria([{ id: 'P1', value: 2 }]);
    expect(mapped[0].criterionId).toBe('C15');
    expect(mapped[0].source).toBe('parent');
  });

  it('converts 0-4 scale toward 0-3', () => {
    const mapped = mapParentToCriteria([{ id: 'P5', value: 4 }]);
    // P5 not reverse → concern 4 → round(3)
    expect(mapped.find((m) => m.parentItemId === 'P5')?.score).toBe(3);

    const low = mapParentToCriteria([{ id: 'P5', value: 0 }]);
    expect(low.find((m) => m.parentItemId === 'P5')?.score).toBe(0);
  });

  it('all 20 items have valid mappedCriterion', () => {
    expect(PARENT_ITEMS).toHaveLength(20);
    for (const item of PARENT_ITEMS) {
      expect(item.mappedCriterion).toMatch(/^C\d+$/);
    }
    const all = mapParentToCriteria(
      PARENT_ITEMS.map((i) => ({ id: i.id, value: 2 }))
    );
    expect(all).toHaveLength(20);
  });
});

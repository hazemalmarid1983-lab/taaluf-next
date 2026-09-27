import {
  SCREENING_DOMAIN_REFERRAL_PERCENT,
  SCREENING_ITEMS,
  SCREENING_RED_FLAGS,
  calculateScreening,
  validateScreeningAnswers,
} from '../lib/screeningEngine';

const answers = (overrides: Record<string, number> = {}) =>
  SCREENING_ITEMS.map((i) => ({ id: i.id, value: overrides[i.id] ?? 0 }));

describe('screening v2.1 items', () => {
  const byId = (id: string) => SCREENING_ITEMS.find((i) => i.id === id)!;

  it('replaces S8 with response to name and S12 with joint attention', () => {
    expect(byId('S8').question).toMatch(/باسمه/);
    expect(byId('S12').question).toMatch(/يشير/);
    expect(byId('S8').dimension).toBe('behavioral');
    expect(byId('S12').dimension).toBe('behavioral');
  });

  it('keeps 12 items with four options scored 0 to 3 in order', () => {
    expect(SCREENING_ITEMS).toHaveLength(12);
    for (const item of SCREENING_ITEMS) {
      expect(item.options.map((o) => o.score)).toEqual([0, 1, 2, 3]);
    }
  });

  it('no longer asks about academic knowledge or sitting still', () => {
    const text = SCREENING_ITEMS.map((i) => i.question).join(' ');
    expect(text).not.toMatch(/الأرقام والحروف/);
    expect(text).not.toMatch(/يستقر طفلك حركياً/);
  });
});

describe('screening referral logic', () => {
  it('does not refer when all answers are typical', () => {
    const result = calculateScreening(answers());
    expect(result.recommendFullAssessment).toBe(false);
    expect(result.referralReasons).toEqual([]);
    expect(result.redFlags).toEqual([]);
  });

  it.each(SCREENING_RED_FLAGS.map((f) => [f.itemId, f.minScore] as const))(
    'refers on red flag %s at score %i even with a low overall score',
    (itemId, minScore) => {
      const result = calculateScreening(answers({ [itemId]: minScore }));
      expect(result.overall).toBeLessThan(25);
      expect(result.band).toBe('balanced');
      expect(result.recommendFullAssessment).toBe(true);
      expect(result.redFlags).toEqual([itemId]);
      expect(result.referralReasons?.[0]).toMatchObject({ kind: 'red_flag', itemId });
    }
  );

  it('does not treat a red-flag item below its threshold as a flag', () => {
    const result = calculateScreening(answers({ S8: 1, S12: 1, S4: 1, S1: 2, S2: 2 }));
    expect(result.redFlags).toEqual([]);
  });

  it('refers when a single dimension reaches the domain threshold', () => {
    const result = calculateScreening(answers({ S1: 2, S2: 2, S3: 3 }));
    const linguistic = result.domainScores.find((d) => d.dimension === 'linguistic')!;
    expect(linguistic.scorePercent).toBeGreaterThanOrEqual(SCREENING_DOMAIN_REFERRAL_PERCENT);
    expect(result.band).toBe('balanced');
    expect(result.recommendFullAssessment).toBe(true);
    expect(result.referralReasons).toEqual([
      expect.objectContaining({ kind: 'domain', dimension: 'linguistic' }),
    ]);
  });

  it('refers a severe social / repetitive profile that the old rule missed', () => {
    const result = calculateScreening(answers({ S4: 3, S5: 3, S6: 3 }));
    expect(result.band).not.toBe('elevated');
    expect(result.recommendFullAssessment).toBe(true);
  });

  it('still refers on an elevated overall score', () => {
    const all3 = Object.fromEntries(SCREENING_ITEMS.map((i) => [i.id, 3]));
    const result = calculateScreening(answers(all3));
    expect(result.referralReasons).toContainEqual(expect.objectContaining({ kind: 'overall' }));
  });
});

describe('screening answer validation', () => {
  it('accepts exactly one integer 0–3 answer per item', () => {
    const v = validateScreeningAnswers(answers({ S3: 2 }));
    expect(v.ok).toBe(true);
  });

  it('rejects missing items instead of scoring them as typical', () => {
    const v = validateScreeningAnswers(answers().slice(0, 10));
    expect(v).toEqual({ ok: false, error: 'MISSING_ITEMS', itemIds: ['S11', 'S12'] });
  });

  it('rejects unknown, duplicate and out-of-range answers', () => {
    expect(validateScreeningAnswers([...answers(), { id: 'S99', value: 1 }])).toMatchObject({
      ok: false,
      error: 'UNKNOWN_ITEM',
    });
    expect(validateScreeningAnswers([...answers(), { id: 'S1', value: 1 }])).toMatchObject({
      ok: false,
      error: 'DUPLICATE_ITEM',
    });
    const bad = answers().map((a) => (a.id === 'S5' ? { ...a, value: 4 } : a));
    expect(validateScreeningAnswers(bad)).toMatchObject({ ok: false, error: 'INVALID_VALUE', itemIds: ['S5'] });
    const frac = answers().map((a) => (a.id === 'S5' ? { ...a, value: 1.5 } : a));
    expect(validateScreeningAnswers(frac)).toMatchObject({ ok: false, error: 'INVALID_VALUE' });
  });

  it('rejects a non-array payload', () => {
    expect(validateScreeningAnswers(undefined)).toMatchObject({ ok: false, error: 'MISSING_ITEMS' });
  });
});

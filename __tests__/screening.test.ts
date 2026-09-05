import {
  SCREENING_ITEMS,
  calculateScreening,
  canonicalScreeningDomainLabel,
  getImmediateScreeningTip,
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

  it('labels the four Canon domains and picks a golden home tip', () => {
    const answers = SCREENING_ITEMS.map((i) => ({
      id: i.id,
      value: i.dimension === 'linguistic' ? 3 : 0,
    }));
    const result = calculateScreening(answers);
    expect(result.domainScores.map((d) => d.label_ar)).toEqual([
      'التواصل الاستجابي والتعبيري',
      'التفاعل والاندماج الاجتماعي واللعب',
      'النمو المعرفي والحلول الإدراكية',
      'السلوك والتكيف والحواس واستقلالية الذات',
    ]);
    const tip = getImmediateScreeningTip(result);
    expect(tip.domain).toBe('التواصل الاستجابي والتعبيري');
    expect(tip.title).toMatch(/الطلب/);
    expect(tip.tip.length).toBeGreaterThan(40);
  });

  it('maps short/legacy domain names to Canon 4.0 before display and tips', () => {
    expect(canonicalScreeningDomainLabel('لغوي')).toBe(
      'التواصل الاستجابي والتعبيري'
    );
    expect(canonicalScreeningDomainLabel('سلوكي')).toBe(
      'التفاعل والاندماج الاجتماعي واللعب'
    );
    expect(canonicalScreeningDomainLabel('معرفي')).toBe(
      'النمو المعرفي والحلول الإدراكية'
    );
    expect(canonicalScreeningDomainLabel('حركي')).toBe(
      'السلوك والتكيف والحواس واستقلالية الذات'
    );
    const tip = getImmediateScreeningTip({
      overall: 67,
      band: 'elevated',
      recommendFullAssessment: true,
      domainScores: [
        {
          dimension: 'linguistic',
          label_ar: 'لغوي',
          raw: 6,
          max: 9,
          scorePercent: 67,
        },
        {
          dimension: 'behavioral',
          label_ar: 'سلوكي',
          raw: 3,
          max: 9,
          scorePercent: 33,
        },
        {
          dimension: 'cognitive',
          label_ar: 'معرفي',
          raw: 2,
          max: 9,
          scorePercent: 22,
        },
        {
          dimension: 'motor',
          label_ar: 'حركي',
          raw: 2,
          max: 9,
          scorePercent: 22,
        },
      ],
    });
    expect(tip.domain).toBe('التواصل الاستجابي والتعبيري');
    expect(tip.title).toMatch(/الطلب/);
  });
});

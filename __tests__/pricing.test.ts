import { getPrice, PRICING_TIERS } from '../lib/pricing';
import { TAALUF_PRICING, getOfficialPrice } from '../lib/pricingConfig';

describe('official pricing catalog', () => {
  it('quotes parent single assessment in OMR / JOD / USD', () => {
    expect(getOfficialPrice('parent_single', 'OMR')).toBe(25);
    expect(getOfficialPrice('parent_single', 'JOD')).toBe(46);
    expect(getOfficialPrice('parent_single', 'USD')).toBe(65);
    expect(getPrice('assessment', 'OMR')).toBe(25);
    expect(getPrice('assessment', 'USD')).toBe(65);
  });

  it('keeps annual parent plan as the recommended package', () => {
    const annual = TAALUF_PRICING.parents.find((p) => p.recommended);
    expect(annual?.id).toBe('parent_annual');
    expect(getPrice('parent_annual', 'OMR')).toBe(75);
  });

  it('quotes specialist per-case bundles', () => {
    expect(getPrice('spec_5', 'OMR')).toBe(30);
    expect(getPrice('specialist', 'OMR')).toBe(30);
    expect(TAALUF_PRICING.specialistBundles[1].costPerCaseOMR).toBe(6);
  });

  it('converts unofficial currencies from USD', () => {
    expect(getPrice('parent_single', 'SAR')).toBe(Math.round(65 * 3.75));
  });

  it('invalid tier → 0', () => {
    expect(getPrice('unknown', 'USD')).toBe(0);
    expect(getPrice('free', 'OMR')).toBe(0);
  });

  it('keeps specialist 40 items off the independent family path', () => {
    const family = PRICING_TIERS.assessment.features_ar.join(' ');
    expect(family).not.toMatch(/أخصائي/);
    expect(family).not.toMatch(/40/);
    expect(TAALUF_PRICING.parents[0].features.join(' ')).toMatch(/Canon 4.0/);
  });
});

import { getPrice } from '../lib/pricing';

describe('pricing', () => {
  it('SAR price equals base price', () => {
    expect(getPrice('assessment', 'SAR')).toBe(149);
    expect(getPrice('monitoring', 'SAR')).toBe(49);
  });

  it('AED conversion', () => {
    expect(getPrice('assessment', 'AED')).toBe(Math.round(149 * 0.98));
  });

  it('EGP conversion', () => {
    expect(getPrice('assessment', 'EGP')).toBe(Math.round(149 * 13.2));
  });

  it('invalid tier → 0', () => {
    expect(getPrice('unknown', 'SAR')).toBe(0);
  });
});

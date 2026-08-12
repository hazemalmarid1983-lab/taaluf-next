import { getPrice } from '../lib/pricing';

describe('pricing (USD base)', () => {
  it('USD equals base USD prices', () => {
    expect(getPrice('assessment', 'USD')).toBe(39);
    expect(getPrice('monitoring', 'USD')).toBe(15);
    expect(getPrice('specialist', 'USD')).toBe(49);
    expect(getPrice('free', 'USD')).toBe(0);
  });

  it('SAR conversion from USD', () => {
    expect(getPrice('assessment', 'SAR')).toBe(Math.round(39 * 3.75));
  });

  it('AED conversion from USD', () => {
    expect(getPrice('assessment', 'AED')).toBe(Math.round(39 * 3.67));
  });

  it('EGP conversion from USD', () => {
    expect(getPrice('assessment', 'EGP')).toBe(Math.round(39 * 48));
  });

  it('invalid tier → 0', () => {
    expect(getPrice('unknown', 'USD')).toBe(0);
  });
});

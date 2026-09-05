import {
  clampTilt,
  normalizeTilt,
  rainIntensityFromRms,
} from '../lib/sensoryHubEffects';

describe('sensory hub effects', () => {
  it('maps calm voice to lighter rain', () => {
    expect(rainIntensityFromRms(0)).toBeGreaterThan(rainIntensityFromRms(0.15));
  });

  it('clamps tilt values', () => {
    expect(clampTilt(2)).toBe(1);
    expect(clampTilt(-2)).toBe(-1);
  });

  it('normalizes device tilt and drag fallback', () => {
    expect(normalizeTilt(45, 0, 400)).toBeCloseTo(0, 1);
    expect(normalizeTilt(null, 200, 400)).toBeGreaterThan(0);
  });
});

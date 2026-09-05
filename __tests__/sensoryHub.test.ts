import {
  analyzeInteractionPattern,
  clampSensorySettings,
  computeCalmIndex,
  computeEngagementIndex,
  effectiveVolume,
  formatSessionClock,
  SENSORY_LIMITS,
  SENSORY_ROOMS,
} from '../lib/sensoryHub';

describe('sensory hub', () => {
  it('exposes all sensory rooms including classic sanctuary', () => {
    expect(SENSORY_ROOMS.map((r) => r.id)).toEqual([
      'bubbles',
      'stars',
      'tracing',
      'sand',
      'animals',
      'waves',
      'rain',
      'mirror',
      'classic',
    ]);
  });

  it('clamps settings to safe sensory limits', () => {
    const clamped = clampSensorySettings({
      volume: 1,
      brightness: 1,
      sensitivity: 0,
    });
    expect(clamped.volume).toBeLessThanOrEqual(SENSORY_LIMITS.maxVolume);
    expect(clamped.brightness).toBeLessThanOrEqual(SENSORY_LIMITS.maxBrightness);
    expect(clamped.sensitivity).toBeGreaterThanOrEqual(
      SENSORY_LIMITS.minSensitivity
    );
  });

  it('computes calm index from duration and interactions', () => {
    const calm = computeCalmIndex({
      durationMs: 120_000,
      interactions: 8,
      breathingCycles: 2,
    });
    expect(calm).toBeGreaterThan(50);
    expect(calm).toBeLessThanOrEqual(100);
  });

  it('formats session clock', () => {
    expect(formatSessionClock(125_000)).toBe('2:05');
  });

  it('caps effective volume', () => {
    expect(effectiveVolume({ volume: 0.99, brightness: 0.7, sensitivity: 0.6 })).toBe(
      SENSORY_LIMITS.maxVolume
    );
  });

  it('derives engagement from interaction patterns', () => {
    const start = 1_000_000;
    const stamps = [start + 1000, start + 1500, start + 1800, start + 120_000];
    const pattern = analyzeInteractionPattern(stamps, 130_000, start);
    expect(pattern.interactionBursts).toBeGreaterThanOrEqual(1);
    const engagement = computeEngagementIndex({
      durationMs: 130_000,
      interactions: 4,
      interactionRate: pattern.interactionRate,
      interactionBursts: pattern.interactionBursts,
      activeRatio: pattern.activeRatio,
    });
    expect(engagement).toBeGreaterThan(0);
    expect(engagement).toBeLessThanOrEqual(100);
  });
});

import {
  DEFAULT_SENSORY_SESSION_DURATION_SEC,
  resolveSensoryExitHref,
  resolveSensorySessionPlan,
} from '@/lib/sensorySessionPlan';
import {
  currentParentGameStep,
  startParentGamesSequence,
} from '@/lib/parentGamesSequence';

describe('sensorySessionPlan', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    // @ts-expect-error test env mock
    global.window = global;
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        getItem: (k: string) => store[k] ?? null,
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => {
          Object.keys(store).forEach((k) => delete store[k]);
        },
      },
      writable: true,
    });
  });

  it('uses default duration when no sequence', () => {
    const plan = resolveSensorySessionPlan({ pathname: '/sensory-rooms/bubbles' });
    expect(plan.durationSec).toBe(DEFAULT_SENSORY_SESSION_DURATION_SEC);
    expect(plan.source).toBe('default');
  });

  it('free play lasts three minutes and is not cut short by tap count', () => {
    const plan = resolveSensorySessionPlan({ pathname: '/sensory-rooms/sand' });
    expect(plan.durationSec).toBe(180);
    expect(30 >= plan.maxInteractions).toBe(false);
    expect(1000 >= plan.maxInteractions).toBe(false);
  });

  it('uses sequence limits for sensory room', () => {
    startParentGamesSequence(0);
    const plan = resolveSensorySessionPlan({ pathname: '/sensory-room' });
    expect(plan.durationSec).toBe(180);
    expect(plan.maxInteractions).toBe(Number.POSITIVE_INFINITY);
    expect(plan.source).toBe('sequence');
  });

  it('exiting a sensory room returns to the sensory rooms list and clears sequence', () => {
    startParentGamesSequence(0);
    const plan = resolveSensorySessionPlan({ pathname: '/sensory-room' });
    expect(resolveSensoryExitHref(plan)).toBe('/sensory-rooms');
    expect(currentParentGameStep()).toBeNull();
  });

  it('exiting a hub room returns to the sensory rooms list', () => {
    const plan = resolveSensorySessionPlan({ pathname: '/sensory-rooms/rain' });
    expect(resolveSensoryExitHref(plan)).toBe('/sensory-rooms');
  });

  it('exiting picture matching returns to the games hub', () => {
    const plan = resolveSensorySessionPlan({ pathname: '/sensory-matching' });
    expect(resolveSensoryExitHref(plan)).toBe('/dashboard/games');
  });
});

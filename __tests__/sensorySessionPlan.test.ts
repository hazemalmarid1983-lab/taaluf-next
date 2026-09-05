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

  it('uses sequence limits for sensory room', () => {
    startParentGamesSequence(0);
    const plan = resolveSensorySessionPlan({ pathname: '/sensory-room' });
    expect(plan.durationSec).toBe(90);
    expect(plan.maxInteractions).toBe(40);
    expect(plan.source).toBe('sequence');
  });

  it('final exit href returns games hub and clears sequence', () => {
    startParentGamesSequence(0);
    const plan = resolveSensorySessionPlan({ pathname: '/sensory-room' });
    expect(resolveSensoryExitHref(plan)).toBe('/dashboard/games');
    expect(currentParentGameStep()).toBeNull();
  });
});

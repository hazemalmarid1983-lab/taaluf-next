import {
  PARENT_GAMES_SEQUENCE,
  advanceParentGamesSequence,
  clearParentGamesSequence,
  currentParentGameStep,
  startParentGamesSequence,
  startParentGamesSequenceAtHref,
  stepForPathname,
} from '@/lib/parentGamesSequence';

describe('parentGamesSequence', () => {
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

  it('starts sequence at href index', () => {
    startParentGamesSequenceAtHref('/sensory-matching');
    expect(currentParentGameStep()?.id).toBe('sensory_matching');
  });

  it('advances to next game href', () => {
    startParentGamesSequence(0);
    expect(advanceParentGamesSequence()).toBe('/sensory-matching');
    expect(currentParentGameStep()?.id).toBe('sensory_matching');
  });

  it('clears sequence after last step', () => {
    startParentGamesSequence(PARENT_GAMES_SEQUENCE.length - 1);
    expect(advanceParentGamesSequence()).toBeNull();
    expect(currentParentGameStep()).toBeNull();
  });

  it('resolves step from pathname', () => {
    expect(stepForPathname('/sensory-room')?.id).toBe('classic_sensory');
    clearParentGamesSequence();
  });
});

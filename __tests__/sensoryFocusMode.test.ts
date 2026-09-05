import {
  holdExitProgress,
  shouldExitOnDoubleTap,
  SENSORY_FOCUS_DOUBLE_TAP_MS,
  SENSORY_FOCUS_EXIT_HOLD_MS,
} from '../lib/sensoryFocusMode';

describe('sensory focus mode helpers', () => {
  it('tracks long-press progress toward exit', () => {
    expect(holdExitProgress(0)).toBe(0);
    expect(holdExitProgress(SENSORY_FOCUS_EXIT_HOLD_MS / 2)).toBe(0.5);
    expect(holdExitProgress(SENSORY_FOCUS_EXIT_HOLD_MS)).toBe(1);
    expect(holdExitProgress(SENSORY_FOCUS_EXIT_HOLD_MS * 2)).toBe(1);
  });

  it('detects a double-tap within the window', () => {
    const first = 1000;
    expect(shouldExitOnDoubleTap(first + 200, first)).toBe(true);
    expect(
      shouldExitOnDoubleTap(
        first + SENSORY_FOCUS_DOUBLE_TAP_MS + 1,
        first
      )
    ).toBe(false);
    expect(shouldExitOnDoubleTap(first, 0)).toBe(false);
  });
});

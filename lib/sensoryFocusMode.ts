/** نمط التدريب البصري الهادئ — ثوابت قابلة للاختبار */

export const SENSORY_FOCUS_BODY_CLASS = 'taaluf-sensory-focus';
export const SENSORY_FOCUS_EXIT_HOLD_MS = 3000;
export const SENSORY_FOCUS_DOUBLE_TAP_MS = 400;

export function shouldExitOnDoubleTap(
  now: number,
  lastTapAt: number,
  windowMs = SENSORY_FOCUS_DOUBLE_TAP_MS
) {
  return lastTapAt > 0 && now - lastTapAt <= windowMs;
}

export function holdExitProgress(
  elapsedMs: number,
  holdMs = SENSORY_FOCUS_EXIT_HOLD_MS
) {
  if (elapsedMs <= 0) return 0;
  return Math.min(1, elapsedMs / holdMs);
}

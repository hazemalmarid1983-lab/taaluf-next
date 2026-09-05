/** CSS classes for viewport-locked sensory layers (fallback when Fullscreen API unavailable). */
export const SENSORY_VIEWPORT_LAYER_CLASS =
  'fixed inset-0 z-[9999] h-[100dvh] w-[100dvw] max-h-[100dvh] max-w-[100dvw] touch-none select-none overflow-hidden overscroll-none';

export async function enterSensoryFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
    return Boolean(document.fullscreenElement);
  } catch {
    return false;
  }
}

export async function exitSensoryFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return;
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch {
    /* ignore */
  }
}

export function lockSensoryViewportScroll(): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const html = document.documentElement;
  const body = document.body;
  const prevHtml = html.style.overflow;
  const prevBody = body.style.overflow;
  html.style.overflow = 'hidden';
  body.style.overflow = 'hidden';
  return () => {
    html.style.overflow = prevHtml;
    body.style.overflow = prevBody;
  };
}

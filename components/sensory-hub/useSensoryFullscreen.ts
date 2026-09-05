'use client';

import { useEffect, useRef } from 'react';
import {
  enterSensoryFullscreen,
  exitSensoryFullscreen,
  lockSensoryViewportScroll,
} from '@/lib/sensoryFullscreen';

/** Browser Fullscreen API + viewport lock for sensory sessions. */
export function useSensoryFullscreen(active = true) {
  const enteredRef = useRef(false);

  useEffect(() => {
    if (!active) return undefined;

    const unlockScroll = lockSensoryViewportScroll();

    const tryEnter = () => {
      if (enteredRef.current) return;
      enteredRef.current = true;
      void enterSensoryFullscreen();
    };

    window.addEventListener('pointerdown', tryEnter, { once: true });

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        enteredRef.current = false;
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      window.removeEventListener('pointerdown', tryEnter);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      unlockScroll();
      enteredRef.current = false;
      void exitSensoryFullscreen();
    };
  }, [active]);
}

'use client';

import { createContext, useContext } from 'react';

export type SensoryImmersiveContextValue = {
  /** عناصر التحكم الظاهرة للولي (إعدادات/مقاييس) */
  controlsVisible: boolean;
  revealControls: () => void;
};

export const SensoryImmersiveContext =
  createContext<SensoryImmersiveContextValue | null>(null);

export function useSensoryImmersiveChrome() {
  return useContext(SensoryImmersiveContext);
}

/** يخفي عناصر التحكم الاختيارية أثناء الغمر — استخدم data-sensory-persist للأزرار الحرجة */
export function sensoryOverlayClass(
  controlsVisible: boolean,
  persistent = false
) {
  if (persistent) {
    return controlsVisible
      ? 'opacity-100 transition-opacity duration-500'
      : 'opacity-[0.28] transition-opacity duration-500 hover:opacity-80';
  }
  return controlsVisible
    ? 'pointer-events-auto opacity-100 transition-opacity duration-500'
    : 'pointer-events-none opacity-0 transition-opacity duration-500';
}

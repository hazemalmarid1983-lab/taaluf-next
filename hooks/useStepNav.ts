'use client';

import { useCallback, useRef, useState } from 'react';

/** انتقال خطوة مع تمرير للأعلى ومنع الضغط المزدوج */
export function useStepNav(delayMs = 500) {
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback(
    (action: () => void) => {
      if (locked) return;
      setLocked(true);
      action();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setLocked(false), delayMs);
    },
    [delayMs, locked]
  );

  return { locked, go };
}

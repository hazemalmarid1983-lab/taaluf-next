'use client';

import { type ReactNode, useEffect } from 'react';
import { SENSORY_FOCUS_BODY_CLASS } from '@/lib/sensoryFocusMode';
import { useSensoryFullscreen } from '@/components/sensory-hub/useSensoryFullscreen';
import { SENSORY_VIEWPORT_LAYER_CLASS } from '@/lib/sensoryFullscreen';

export default function ClassicSensoryRoomFrame({
  children,
  dir = 'rtl',
}: {
  children: ReactNode;
  dir?: 'rtl' | 'ltr';
}) {
  useSensoryFullscreen(true);

  useEffect(() => {
    document.body.classList.add(SENSORY_FOCUS_BODY_CLASS);
    return () => document.body.classList.remove(SENSORY_FOCUS_BODY_CLASS);
  }, []);

  return (
    <div className={`${SENSORY_VIEWPORT_LAYER_CLASS} bg-[#042F2E]`} dir={dir}>
      {children}
    </div>
  );
}

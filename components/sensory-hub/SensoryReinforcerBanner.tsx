'use client';

import { useEffect, useState } from 'react';
import {
  clearSensoryReinforcerHandoff,
  readSensoryReinforcerHandoff,
  reinforcerSecondsRemaining,
} from '@/lib/scheduleRewards';
import { formatReinforcerClock } from '@/lib/reinforcerDelivery';

/** شريط مؤقت المعزّز المُمرَّر من الغرفة الصفية المنزلية */
export default function SensoryReinforcerBanner({ isAr }: { isAr: boolean }) {
  const [leftSec, setLeftSec] = useState<number | null>(null);

  useEffect(() => {
    const handoff = readSensoryReinforcerHandoff();
    if (!handoff) return undefined;

    const tick = () => {
      const remaining = reinforcerSecondsRemaining(handoff);
      setLeftSec(remaining);
      if (remaining <= 0) {
        clearSensoryReinforcerHandoff();
      }
    };

    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, []);

  if (leftSec === null) return null;

  return (
    <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-300/60 bg-amber-500/90 px-4 py-2 text-[11px] font-black text-white shadow-lg backdrop-blur-sm">
      <span>🎁</span>
      <span>
        {leftSec > 0
          ? isAr
            ? `وقت المعزّز: ${formatReinforcerClock(leftSec)}`
            : `Reward time: ${formatReinforcerClock(leftSec)}`
          : isAr
            ? 'انتهى وقت المعزّز'
            : 'Reward time is over'}
      </span>
    </div>
  );
}

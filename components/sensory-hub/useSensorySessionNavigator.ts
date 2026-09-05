'use client';

import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { useRouter } from 'next/navigation';
import { exitSensoryFullscreen } from '@/lib/sensoryFullscreen';
import { clearParentGamesSequence } from '@/lib/parentGamesSequence';
import {
  readSensoryReinforcerHandoff,
  reinforcerSecondsRemaining,
  clearSensoryReinforcerHandoff,
} from '@/lib/scheduleRewards';
import {
  resolveSensoryFinalExitHref,
  resolveSensorySessionPlan,
  type SensorySessionPlan,
} from '@/lib/sensorySessionPlan';
import type { SensorySessionEndReason } from '@/lib/sensorySessionEnd';

type UseSensorySessionNavigatorOptions = {
  pathname?: string;
  /** يُستدعى مرة واحدة قبل التوجيه النهائي (حفظ المقاييس) */
  onBeforeNavigate?: () => void;
};

/** توجيه نهائي — يغلق السلسلة كاملة ويعود للمركز أو الصفحة السابقة */
export function useSensorySessionNavigator(options: UseSensorySessionNavigatorOptions = {}) {
  const router = useRouter();
  const planRef = useRef<SensorySessionPlan>(
    resolveSensorySessionPlan({ pathname: options.pathname })
  );
  const navigatedRef = useRef(false);
  const beforeNavigateRef = useRef(options.onBeforeNavigate);
  beforeNavigateRef.current = options.onBeforeNavigate;

  const navigateFinalExit = useCallback(async () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    beforeNavigateRef.current?.();
    clearSensoryReinforcerHandoff();
    clearParentGamesSequence();
    await exitSensoryFullscreen();
    router.push(resolveSensoryFinalExitHref(planRef.current));
  }, [router]);

  return { navigateFinalExit, plan: planRef.current, navigatedRef };
}

/** يراقب حدود الجلسة ويستدعي onEnd دون التوجيه التلقائي */
export function useSensorySessionLimitsWatcher(
  interactions: number,
  elapsedMs: number,
  onEnd: (reason: SensorySessionEndReason) => void,
  sessionStoppedRef: MutableRefObject<boolean>,
  plan: SensorySessionPlan
) {
  useEffect(() => {
    if (sessionStoppedRef.current) return;
    if (elapsedMs >= plan.durationSec * 1000) {
      sessionStoppedRef.current = true;
      onEnd('time');
      return;
    }
    if (interactions >= plan.maxInteractions) {
      sessionStoppedRef.current = true;
      onEnd('interactions');
    }
  }, [elapsedMs, interactions, onEnd, sessionStoppedRef, plan]);

  useEffect(() => {
    const handoff = readSensoryReinforcerHandoff();
    if (!handoff) return undefined;
    const tick = () => {
      if (sessionStoppedRef.current) return;
      if (reinforcerSecondsRemaining(handoff) <= 0) {
        sessionStoppedRef.current = true;
        onEnd('reinforcer');
      }
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [onEnd, sessionStoppedRef]);
}

export function sensorySessionRemainingSec(elapsedMs: number, plan: SensorySessionPlan): number {
  return Math.max(0, plan.durationSec - Math.floor(elapsedMs / 1000));
}

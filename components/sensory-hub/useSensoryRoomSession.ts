'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  analyzeInteractionPattern,
  buildSensorySessionMetrics,
  computeCalmIndex,
  computeEngagementIndex,
  DEFAULT_SENSORY_SETTINGS,
  formatSessionClock,
  type SensoryRoomId,
} from '@/lib/sensoryHub';
import { SensoryHubAudio } from '@/lib/sensoryHubAudio';
import { persistSensoryHubSession } from '@/lib/sensoryHubSession';
import { clearSensoryReinforcerHandoff } from '@/lib/scheduleRewards';
import { resolveSensoryChildId } from '@/lib/sensorySanctuary';
import { resolveSensorySessionPlan } from '@/lib/sensorySessionPlan';
import type { SensorySessionEndReason } from '@/lib/sensorySessionEnd';
import {
  sensorySessionRemainingSec,
  useSensorySessionLimitsWatcher,
  useSensorySessionNavigator,
} from '@/components/sensory-hub/useSensorySessionNavigator';

export type SensorySessionPhase = 'playing' | 'results';

export function useSensoryRoomSession(roomId: SensoryRoomId) {
  const planRef = useRef(resolveSensorySessionPlan({ roomId }));
  const startedRef = useRef(Date.now());
  const audioRef = useRef<SensoryHubAudio | null>(null);
  if (!audioRef.current) audioRef.current = new SensoryHubAudio();

  const interactionTimesRef = useRef<number[]>([]);
  const persistedRef = useRef(false);
  const sessionStoppedRef = useRef(false);

  const [settings, setSettings] = useState(DEFAULT_SENSORY_SETTINGS);
  const [interactions, setInteractions] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [breathingCycles, setBreathingCycles] = useState(0);
  const [emergencyCalmCount, setEmergencyCalmCount] = useState(0);
  const [sessionPhase, setSessionPhase] = useState<SensorySessionPhase>('playing');
  const [endReason, setEndReason] = useState<SensorySessionEndReason | null>(null);

  useEffect(() => {
    if (sessionPhase !== 'playing') return undefined;
    const tick = window.setInterval(() => {
      setElapsedMs(Date.now() - startedRef.current);
    }, 1000);
    return () => window.clearInterval(tick);
  }, [sessionPhase]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || sessionPhase !== 'playing') return undefined;
    audio.setVolume(settings);
    audio.startAmbient(roomId, settings);
    const unlock = () => {
      void audio.resume().then(() => audio.startAmbient(roomId, settings));
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      if (sessionPhase !== 'playing') audio.stopAmbient();
    };
  }, [roomId, settings, sessionPhase]);

  const pattern = analyzeInteractionPattern(
    interactionTimesRef.current,
    elapsedMs,
    startedRef.current
  );

  const calmIndex = computeCalmIndex({
    durationMs: elapsedMs,
    interactions,
    breathingCycles,
    emergencyCalmCount,
    interactionRate: pattern.interactionRate / 60,
    interactionBursts: pattern.interactionBursts,
  });

  const engagementIndex = computeEngagementIndex({
    durationMs: elapsedMs,
    interactions,
    interactionRate: pattern.interactionRate,
    interactionBursts: pattern.interactionBursts,
    activeRatio: pattern.activeRatio,
    breathingCycles,
  });

  const buildMetrics = useCallback(() => {
    return buildSensorySessionMetrics({
      roomId,
      childId: resolveSensoryChildId(),
      durationMs: Date.now() - startedRef.current,
      interactions,
      interactionTimestamps: [...interactionTimesRef.current],
      sessionStartMs: startedRef.current,
      breathingCycles,
      emergencyCalmCount,
      settings,
      startedAt: new Date(startedRef.current).toISOString(),
      endedAt: new Date().toISOString(),
    });
  }, [breathingCycles, emergencyCalmCount, interactions, roomId, settings]);

  const saveMetricsOnce = useCallback(() => {
    if (persistedRef.current) return;
    const durationMs = Date.now() - startedRef.current;
    if (durationMs < 800 && interactions === 0) return;
    persistedRef.current = true;
    persistSensoryHubSession(buildMetrics());
  }, [buildMetrics, interactions]);

  const { navigateFinalExit, navigatedRef } = useSensorySessionNavigator({
    onBeforeNavigate: saveMetricsOnce,
  });

  const showResults = useCallback(
    (reason: SensorySessionEndReason) => {
      if (sessionPhase === 'results') return;
      sessionStoppedRef.current = true;
      saveMetricsOnce();
      audioRef.current?.stopAmbient();
      setEndReason(reason);
      setSessionPhase('results');
    },
    [saveMetricsOnce, sessionPhase]
  );

  const persistSession = useCallback(
    (navigateAway = false) => {
      if (navigateAway) {
        void navigateFinalExit();
        return;
      }
      if (persistedRef.current) return;
      const durationMs = Date.now() - startedRef.current;
      if (durationMs < 800 && interactions === 0) return;
      persistedRef.current = true;
      persistSensoryHubSession(buildMetrics());
      clearSensoryReinforcerHandoff();
      audioRef.current?.stopAmbient();
    },
    [buildMetrics, interactions, navigateFinalExit]
  );

  useSensorySessionLimitsWatcher(
    interactions,
    elapsedMs,
    showResults,
    sessionStoppedRef,
    planRef.current
  );

  const bumpInteraction = useCallback(() => {
    if (sessionPhase !== 'playing') return;
    interactionTimesRef.current.push(Date.now());
    setInteractions((n) => n + 1);
  }, [sessionPhase]);

  const exit = useCallback(() => {
    showResults('manual');
  }, [showResults]);

  const replay = useCallback(() => {
    sessionStoppedRef.current = false;
    navigatedRef.current = false;
    persistedRef.current = false;
    startedRef.current = Date.now();
    interactionTimesRef.current = [];
    setInteractions(0);
    setElapsedMs(0);
    setBreathingCycles(0);
    setEmergencyCalmCount(0);
    setEndReason(null);
    setSessionPhase('playing');
    const audio = audioRef.current;
    if (audio) {
      audio.setVolume(settings);
      void audio.resume().then(() => audio.startAmbient(roomId, settings));
    }
  }, [navigatedRef, roomId, settings]);

  const exitGroup = useCallback(() => {
    void navigateFinalExit();
  }, [navigateFinalExit]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') persistSession(false);
    };
    const onPageHide = () => persistSession(false);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [persistSession]);

  const remainingSec = sensorySessionRemainingSec(elapsedMs, planRef.current);

  const resultStats = [
    {
      labelAr: 'المدة',
      labelEn: 'Duration',
      value: formatSessionClock(elapsedMs),
    },
    {
      labelAr: 'تفاعلات',
      labelEn: 'Interactions',
      value: interactions,
    },
    {
      labelAr: 'هدوء',
      labelEn: 'Calm',
      value: `${calmIndex}%`,
    },
    {
      labelAr: 'انخراط',
      labelEn: 'Engagement',
      value: `${engagementIndex}%`,
    },
  ];

  return {
    settings,
    setSettings,
    interactions,
    bumpInteraction,
    elapsedMs,
    remainingSec,
    sessionDurationSec: planRef.current.durationSec,
    calmIndex,
    engagementIndex,
    interactionRate: pattern.interactionRate,
    interactionBursts: pattern.interactionBursts,
    activeRatio: pattern.activeRatio,
    breathingCycles,
    setBreathingCycles,
    emergencyCalmCount,
    setEmergencyCalmCount,
    audio: audioRef,
    sessionPhase,
    endReason,
    resultStats,
    exit,
    replay,
    exitGroup,
    persistSession,
  };
}

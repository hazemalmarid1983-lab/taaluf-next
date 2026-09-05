'use client';

import { useCallback, useRef } from 'react';
import SensoryMatchingGame from '@/components/games/SensoryMatchingGame';
import {
  SENSORY_MATCHING_GAME_CODE,
  resolveMatchingChildId,
  type SensoryMatchingMetrics,
} from '@/lib/sensoryMatching';
import { saveGameSession } from '@/lib/gameSession';
import { useSensorySessionNavigator } from '@/components/sensory-hub/useSensorySessionNavigator';

export default function SensoryMatchingPage() {
  const savedRef = useRef(false);

  const { navigateFinalExit } = useSensorySessionNavigator({
    pathname: '/sensory-matching',
  });

  const onComplete = useCallback((metrics: SensoryMatchingMetrics) => {
    if (savedRef.current) return;
    savedRef.current = true;
    const ended = new Date().toISOString();
    void saveGameSession({
      childId: resolveMatchingChildId(),
      gameCode: SENSORY_MATCHING_GAME_CODE,
      score: metrics.accuracyRate,
      levelReached: metrics.levelReached === 'category' ? 2 : 1,
      metrics: {
        correctAttempts: metrics.correctAttempts,
        totalAttempts: metrics.totalAttempts,
        avgResponseMs: metrics.avgResponseMs,
        accuracyRate: metrics.accuracyRate,
        firstTryCorrect: metrics.firstTryCorrect,
        roundsCompleted: metrics.roundsCompleted,
      },
      trials: [],
      startedAt: ended,
      endedAt: ended,
    }).catch(() => undefined);
  }, []);

  const onReplayReset = useCallback(() => {
    savedRef.current = false;
  }, []);

  return (
    <div
      className="min-h-screen bg-[linear-gradient(180deg,#F0FDFA_0%,#ECFEFF_50%,#FFF7ED_100%)]"
      dir="rtl"
    >
      <SensoryMatchingGame
        onComplete={onComplete}
        onExitGroup={() => void navigateFinalExit()}
        onReplayReset={onReplayReset}
      />
    </div>
  );
}

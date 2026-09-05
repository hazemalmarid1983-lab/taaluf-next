'use client';

import { useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SensoryMatchingGame from '@/components/games/SensoryMatchingGame';
import {
  SENSORY_MATCHING_GAME_CODE,
  type SensoryMatchingMetrics,
} from '@/lib/sensoryMatching';
import { saveGameSession } from '@/lib/gameSession';
import { PARENT_ROUTES } from '@/lib/parentJourney';

export default function SensoryMatchingChildPage() {
  const params = useParams();
  const router = useRouter();
  const childId = String(params.childId || 'child_local');
  const savedRef = useRef(false);

  const onComplete = useCallback(
    (metrics: SensoryMatchingMetrics) => {
      if (savedRef.current) return;
      savedRef.current = true;
      const ended = new Date().toISOString();
      void saveGameSession({
        childId,
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
    },
    [childId]
  );

  return (
    <div
      className="min-h-screen bg-[linear-gradient(180deg,#F0FDFA_0%,#ECFEFF_50%,#FFF7ED_100%)]"
      dir="rtl"
    >
      <SensoryMatchingGame
        childId={childId}
        onComplete={onComplete}
        onExitGroup={() => router.push(PARENT_ROUTES.games)}
        onReplayReset={() => {
          savedRef.current = false;
        }}
      />
    </div>
  );
}

'use client';

import { useParams } from 'next/navigation';
import SensorySanctuary from '@/components/SensorySanctuary';
import ClassicSensoryRoomFrame from '@/components/sensory-hub/ClassicSensoryRoomFrame';
import {
  SENSORY_SANCTUARY_GAME_CODE,
  type SensorySessionMetrics,
} from '@/lib/sensorySanctuary';
import { saveGameSession } from '@/lib/gameSession';
import { PARENT_ROUTES } from '@/lib/parentJourney';

export default function SensoryRoomPage() {
  const params = useParams();
  const childId = String(params.childId || 'child_local');

  const onComplete = (metrics: SensorySessionMetrics) => {
    const ended = new Date().toISOString();
    void saveGameSession({
      childId,
      gameCode: SENSORY_SANCTUARY_GAME_CODE,
      score: metrics.visualMotorRate,
      levelReached:
        metrics.mode === 'stimulate' || metrics.mode === 'vortex' ? 2 : 1,
      metrics: {
        hits: metrics.hits,
        waterTouches: metrics.waterTouches,
        accuracyRate: metrics.accuracyRate,
        visualMotorRate: metrics.visualMotorRate,
      },
      trials: [],
      startedAt: new Date(Date.now() - metrics.durationMs).toISOString(),
      endedAt: ended,
    }).catch(() => undefined);
  };

  return (
    <ClassicSensoryRoomFrame>
      <SensorySanctuary
        childId={childId}
        onSessionComplete={onComplete}
        backHref={PARENT_ROUTES.games}
      />
    </ClassicSensoryRoomFrame>
  );
}

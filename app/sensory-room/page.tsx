'use client';

import { useCallback, useMemo, useState } from 'react';
import SensorySanctuary from '@/components/SensorySanctuary';
import ClassicSensoryRoomFrame from '@/components/sensory-hub/ClassicSensoryRoomFrame';
import SensorySessionResultsPanel from '@/components/sensory-hub/SensorySessionResultsPanel';
import { useSensorySessionNavigator } from '@/components/sensory-hub/useSensorySessionNavigator';
import {
  SENSORY_SANCTUARY_GAME_CODE,
  resolveSensoryChildId,
  type SensorySessionMetrics,
} from '@/lib/sensorySanctuary';
import { saveGameSession } from '@/lib/gameSession';
import { resolveSensorySessionPlan } from '@/lib/sensorySessionPlan';
import type { SensorySessionEndReason } from '@/lib/sensorySessionEnd';

function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function SensoryRoomHomePage() {
  const plan = useMemo(
    () => resolveSensorySessionPlan({ pathname: '/sensory-room' }),
    []
  );
  const [replayKey, setReplayKey] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'results'>('playing');
  const [endReason, setEndReason] = useState<SensorySessionEndReason>('time');
  const [lastMetrics, setLastMetrics] = useState<SensorySessionMetrics | null>(null);

  const saveGame = useCallback((metrics: SensorySessionMetrics) => {
    const ended = new Date().toISOString();
    void saveGameSession({
      childId: resolveSensoryChildId(),
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
  }, []);

  const { navigateFinalExit } = useSensorySessionNavigator({
    pathname: '/sensory-room',
  });

  const onSessionStop = useCallback(
    (metrics: SensorySessionMetrics, reason: SensorySessionEndReason) => {
      saveGame(metrics);
      setLastMetrics(metrics);
      setEndReason(reason);
      setPhase('results');
    },
    [saveGame]
  );

  const replay = useCallback(() => {
    setPhase('playing');
    setLastMetrics(null);
    setReplayKey((k) => k + 1);
  }, []);

  const resultStats = lastMetrics
    ? [
        { labelAr: 'المدة', labelEn: 'Duration', value: formatDuration(lastMetrics.durationMs) },
        { labelAr: 'إصابات', labelEn: 'Hits', value: lastMetrics.hits },
        { labelAr: 'لمس ماء', labelEn: 'Water', value: lastMetrics.waterTouches },
        { labelAr: 'الدقة', labelEn: 'Accuracy', value: `${lastMetrics.accuracyRate}%` },
      ]
    : [];

  return (
    <ClassicSensoryRoomFrame>
      <div className="relative h-full min-h-0">
        <SensorySanctuary
          key={replayKey}
          onSessionStop={onSessionStop}
          sessionDurationSec={plan.durationSec}
          maxInteractions={plan.maxInteractions}
          sessionPaused={phase === 'results'}
        />
        {phase === 'results' && lastMetrics ? (
          <SensorySessionResultsPanel
            isAr
            titleAr="الغرفة الحسية"
            titleEn="Sensory room"
            endReason={endReason}
            stats={resultStats}
            onReplay={replay}
            onExitGroup={() => void navigateFinalExit()}
            variant="dark"
          />
        ) : null}
      </div>
    </ClassicSensoryRoomFrame>
  );
}

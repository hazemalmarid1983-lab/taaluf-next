import {
  buildSensorySessionMetrics,
  DEFAULT_SENSORY_SETTINGS,
} from './sensoryHub';
import { persistSensoryHubSession } from './sensoryHubSession';

export const SENSORY_SANCTUARY_GAME_CODE = 'sensory_sanctuary' as const;
export const SENSORY_SANCTUARY_LOCAL_KEY = 'taaluf_game_sensory_sanctuary';

export type SensoryMode = 'calm' | 'stimulate' | 'pond' | 'vortex';

export type SensorySessionMetrics = {
  gameCode: typeof SENSORY_SANCTUARY_GAME_CODE;
  mode: SensoryMode;
  hue: number;
  /** إجمالي اللمسات (إصابات + تموجات) */
  interactions: number;
  hits: number;
  waterTouches: number;
  /** نسبة التآزر البصري الحركي 0–100 */
  accuracyRate: number;
  visualMotorRate: number;
  durationMs: number;
  scoring: 'child_playable';
};

export function sensoryAccuracyRate(hits: number, waterTouches: number) {
  const total = hits + waterTouches;
  if (total <= 0) return 0;
  return Math.round((hits / total) * 100);
}

export function sensoryChipDetail(metrics: {
  hits?: number;
  waterTouches?: number;
  accuracyRate?: number;
  visualMotorRate?: number;
}) {
  const hits = Math.round(Number(metrics.hits ?? 0));
  const water = Math.round(Number(metrics.waterTouches ?? 0));
  const rate = Math.round(
    Number(metrics.visualMotorRate ?? metrics.accuracyRate ?? 0)
  );
  return `${hits} إصابة 🎯 · ${water} تموج 💧 · ${rate}% تآزر بصري حركي`;
}

export function resolveSensoryChildId(childId?: string) {
  if (childId) return childId;
  if (typeof window === 'undefined') return 'child_local';
  try {
    const s = JSON.parse(localStorage.getItem('taaluf.activeStudent') || 'null');
    return s?.id || 'child_local';
  } catch {
    return 'child_local';
  }
}

/** يحفظ رصد الجلسة في السجل التراكمي المحلي للطفل */
export function persistSensorySanctuaryResult(
  metrics: SensorySessionMetrics,
  childId?: string
) {
  if (typeof window === 'undefined') return;
  const id = resolveSensoryChildId(childId);
  const completedAt = new Date().toISOString();
  const snapshot = {
    childId: id,
    completedAt,
    domain: 'تآزر بصري حركي',
    metrics: {
      hits: metrics.hits,
      waterTouches: metrics.waterTouches,
      accuracyRate: metrics.accuracyRate,
      visualMotorRate: metrics.visualMotorRate,
    },
  };
  try {
    localStorage.setItem(
      SENSORY_SANCTUARY_LOCAL_KEY,
      JSON.stringify(snapshot)
    );
  } catch {
    /* ignore */
  }
  try {
    const key = 'taaluf.gameSessions.v1';
    const prev = JSON.parse(localStorage.getItem(key) || '[]');
    const list = Array.isArray(prev) ? prev : [];
    const sessionId = `local_${SENSORY_SANCTUARY_GAME_CODE}_${id}`;
    const session = {
      id: sessionId,
      childId: id,
      gameCode: SENSORY_SANCTUARY_GAME_CODE,
      score: metrics.visualMotorRate,
      levelReached:
        metrics.mode === 'stimulate' || metrics.mode === 'vortex' ? 2 : 1,
      metrics: snapshot.metrics,
      trials: [],
      startedAt: new Date(Date.now() - (metrics.durationMs || 0)).toISOString(),
      endedAt: completedAt,
    };
    const next = [session, ...list.filter((s: { id?: string }) => s?.id !== sessionId)].slice(
      0,
      40
    );
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }

  try {
    const startedMs = Date.now() - (metrics.durationMs || 0);
    const step =
      metrics.interactions > 0
        ? metrics.durationMs / (metrics.interactions + 1)
        : metrics.durationMs;
    const stamps = Array.from({ length: metrics.interactions }, (_, i) =>
      Math.round(startedMs + step * (i + 1))
    );
    persistSensoryHubSession(
      buildSensorySessionMetrics({
        roomId: 'classic',
        childId: id,
        durationMs: metrics.durationMs,
        interactions: metrics.interactions,
        interactionTimestamps: stamps,
        sessionStartMs: startedMs,
        settings: DEFAULT_SENSORY_SETTINGS,
        startedAt: new Date(startedMs).toISOString(),
        endedAt: completedAt,
      })
    );
  } catch {
    /* ignore */
  }
}

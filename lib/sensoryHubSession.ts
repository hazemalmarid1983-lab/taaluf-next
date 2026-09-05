/**
 * حفظ مقاييس جلسات جناح الغرف الحسية محلياً للربط بملف الطفل.
 */

import { resolveSensoryChildId } from './sensorySanctuary';
import {
  SENSORY_HUB_STORAGE_KEY,
  type SensoryHubSessionMetrics,
} from './sensoryHub';

export function persistSensoryHubSession(metrics: SensoryHubSessionMetrics) {
  if (typeof window === 'undefined') return;
  const childId = metrics.childId || resolveSensoryChildId();
  const record = { ...metrics, childId };

  try {
    const raw = localStorage.getItem(SENSORY_HUB_STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as SensoryHubSessionMetrics[]) : [];
    const next = [record, ...(Array.isArray(list) ? list : [])].slice(0, 60);
    localStorage.setItem(SENSORY_HUB_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }

  try {
    const key = 'taaluf.gameSessions.v1';
    const prev = JSON.parse(localStorage.getItem(key) || '[]');
    const list = Array.isArray(prev) ? prev : [];
    const sessionId = `local_sensory_hub_${metrics.roomId}_${childId}_${Date.now()}`;
    const session = {
      id: sessionId,
      childId,
      gameCode: `sensory_hub_${metrics.roomId}`,
      score: metrics.calmIndex,
      levelReached: 1,
      metrics: {
        durationMs: metrics.durationMs,
        interactions: metrics.interactions,
        interactionRate: metrics.interactionRate,
        interactionBursts: metrics.interactionBursts,
        activeRatio: metrics.activeRatio,
        calmIndex: metrics.calmIndex,
        engagementIndex: metrics.engagementIndex,
        breathingCycles: metrics.breathingCycles ?? 0,
      },
      trials: [],
      startedAt: metrics.startedAt,
      endedAt: metrics.endedAt,
    };
    localStorage.setItem(
      key,
      JSON.stringify([session, ...list].slice(0, 40))
    );
  } catch {
    /* ignore */
  }
}

export function loadSensoryHubSessions(childId?: string) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SENSORY_HUB_STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as SensoryHubSessionMetrics[]) : [];
    if (!childId) return Array.isArray(list) ? list : [];
    return (Array.isArray(list) ? list : []).filter((s) => s.childId === childId);
  } catch {
    return [];
  }
}

export type SensoryHubSessionsSummary = {
  totalSessions: number;
  totalMinutes: number;
  avgCalmIndex: number;
  avgEngagementIndex: number;
  totalInteractions: number;
  avgInteractionRate: number;
  byRoom: Array<{
    roomId: string;
    count: number;
    avgCalm: number;
    avgEngagement: number;
    totalMinutes: number;
  }>;
  recent: SensoryHubSessionMetrics[];
};

export function summarizeSensoryHubSessions(
  sessions: SensoryHubSessionMetrics[]
): SensoryHubSessionsSummary {
  const list = sessions.filter((s) => s.durationMs > 0);
  const totalMs = list.reduce((sum, s) => sum + s.durationMs, 0);
  const totalInteractions = list.reduce((sum, s) => sum + s.interactions, 0);
  const avgCalmIndex = list.length
    ? Math.round(list.reduce((sum, s) => sum + s.calmIndex, 0) / list.length)
    : 0;
  const avgEngagementIndex = list.length
    ? Math.round(
        list.reduce((sum, s) => sum + (s.engagementIndex ?? 0), 0) / list.length
      )
    : 0;
  const avgInteractionRate = list.length
    ? Math.round(
        (list.reduce((sum, s) => sum + (s.interactionRate ?? 0), 0) /
          list.length) *
          10
      ) / 10
    : 0;

  const roomMap = new Map<
    string,
    { count: number; calm: number; engagement: number; ms: number }
  >();
  for (const s of list) {
    const prev = roomMap.get(s.roomId) || {
      count: 0,
      calm: 0,
      engagement: 0,
      ms: 0,
    };
    roomMap.set(s.roomId, {
      count: prev.count + 1,
      calm: prev.calm + s.calmIndex,
      engagement: prev.engagement + (s.engagementIndex ?? 0),
      ms: prev.ms + s.durationMs,
    });
  }

  const byRoom = [...roomMap.entries()]
    .map(([roomId, stats]) => ({
      roomId,
      count: stats.count,
      avgCalm: Math.round(stats.calm / stats.count),
      avgEngagement: Math.round(stats.engagement / stats.count),
      totalMinutes: Math.round(stats.ms / 60000),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalSessions: list.length,
    totalMinutes: Math.round(totalMs / 60000),
    avgCalmIndex,
    avgEngagementIndex,
    totalInteractions,
    avgInteractionRate,
    byRoom,
    recent: [...list]
      .sort(
        (a, b) =>
          new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime()
      )
      .slice(0, 5),
  };
}

export function formatSensorySessionDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m <= 0) return `${s}s`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

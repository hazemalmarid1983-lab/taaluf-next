import {
  formatSensorySessionDuration,
  summarizeSensoryHubSessions,
} from '../lib/sensoryHubSession';
import type { SensoryHubSessionMetrics } from '../lib/sensoryHub';

describe('sensory hub session summary', () => {
  const sample: SensoryHubSessionMetrics[] = [
    {
      roomId: 'sand',
      childId: 'c1',
      durationMs: 120_000,
      interactions: 10,
      calmIndex: 72,
      settings: { volume: 0.4, brightness: 0.7, sensitivity: 0.6 },
      startedAt: '2026-09-01T10:00:00.000Z',
      endedAt: '2026-09-01T10:02:00.000Z',
    },
    {
      roomId: 'animals',
      childId: 'c1',
      durationMs: 60_000,
      interactions: 4,
      calmIndex: 68,
      settings: { volume: 0.4, brightness: 0.7, sensitivity: 0.6 },
      startedAt: '2026-09-02T10:00:00.000Z',
      endedAt: '2026-09-02T10:01:00.000Z',
    },
  ];

  it('summarizes sessions by room and calm index', () => {
    const summary = summarizeSensoryHubSessions(sample);
    expect(summary.totalSessions).toBe(2);
    expect(summary.totalMinutes).toBe(3);
    expect(summary.avgCalmIndex).toBe(70);
    expect(summary.byRoom).toHaveLength(2);
  });

  it('formats duration strings', () => {
    expect(formatSensorySessionDuration(90_000)).toBe('1:30');
    expect(formatSensorySessionDuration(30_000)).toBe('30s');
  });
});

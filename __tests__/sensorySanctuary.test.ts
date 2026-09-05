import { readChildPathwayRecord } from '../lib/childPathwayRecord';
import {
  persistSensorySanctuaryResult,
  sensoryAccuracyRate,
  sensoryChipDetail,
  SENSORY_SANCTUARY_GAME_CODE,
  SENSORY_SANCTUARY_LOCAL_KEY,
  type SensorySessionMetrics,
} from '../lib/sensorySanctuary';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  Object.defineProperty(global, 'window', { value: global, writable: true });
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, String(v)),
      removeItem: (k: string) => memory.delete(k),
    },
  });
});

function sampleMetrics(
  hits: number,
  waterTouches: number
): SensorySessionMetrics {
  const accuracyRate = sensoryAccuracyRate(hits, waterTouches);
  return {
    gameCode: SENSORY_SANCTUARY_GAME_CODE,
    mode: 'pond',
    hue: 185,
    interactions: hits + waterTouches,
    hits,
    waterTouches,
    accuracyRate,
    visualMotorRate: accuracyRate,
    durationMs: 12_000,
    scoring: 'child_playable',
  };
}

describe('sensory sanctuary scoring', () => {
  it('uses a stable playable game code for session storage', () => {
    expect(SENSORY_SANCTUARY_GAME_CODE).toBe('sensory_sanctuary');
  });

  it('counts accuracy only from hits versus water touches', () => {
    expect(sensoryAccuracyRate(0, 0)).toBe(0);
    expect(sensoryAccuracyRate(3, 1)).toBe(75);
    expect(sensoryAccuracyRate(1, 3)).toBe(25);
    expect(sensoryAccuracyRate(0, 8)).toBe(0);
    expect(sensoryAccuracyRate(4, 0)).toBe(100);
  });

  it('does not treat empty-water ripples as catches', () => {
    const metrics = sampleMetrics(2, 6);
    expect(metrics.hits).toBe(2);
    expect(metrics.waterTouches).toBe(6);
    expect(metrics.interactions).toBe(8);
    expect(metrics.visualMotorRate).toBe(25);
  });

  it('persists hits, misses, and visual-motor rate on the child record', () => {
    persistSensorySanctuaryResult(sampleMetrics(5, 5), 'child_1');
    const stored = JSON.parse(memory.get(SENSORY_SANCTUARY_LOCAL_KEY) || '{}');
    expect(stored.childId).toBe('child_1');
    expect(stored.domain).toBe('تآزر بصري حركي');
    expect(stored.metrics).toEqual({
      hits: 5,
      waterTouches: 5,
      accuracyRate: 50,
      visualMotorRate: 50,
    });

    const sessions = JSON.parse(memory.get('taaluf.gameSessions.v1') || '[]');
    const sanctuarySession = sessions.find(
      (s: { gameCode?: string }) => s.gameCode === SENSORY_SANCTUARY_GAME_CODE
    );
    expect(sanctuarySession.score).toBe(50);
    expect(sanctuarySession.metrics.hits).toBe(5);
    expect(sanctuarySession.metrics.waterTouches).toBe(5);

    const hubSession = sessions.find(
      (s: { gameCode?: string }) => s.gameCode === 'sensory_hub_classic'
    );
    expect(hubSession?.metrics?.engagementIndex).toBeGreaterThan(0);

    const record = readChildPathwayRecord('child_1');
    expect(record.games[0].title).toBe('الغرفة الحسية · بحيرة الأسماك');
    expect(record.games[0].detail).toBe(sensoryChipDetail(stored.metrics));
    expect(record.games[0].detail).toContain('5 إصابة');
    expect(record.games[0].detail).toContain('5 تموج');
    expect(record.games[0].detail).toContain('50% تآزر بصري حركي');
  });
});

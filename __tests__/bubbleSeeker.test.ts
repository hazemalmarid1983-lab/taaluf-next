import {
  BUBBLE_SEEKER_CRITERIA,
  BUBBLE_SEEKER_DOMAIN_LABEL,
  BUBBLE_SEEKER_GAME_CODE,
  BUBBLE_SEEKER_LOCAL_KEY,
  buildBubbleSeekerMetrics,
  isBubbleHit,
  nearestHitIndex,
  persistBubbleSeekerLocalResult,
  unitRate,
} from '../lib/bubbleSeeker';
import { gameResultToCriteriaScores, loadStoredGameScores } from '../lib/fusion';

describe('صائد الفقاعات', () => {
  it('scores a perfect joint-attention run', () => {
    const metrics = buildBubbleSeekerMetrics({
      attempts: 8,
      jointSuccesses: 8,
      latencies: [400, 500, 600, 450, 480, 520, 410, 430],
    });
    expect(metrics.jointAttentionRate).toBe(100);
    expect(metrics.trackingAccuracy).toBe(1);
    expect(metrics.avgLatencyMs).toBe(474);
    expect(metrics.linkedCriteria).toEqual([...BUBBLE_SEEKER_CRITERIA]);
  });

  it('treats missed targets as higher support need', () => {
    const metrics = buildBubbleSeekerMetrics({
      attempts: 8,
      jointSuccesses: 0,
      latencies: [],
    });
    expect(metrics.jointAttentionRate).toBe(0);
    const scores = gameResultToCriteriaScores({
      gameCode: BUBBLE_SEEKER_GAME_CODE,
      trackingAccuracy: metrics.trackingAccuracy,
      jointAttentionRate: metrics.jointAttentionRate,
    });
    const byId = Object.fromEntries(scores.map((s) => [s.criterionId, s.score]));
    expect(byId.C11).toBe(3);
    expect(byId.C12).toBe(3);
  });

  it('maps a mid run onto C11/C12', () => {
    const scores = gameResultToCriteriaScores({
      gameCode: BUBBLE_SEEKER_GAME_CODE,
      jointAttentionRate: 50,
    });
    const byId = Object.fromEntries(scores.map((s) => [s.criterionId, s.score]));
    expect(byId.C11).toBe(2);
    expect(byId.C12).toBe(2);
  });

  it('normalizes percent and unit rates', () => {
    expect(unitRate(1)).toBe(1);
    expect(unitRate(50)).toBe(0.5);
    expect(unitRate(0)).toBe(0);
  });

  it('picks the nearest bubble under the pointer', () => {
    const bubbles = [
      { x: 40, y: 40, radius: 32 },
      { x: 80, y: 40, radius: 42 },
    ];
    expect(isBubbleHit(40, 40, bubbles[0])).toBe(true);
    expect(nearestHitIndex(78, 40, bubbles)).toBe(1);
    expect(nearestHitIndex(400, 400, bubbles)).toBe(-1);
  });

  it('persists the page result for radar fusion', () => {
    const store: Record<string, string> = {};
    const local = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
    };
    Object.defineProperty(global, 'window', { value: global, writable: true });
    Object.defineProperty(global, 'localStorage', {
      value: local,
      writable: true,
    });

    const metrics = buildBubbleSeekerMetrics({
      attempts: 8,
      jointSuccesses: 4,
      latencies: [800, 900, 700, 750],
    });
    const saved = persistBubbleSeekerLocalResult(metrics, 'child_local');
    expect(saved?.gameId).toBe(BUBBLE_SEEKER_GAME_CODE);
    expect(saved?.domain).toBe(BUBBLE_SEEKER_DOMAIN_LABEL);
    expect(JSON.parse(store[BUBBLE_SEEKER_LOCAL_KEY]).metrics.jointAttentionRate).toBe(
      50
    );

    const fused = loadStoredGameScores('child_local');
    const byId = Object.fromEntries(fused.map((s) => [s.criterionId, s.score]));
    expect(byId.C11).toBe(2);
    expect(byId.C12).toBe(2);
  });
});

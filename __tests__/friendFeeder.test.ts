import {
  FRIEND_FEEDER_CRITERIA,
  FRIEND_FEEDER_GAME_CODE,
  FRIEND_FEEDER_LOCAL_KEY,
  buildFriendFeederMetrics,
  persistFriendFeederLocalResult,
} from '../lib/friendFeeder';
import { gameResultToCriteriaScores, loadStoredGameScores } from '../lib/fusion';

describe('إطعام صديق الغابة', () => {
  it('scores a calm perfect wait run highly', () => {
    const metrics = buildFriendFeederMetrics({
      successfulWaits: 6,
      impulsiveClicks: 0,
    });
    expect(metrics.turnTakingRate).toBe(100);
    expect(metrics.linkedCriteria).toEqual([...FRIEND_FEEDER_CRITERIA]);
    const scores = gameResultToCriteriaScores({
      gameCode: FRIEND_FEEDER_GAME_CODE,
      turnTakingRate: metrics.turnTakingAccuracy,
    });
    const byId = Object.fromEntries(scores.map((s) => [s.criterionId, s.score]));
    expect(byId.C18).toBe(0);
    expect(byId.C19).toBe(0);
  });

  it('raises support need when the child never waits', () => {
    const metrics = buildFriendFeederMetrics({
      successfulWaits: 0,
      impulsiveClicks: 12,
    });
    const scores = gameResultToCriteriaScores({
      gameCode: FRIEND_FEEDER_GAME_CODE,
      turnTakingRate: metrics.turnTakingAccuracy,
    });
    const byId = Object.fromEntries(scores.map((s) => [s.criterionId, s.score]));
    expect(byId.C18).toBe(3);
    expect(byId.C19).toBe(3);
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

    const metrics = buildFriendFeederMetrics({
      successfulWaits: 3,
      impulsiveClicks: 0,
    });
    persistFriendFeederLocalResult(metrics, 'child_local');
    expect(JSON.parse(store[FRIEND_FEEDER_LOCAL_KEY]).gameId).toBe(
      FRIEND_FEEDER_GAME_CODE
    );
    const fused = loadStoredGameScores('child_local');
    const byId = Object.fromEntries(fused.map((s) => [s.criterionId, s.score]));
    expect(byId.C18).toBeDefined();
    expect(byId.C19).toBeDefined();
  });
});

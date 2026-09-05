import {
  buildLittleHeroResult,
  concernFromSuccessRate,
  type StageTrial,
} from '../lib/littleHero';
import { gameResultToCriteriaScores } from '../lib/fusion';

function trial(
  stage: StageTrial['stage'],
  promptId: string,
  success: boolean,
  distracted = false
): StageTrial {
  return {
    stage,
    promptId,
    success,
    distracted,
    responseMs: 800,
    at: '2026-08-14T00:00:00.000Z',
  };
}

describe('مغامرة البطل الصغير', () => {
  it('scores a perfect run at 100 with no distraction', () => {
    const trials = [
      trial('imitation', 'hands_up', true),
      trial('imitation', 'clap', true),
      trial('tracking', 'star_l1', true),
      trial('tracking', 'star_l2', true),
      trial('emotions', 'joy', true),
      trial('emotions', 'sad', true),
    ];
    const result = buildLittleHeroResult({
      trials,
      startedAt: '2026-08-14T00:00:00.000Z',
    });
    expect(result.score).toBe(100);
    expect(result.metrics.imitationRate).toBe(1);
    expect(result.metrics.trackingAccuracy).toBe(1);
    expect(result.metrics.emotionAccuracy).toBe(1);
    expect(result.metrics.distractionRate).toBe(0);
    expect(result.metrics.avgResponseMs).toBe(800);
  });

  it('maps adventure metrics onto Taaluf criteria', () => {
    const scores = gameResultToCriteriaScores({
      gameCode: 'little_hero',
      imitationRate: 1,
      trackingAccuracy: 0.5,
      emotionAccuracy: 0,
    });
    const byId = Object.fromEntries(scores.map((s) => [s.criterionId, s.score]));
    expect(byId.C15).toBe(0);
    expect(byId.C12).toBe(2);
    expect(byId.C17).toBe(3);
    expect(byId.C32).toBe(3);
  });

  it('converts success rate to concern 0–3', () => {
    expect(concernFromSuccessRate(1)).toBe(0);
    expect(concernFromSuccessRate(0)).toBe(3);
    expect(concernFromSuccessRate(0.5)).toBe(2);
  });
});

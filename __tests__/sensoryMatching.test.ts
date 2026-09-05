import {
  buildMatchRound,
  buildSensoryMatchingMetrics,
  isCorrectChoice,
  matchingAccuracyRate,
  persistSensoryMatchingResult,
  SENSORY_MATCHING_GAME_CODE,
  SENSORY_MATCHING_LOCAL_KEY,
  SENSORY_MATCHING_TOTAL_ROUNDS,
} from '../lib/sensoryMatching';
import { readChildPathwayRecord } from '../lib/childPathwayRecord';
import { gameResultToCriteriaScores } from '../lib/fusion';

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

describe('sensory matching', () => {
  it('uses a stable game code and 14-round series', () => {
    expect(SENSORY_MATCHING_GAME_CODE).toBe('sensory_matching');
    expect(SENSORY_MATCHING_TOTAL_ROUNDS).toBe(14);
  });

  it('scores identical matches only against the same picture', () => {
    const round = buildMatchRound({
      index: 0,
      mode: 'identical',
      rand: () => 0,
    });
    expect(isCorrectChoice(round, round.prompt.id)).toBe(true);
    const other = round.choices.find((c) => c.id !== round.prompt.id);
    expect(other && isCorrectChoice(round, other.id)).toBe(false);
  });

  it('scores category rounds against the same implicit group', () => {
    const round = buildMatchRound({
      index: 8,
      mode: 'category',
      rand: () => 0,
    });
    const correct = round.choices.find((c) => c.id === round.correctId);
    expect(correct?.category).toBe(round.prompt.category);
    expect(correct?.id).not.toBe(round.prompt.id);
    expect(round.choices.some((c) => c.id === round.prompt.id)).toBe(false);
  });

  it('computes correct attempts, latency, and accuracy', () => {
    expect(matchingAccuracyRate(8, 10)).toBe(80);
    const metrics = buildSensoryMatchingMetrics({
      correctAttempts: 10,
      totalAttempts: 14,
      firstTryCorrect: 8,
      responseTimesMs: [400, 600, 800],
      roundsCompleted: 14,
    });
    expect(metrics.avgResponseMs).toBe(600);
    expect(metrics.accuracyRate).toBe(71);
    expect(metrics.levelReached).toBe('category');
    expect(metrics.linkedCriteria).toEqual(['C21']);
  });

  it('persists the session on the child cumulative record', () => {
    const metrics = buildSensoryMatchingMetrics({
      correctAttempts: 12,
      totalAttempts: 15,
      firstTryCorrect: 10,
      responseTimesMs: [500, 700],
      roundsCompleted: 14,
    });
    persistSensoryMatchingResult(metrics, 'child_1');
    const stored = JSON.parse(memory.get(SENSORY_MATCHING_LOCAL_KEY) || '{}');
    expect(stored.childId).toBe('child_1');
    expect(stored.metrics.correctAttempts).toBe(12);
    expect(stored.metrics.avgResponseMs).toBe(600);
    expect(stored.metrics.accuracyRate).toBe(80);

    const record = readChildPathwayRecord('child_1');
    const chip = record.games.find((g) => g.id === SENSORY_MATCHING_LOCAL_KEY);
    expect(chip?.title).toBe('مطابقة الصور والتعريف الصوتي');
    expect(chip?.detail).toContain('12 صحيحة');
    expect(chip?.detail).toContain('80% دقة');

    const fused = gameResultToCriteriaScores({
      gameCode: SENSORY_MATCHING_GAME_CODE,
      accuracyRate: metrics.accuracyRate,
    });
    expect(fused[0].criterionId).toBe('C21');
    expect(fused[0].score).toBe(1);
  });
});

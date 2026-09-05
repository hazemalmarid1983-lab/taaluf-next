import {
  HOME_SCHEDULE_REWARDS,
  isSensoryScheduleReward,
  reinforcerSecondsRemaining,
  SENSORY_SCHEDULE_REWARDS,
  sensoryRoomHrefFromReward,
} from '../lib/scheduleRewards';

describe('schedule rewards', () => {
  it('includes all sensory room reinforcers', () => {
    expect(SENSORY_SCHEDULE_REWARDS).toHaveLength(9);
    expect(SENSORY_SCHEDULE_REWARDS.every((r) => r.category === 'sensory')).toBe(
      true
    );
  });

  it('detects sensory rewards and resolves href', () => {
    const sensory = SENSORY_SCHEDULE_REWARDS[0];
    expect(isSensoryScheduleReward(sensory)).toBe(true);
    expect(isSensoryScheduleReward(HOME_SCHEDULE_REWARDS[0])).toBe(false);
    expect(sensoryRoomHrefFromReward(sensory)).toMatch(/^\/sensory-rooms\//);
  });

  it('computes reinforcer seconds remaining', () => {
    const handoff = {
      href: '/sensory-rooms/sand',
      totalSec: 120,
      startedAt: Date.now() - 30_000,
    };
    expect(reinforcerSecondsRemaining(handoff)).toBeLessThanOrEqual(90);
    expect(reinforcerSecondsRemaining(handoff)).toBeGreaterThan(80);
  });
});

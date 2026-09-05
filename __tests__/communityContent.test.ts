import { CRITERIA_LIST, DOMAINS } from '../types/taalof';
import {
  COMMUNITY_CONTENT,
  HOME_STRATEGIES,
  SUPPORT_CIRCLES,
  WEEKLY_CHALLENGES,
  getCommunityByDomain,
  getCommunityForCriteria,
  getFeaturedChallenges,
} from '../lib/communityContent';

describe('community content bank', () => {
  it('covers the four assessment domains with one support circle each', () => {
    expect(COMMUNITY_CONTENT.domains).toEqual(DOMAINS);
    expect(SUPPORT_CIRCLES).toHaveLength(4);
    expect(new Set(SUPPORT_CIRCLES.map((c) => c.domain))).toEqual(
      new Set(DOMAINS)
    );
  });

  it('keeps a weekly-challenge bank and illustrated home strategies', () => {
    expect(WEEKLY_CHALLENGES.length).toBeGreaterThanOrEqual(8);
    expect(getFeaturedChallenges()).toHaveLength(4);
    expect(HOME_STRATEGIES).toHaveLength(8);
    for (const strategy of HOME_STRATEGIES) {
      expect(strategy.panels).toHaveLength(3);
      expect(strategy.visualCue.length).toBeGreaterThan(10);
      expect(strategy.relatedCriteria.length).toBeGreaterThan(0);
    }
  });

  it('links challenges and strategies to existing criteria', () => {
    const ids = new Set(CRITERIA_LIST.map((c) => c.id));
    for (const item of [...WEEKLY_CHALLENGES, ...HOME_STRATEGIES]) {
      const refs =
        'recommendedForCriteria' in item
          ? item.recommendedForCriteria
          : item.relatedCriteria;
      expect(refs.every((id) => ids.has(id))).toBe(true);
    }
  });

  it('returns domain packs and criterion matches', () => {
    const pack = getCommunityByDomain(DOMAINS[0]);
    expect(pack.circle?.id).toBe('circle_comm');
    expect(pack.challenges.some((c) => c.id === 'wc_comm_choice')).toBe(true);
    expect(pack.strategies.length).toBeGreaterThan(0);

    const matched = getCommunityForCriteria(['C1']);
    expect(matched.challenges.some((c) => c.id === 'wc_comm_choice')).toBe(true);
    expect(matched.strategies.some((s) => s.id === 'hs_comm_two_choices')).toBe(
      true
    );
  });
});

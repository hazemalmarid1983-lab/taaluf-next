/**
 * بنك مجتمع تآلف: دوائر دعم، تحديات أسبوعية، واستراتيجيات منزلية مصورة.
 */

import communityData from '@/data/taalof_community_content.json';
import { DOMAINS } from '@/types/taalof';

export type StrategyPanel = {
  order: number;
  caption: string;
};

export type WeeklyChallenge = {
  id: string;
  domain: string;
  featured?: boolean;
  title: string;
  goal: string;
  actionSteps: string[];
  videoDuration: string;
  recommendedForCriteria: string[];
};

export type HomeStrategy = {
  id: string;
  domain: string;
  title: string;
  visualCue: string;
  durationMinutes: number;
  materials: string[];
  relatedCriteria: string[];
  panels: StrategyPanel[];
};

export type SupportCircle = {
  id: string;
  domain: string;
  title: string;
  description: string;
  weeklyChallengeId: string;
  discussionsCount: number;
  activeParents: number;
};

export type CommunityContent = {
  version: string;
  platform: string;
  disclaimer: string;
  domains: string[];
  supportCircles: SupportCircle[];
  weeklyChallenges: WeeklyChallenge[];
  homeStrategies: HomeStrategy[];
};

export const COMMUNITY_CONTENT = communityData as CommunityContent;
export const SUPPORT_CIRCLES = COMMUNITY_CONTENT.supportCircles;
export const WEEKLY_CHALLENGES = COMMUNITY_CONTENT.weeklyChallenges;
export const HOME_STRATEGIES = COMMUNITY_CONTENT.homeStrategies;
export const COMMUNITY_DISCLAIMER = COMMUNITY_CONTENT.disclaimer;

export function getChallengeById(id: string): WeeklyChallenge | undefined {
  return WEEKLY_CHALLENGES.find((c) => c.id === id);
}

export function getFeaturedChallenges(): WeeklyChallenge[] {
  const featured = WEEKLY_CHALLENGES.filter((c) => c.featured);
  return featured.length ? featured : WEEKLY_CHALLENGES.slice(0, 4);
}

export function getCircleWithChallenge(circle: SupportCircle) {
  return {
    ...circle,
    weeklyChallenge: getChallengeById(circle.weeklyChallengeId) || null,
  };
}

export function getCommunityByDomain(domain: string) {
  return {
    domain,
    circle: SUPPORT_CIRCLES.find((c) => c.domain === domain) || null,
    challenges: WEEKLY_CHALLENGES.filter((c) => c.domain === domain),
    strategies: HOME_STRATEGIES.filter((s) => s.domain === domain),
  };
}

/** أنشطة مرتبطة ببنود التقييم ذات الحاجة الأعلى */
export function getCommunityForCriteria(criterionIds: string[]) {
  const wanted = new Set(criterionIds);
  const challenges = WEEKLY_CHALLENGES.filter((c) =>
    c.recommendedForCriteria.some((id) => wanted.has(id))
  );
  const strategies = HOME_STRATEGIES.filter((s) =>
    s.relatedCriteria.some((id) => wanted.has(id))
  );
  const domains = new Set(
    [...challenges, ...strategies].map((item) => item.domain)
  );
  const circles = SUPPORT_CIRCLES.filter((c) => domains.has(c.domain));
  return { circles, challenges, strategies };
}

export function communityDomains(): string[] {
  return COMMUNITY_CONTENT.domains.length
    ? COMMUNITY_CONTENT.domains
    : [...DOMAINS];
}

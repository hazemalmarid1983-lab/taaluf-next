import type {
  AdvisorOnboardingState,
  HubActor,
  HubPost,
  MouState,
} from '@/lib/clinicalHub';
import { HUB_ONBOARDING_POST_ID } from '@/lib/clinicalHub';

export type AdvisorOnboardingStep =
  | 'welcome'
  | 'agreement'
  | 'meeting'
  | 'complete';

export function emptyAdvisorOnboardingState(): AdvisorOnboardingState {
  return {};
}

export function advisorCompletedOnboardingBriefing(posts: HubPost[]) {
  const onboarding = posts.find((p) => p.id === HUB_ONBOARDING_POST_ID);
  return onboarding?.replies.some((r) => r.authorMemberId === 'samer') ?? false;
}

export function resolveAdvisorOnboardingStep(input: {
  actor: HubActor;
  mou: MouState;
  posts: HubPost[];
  onboarding: AdvisorOnboardingState;
}): AdvisorOnboardingStep {
  if (input.actor.role !== 'scientific_advisor') return 'complete';
  if (!input.onboarding.welcomeSeenAt) return 'welcome';
  if (!input.mou.samer.signed) return 'agreement';
  if (!advisorCompletedOnboardingBriefing(input.posts)) return 'meeting';
  return 'complete';
}

export function hubTabForAdvisorOnboardingStep(
  step: AdvisorOnboardingStep
): 'overview' | 'meeting' | 'agreement' {
  if (step === 'agreement') return 'agreement';
  if (step === 'meeting') return 'meeting';
  return 'overview';
}

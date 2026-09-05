import { emptyMouState, HUB_MEMBERS, HUB_ONBOARDING_POST_ID } from '../lib/clinicalHub';
import {
  emptyAdvisorOnboardingState,
  resolveAdvisorOnboardingStep,
} from '../lib/advisorOnboardingFlow';

const samerActor = {
  memberId: 'samer' as const,
  role: 'scientific_advisor' as const,
  nameAr: HUB_MEMBERS.samer.nameAr,
  nameEn: HUB_MEMBERS.samer.nameEn,
  titleAr: HUB_MEMBERS.samer.titleAr,
  titleEn: HUB_MEMBERS.samer.titleEn,
};

describe('advisorOnboardingFlow', () => {
  it('starts with welcome on first visit', () => {
    expect(
      resolveAdvisorOnboardingStep({
        actor: samerActor,
        mou: emptyMouState(),
        posts: [],
        onboarding: emptyAdvisorOnboardingState(),
      })
    ).toBe('welcome');
  });

  it('moves to agreement after welcome', () => {
    expect(
      resolveAdvisorOnboardingStep({
        actor: samerActor,
        mou: emptyMouState(),
        posts: [],
        onboarding: { welcomeSeenAt: '2026-01-01T00:00:00.000Z' },
      })
    ).toBe('agreement');
  });

  it('moves to meeting after MOU sign', () => {
    const mou = emptyMouState();
    mou.samer.signed = true;
    expect(
      resolveAdvisorOnboardingStep({
        actor: samerActor,
        mou,
        posts: [
          {
            id: HUB_ONBOARDING_POST_ID,
            category: 'discussion',
            title: 'First',
            body: 'Body',
            status: 'approved',
            authorRole: 'admin',
            authorName: HUB_MEMBERS.hazem.nameAr,
            authorMemberId: 'hazem',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
            replies: [],
          },
        ],
        onboarding: { welcomeSeenAt: '2026-01-01T00:00:00.000Z' },
      })
    ).toBe('meeting');
  });
});

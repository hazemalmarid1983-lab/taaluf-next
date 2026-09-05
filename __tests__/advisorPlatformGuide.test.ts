import { HUB_ONBOARDING_POST_ID } from '../lib/clinicalHub';
import { defaultHubTab } from '../lib/nextBestActionFlow';

describe('hub onboarding meeting tab', () => {
  it('opens agreement tab first for advisor after welcome (MOU unsigned)', () => {
    const tab = defaultHubTab({
      mouStatus: 'pending',
      pendingCount: 0,
      actorRole: 'scientific_advisor',
      posts: [
        {
          id: HUB_ONBOARDING_POST_ID,
          category: 'discussion',
          title: 'First meeting',
          body: 'Read me',
          status: 'approved',
          authorRole: 'admin',
          authorName: 'حازم',
          authorMemberId: 'hazem',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          replies: [],
        },
      ],
      mou: {
        version: '2026.4-partnership-agreement',
        termYears: 2,
        hazem: { memberId: 'hazem', signed: false },
        samer: { memberId: 'samer', signed: false },
      },
      advisorOnboarding: { welcomeSeenAt: '2026-01-01T00:00:00.000Z' },
    });
    expect(tab).toBe('agreement');
  });

  it('opens meeting after MOU signed without onboarding reply', () => {
    const tab = defaultHubTab({
      mouStatus: 'awaiting_hazem',
      pendingCount: 0,
      actorRole: 'scientific_advisor',
      posts: [
        {
          id: HUB_ONBOARDING_POST_ID,
          category: 'discussion',
          title: 'First meeting',
          body: 'Read me',
          status: 'approved',
          authorRole: 'admin',
          authorName: 'حازم',
          authorMemberId: 'hazem',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          replies: [],
        },
      ],
      mou: {
        version: '2026.4-partnership-agreement',
        termYears: 2,
        hazem: { memberId: 'hazem', signed: false },
        samer: { memberId: 'samer', signed: true },
      },
      advisorOnboarding: { welcomeSeenAt: '2026-01-01T00:00:00.000Z' },
    });
    expect(tab).toBe('meeting');
  });
});

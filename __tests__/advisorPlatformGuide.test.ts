import { HUB_ONBOARDING_POST_ID } from '../lib/clinicalHub';
import { defaultHubTab } from '../lib/nextBestActionFlow';

describe('hub onboarding meeting tab', () => {
  it('opens meeting tab first for advisor without onboarding reply', () => {
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
    });
    expect(tab).toBe('meeting');
  });

  it('opens agreement after advisor replied to onboarding', () => {
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
          authorName: 'حازem',
          authorMemberId: 'hazem',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          replies: [
            {
              id: 'r1',
              authorRole: 'scientific_advisor',
              authorName: 'د. سامer',
              authorMemberId: 'samer',
              body: 'ملاحظاتي',
              createdAt: '2026-01-02',
            },
          ],
        },
      ],
    });
    expect(tab).toBe('agreement');
  });
});

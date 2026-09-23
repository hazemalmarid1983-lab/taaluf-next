import {
  HUB_MEMBERS,
  HUB_ONBOARDING_POST_ID,
  type HubPost,
} from '../lib/clinicalHub';
import {
  hubActivityEvents,
  hubLiveDirectivesUnread,
  hubLiveUnreadPostIds,
  hubUnreadSummary,
} from '../lib/hubUnread';

function makePost(overrides: Partial<HubPost> = {}): HubPost {
  return {
    id: 'hub_test_1',
    category: 'discussion',
    title: 'Test',
    body: 'Body',
    status: 'pending',
    authorRole: 'admin',
    authorName: HUB_MEMBERS.hazem.nameAr,
    authorMemberId: 'hazem',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    replies: [],
    ...overrides,
  };
}

describe('hubUnread', () => {
  it('counts unread posts from the other party for admin', () => {
    const posts = [
      makePost({
        id: HUB_ONBOARDING_POST_ID,
        replies: [
          {
            id: 'r1',
            authorRole: 'admin',
            authorName: HUB_MEMBERS.hazem.nameAr,
            authorMemberId: 'hazem',
            body: 'Hello advisor',
            createdAt: '2026-01-02T10:00:00.000Z',
          },
        ],
      }),
      makePost({
        id: 'hub_prop_1',
        authorMemberId: 'samer',
        authorRole: 'scientific_advisor',
        authorName: HUB_MEMBERS.samer.nameAr,
        createdAt: '2026-01-03T10:00:00.000Z',
        updatedAt: '2026-01-03T10:00:00.000Z',
      }),
    ];

    const summary = hubUnreadSummary(
      {
        posts,
        merhidDirectives: {
          text: 'x',
          updatedAt: '2026-01-01T09:00:00.000Z',
          updatedBy: HUB_MEMBERS.hazem.nameAr,
        },
        readState: { hazem: { lastReadAt: '2026-01-01T12:00:00.000Z' } },
      },
      'hazem'
    );

    expect(summary.postIds).toEqual(['hub_prop_1']);
    expect(summary.count).toBe(1);
  });

  it('does not count the viewer own activity as unread', () => {
    const posts = [
      makePost({
        replies: [
          {
            id: 'r1',
            authorRole: 'scientific_advisor',
            authorName: HUB_MEMBERS.samer.nameAr,
            authorMemberId: 'samer',
            body: 'My note',
            createdAt: '2026-01-02T10:00:00.000Z',
          },
        ],
      }),
    ];

    const summary = hubUnreadSummary(
      {
        posts,
        merhidDirectives: {
          text: 'x',
          updatedAt: '2026-01-01T09:00:00.000Z',
          updatedBy: HUB_MEMBERS.hazem.nameAr,
        },
        readState: { samer: { lastReadAt: '2026-01-01T12:00:00.000Z' } },
      },
      'samer'
    );

    expect(summary.count).toBe(0);
  });

  it('notifies advisor when admin replies on onboarding thread', () => {
    const posts = [
      makePost({
        id: HUB_ONBOARDING_POST_ID,
        replies: [
          {
            id: 'r1',
            authorRole: 'admin',
            authorName: HUB_MEMBERS.hazem.nameAr,
            authorMemberId: 'hazem',
            body: 'Hello advisor',
            createdAt: '2026-01-02T10:00:00.000Z',
          },
        ],
      }),
    ];

    const summary = hubUnreadSummary(
      {
        posts,
        merhidDirectives: {
          text: 'x',
          updatedAt: '2026-01-01T09:00:00.000Z',
          updatedBy: HUB_MEMBERS.hazem.nameAr,
        },
        readState: { samer: { lastReadAt: '2026-01-01T12:00:00.000Z' } },
      },
      'samer'
    );

    expect(summary.postIds).toEqual([HUB_ONBOARDING_POST_ID]);
    expect(summary.count).toBe(1);
  });

  it('detects live activity since a session timestamp', () => {
    const posts = [
      makePost({
        id: 'hub_live',
        replies: [
          {
            id: 'r2',
            authorRole: 'admin',
            authorName: HUB_MEMBERS.hazem.nameAr,
            authorMemberId: 'hazem',
            body: 'New while viewing',
            createdAt: '2026-01-05T10:00:00.000Z',
          },
        ],
      }),
    ];

    const liveIds = hubLiveUnreadPostIds(
      { posts, merhidDirectives: undefined, readState: {} },
      'samer',
      '2026-01-05T09:00:00.000Z'
    );

    expect(liveIds).toEqual(['hub_live']);
  });

  it('flags merhid directive updates for the advisor', () => {
    expect(
      hubLiveDirectivesUnread(
        {
          text: 'Updated',
          updatedAt: '2026-01-05T10:00:00.000Z',
          updatedBy: HUB_MEMBERS.hazem.nameAr,
        },
        'samer',
        '2026-01-05T09:00:00.000Z'
      )
    ).toBe(true);

    expect(
      hubLiveDirectivesUnread(
        {
          text: 'Updated',
          updatedAt: '2026-01-05T10:00:00.000Z',
          updatedBy: HUB_MEMBERS.hazem.nameAr,
        },
        'hazem',
        '2026-01-05T09:00:00.000Z'
      )
    ).toBe(false);
  });

  it('collects post, reply, and status events', () => {
    const events = hubActivityEvents(
      [
        makePost({
          statusChangedAt: '2026-01-04T10:00:00.000Z',
          updatedAt: '2026-01-04T10:00:00.000Z',
        }),
      ],
      {
        text: 'dir',
        updatedAt: '2026-01-04T11:00:00.000Z',
        updatedBy: HUB_MEMBERS.hazem.nameEn,
      }
    );

    expect(events.some((event) => event.kind === 'post')).toBe(true);
    expect(events.some((event) => event.kind === 'status')).toBe(true);
    expect(events.some((event) => event.kind === 'directives')).toBe(true);
  });
});

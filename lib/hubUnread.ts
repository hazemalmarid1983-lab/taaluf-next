import {
  HUB_MEMBERS,
  type ClinicalHubSnapshot,
  type HubMemberId,
  type HubMerhidDirectives,
  type HubPost,
} from '@/lib/clinicalHub';

export type HubReadCursor = {
  lastReadAt: string;
};

export type HubReadState = Partial<Record<HubMemberId, HubReadCursor>>;

export type HubActivityEvent = {
  at: string;
  by: HubMemberId;
  postId?: string;
  kind: 'post' | 'reply' | 'status' | 'directives';
};

export type HubUnreadSummary = {
  count: number;
  postIds: string[];
  hasDirectivesUpdate: boolean;
};

export function hubActivityEvents(
  posts: HubPost[],
  merhidDirectives?: HubMerhidDirectives
): HubActivityEvent[] {
  const events: HubActivityEvent[] = [];

  for (const post of posts) {
    events.push({
      at: post.createdAt,
      by: post.authorMemberId,
      postId: post.id,
      kind: 'post',
    });

    for (const reply of post.replies) {
      events.push({
        at: reply.createdAt,
        by: reply.authorMemberId,
        postId: post.id,
        kind: 'reply',
      });
    }

    if (post.statusChangedAt && post.statusChangedAt > post.createdAt) {
      const lastReplyAt = post.replies.at(-1)?.createdAt;
      if (!lastReplyAt || post.statusChangedAt > lastReplyAt) {
        events.push({
          at: post.statusChangedAt,
          by: 'hazem',
          postId: post.id,
          kind: 'status',
        });
      }
    }
  }

  if (merhidDirectives?.updatedAt) {
    const byAdmin =
      merhidDirectives.updatedBy.trim() === HUB_MEMBERS.hazem.nameAr ||
      merhidDirectives.updatedBy.trim() === HUB_MEMBERS.hazem.nameEn;
    events.push({
      at: merhidDirectives.updatedAt,
      by: byAdmin ? 'hazem' : 'samer',
      kind: 'directives',
    });
  }

  return events;
}

export function hubLastReadAt(
  readState: HubReadState | undefined,
  memberId: HubMemberId
) {
  return readState?.[memberId]?.lastReadAt ?? '';
}

export function hubUnreadSummary(
  snapshot: Pick<
    ClinicalHubSnapshot,
    'posts' | 'merhidDirectives' | 'readState'
  >,
  viewerId: HubMemberId
): HubUnreadSummary {
  const lastRead = hubLastReadAt(snapshot.readState, viewerId);
  const unreadEvents = hubActivityEvents(
    snapshot.posts,
    snapshot.merhidDirectives
  ).filter((event) => event.by !== viewerId && event.at > lastRead);

  const postIds = [
    ...new Set(
      unreadEvents
        .filter((event) => event.postId)
        .map((event) => event.postId as string)
    ),
  ];
  const hasDirectivesUpdate = unreadEvents.some(
    (event) => event.kind === 'directives'
  );

  return {
    count: postIds.length + (hasDirectivesUpdate ? 1 : 0),
    postIds,
    hasDirectivesUpdate,
  };
}

export function hubLiveUnreadPostIds(
  snapshot: Pick<
    ClinicalHubSnapshot,
    'posts' | 'merhidDirectives' | 'readState'
  >,
  viewerId: HubMemberId,
  since: string
): string[] {
  const unreadEvents = hubActivityEvents(
    snapshot.posts,
    snapshot.merhidDirectives
  ).filter((event) => event.by !== viewerId && event.at > since);

  return [
    ...new Set(
      unreadEvents
        .filter((event) => event.postId)
        .map((event) => event.postId as string)
    ),
  ];
}

export function hubLiveDirectivesUnread(
  merhidDirectives: HubMerhidDirectives | undefined,
  viewerId: HubMemberId,
  since: string
) {
  if (!merhidDirectives?.updatedAt || merhidDirectives.updatedAt <= since) {
    return false;
  }
  const by =
    merhidDirectives.updatedBy.trim() === HUB_MEMBERS.hazem.nameAr ||
    merhidDirectives.updatedBy.trim() === HUB_MEMBERS.hazem.nameEn
      ? 'hazem'
      : 'samer';
  return by !== viewerId;
}

export function isHubPostUnread(
  postId: string,
  unreadPostIds: readonly string[]
) {
  return unreadPostIds.includes(postId);
}

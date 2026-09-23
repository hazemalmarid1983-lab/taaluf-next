import {
  hubLiveDirectivesUnread,
  hubLiveUnreadPostIds,
  hubUnreadSummary,
  type HubUnreadSummary,
} from '@/lib/hubUnread';
import type { ClinicalHubSnapshot, HubMemberId } from '@/lib/clinicalHub';

export type HubUnreadState = HubUnreadSummary & {
  livePostIds: string[];
  liveDirectivesUpdate: boolean;
};

export function emptyHubUnreadState(): HubUnreadState {
  return {
    count: 0,
    postIds: [],
    hasDirectivesUpdate: false,
    livePostIds: [],
    liveDirectivesUpdate: false,
  };
}

export function computeHubUnreadState(
  snapshot: ClinicalHubSnapshot,
  memberId: HubMemberId,
  options?: { liveSince?: string | null }
): HubUnreadState {
  const summary = hubUnreadSummary(snapshot, memberId);
  const livePostIds = options?.liveSince
    ? hubLiveUnreadPostIds(snapshot, memberId, options.liveSince)
    : [];
  const liveDirectivesUpdate = options?.liveSince
    ? hubLiveDirectivesUnread(
        snapshot.merhidDirectives,
        memberId,
        options.liveSince
      )
    : false;

  return {
    ...summary,
    livePostIds,
    liveDirectivesUpdate,
  };
}

export function mergedUnreadPostIds(unread: HubUnreadState) {
  return [...new Set([...unread.postIds, ...unread.livePostIds])];
}

export function hubHasUnreadIndicators(unread: HubUnreadState) {
  return (
    unread.count > 0 ||
    unread.livePostIds.length > 0 ||
    unread.hasDirectivesUpdate ||
    unread.liveDirectivesUpdate
  );
}

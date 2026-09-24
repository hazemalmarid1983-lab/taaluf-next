/**
 * ساحة مجتمع تآلف على الخادم: نقاش المسجّلين، محاضرات المشرف، والمنشور التوعوي المجدول.
 */

import { readHubJsonFile, writeHubJsonFile } from '@/lib/hubPersistence';
import {
  dueAwarenessPosts,
  type AwarenessMediaKind,
} from '@/lib/community/awarenessSchedule';

export const COMMUNITY_FEED_FILE = 'community-feed.json';

export const COMMUNITY_STAFF_ROLES = [
  'admin',
  'scientific_advisor',
  'specialist',
] as const;

export function isCommunityStaff(role?: string | null) {
  return COMMUNITY_STAFF_ROLES.includes(
    role as (typeof COMMUNITY_STAFF_ROLES)[number]
  );
}

export type CommunityComment = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
  staff: boolean;
};

export type CommunityPost = {
  id: string;
  kind: 'discussion' | 'lecture' | 'awareness';
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  body: string;
  createdAt: string;
  mediaKind?: AwarenessMediaKind;
  mediaCaption?: string;
  link?: { kind: 'zoom' | 'youtube'; url: string };
  comments: CommunityComment[];
};

type FeedFile = { posts: CommunityPost[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function cleanLine(value: unknown, max: number) {
  return String(value || '')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function parseCommunityFeed(raw: string | null): CommunityPost[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as FeedFile;
    if (!Array.isArray(parsed.posts)) return [];
    return parsed.posts
      .map((item) => {
        if (!isRecord(item)) return null;
        const kind = item.kind;
        if (kind !== 'discussion' && kind !== 'lecture' && kind !== 'awareness') {
          return null;
        }
        const comments = Array.isArray(item.comments)
          ? item.comments.flatMap((comment) => {
              if (!isRecord(comment) || !cleanLine(comment.body, 800)) return [];
              const row: CommunityComment = {
                id: cleanLine(comment.id, 80) || `c_${comment.createdAt}`,
                authorId: cleanLine(comment.authorId, 80),
                authorName: cleanLine(comment.authorName, 80) || 'مسجّل',
                authorRole: cleanLine(comment.authorRole, 40),
                body: cleanLine(comment.body, 800),
                createdAt: cleanLine(comment.createdAt, 40),
                staff: Boolean(comment.staff),
              };
              return [row];
            })
          : [];
        const post: CommunityPost = {
          id: cleanLine(item.id, 80),
          kind,
          authorId: cleanLine(item.authorId, 80),
          authorName: cleanLine(item.authorName, 80) || 'مسجّل',
          authorRole: cleanLine(item.authorRole, 40),
          title: cleanLine(item.title, 140),
          body: cleanLine(item.body, 2000),
          createdAt: cleanLine(item.createdAt, 40),
          comments,
        };
        if (!post.id || !post.title || !post.body) return null;
        if (item.mediaKind === 'image' || item.mediaKind === 'video') {
          post.mediaKind = item.mediaKind;
          post.mediaCaption = cleanLine(item.mediaCaption, 160);
        }
        if (isRecord(item.link)) {
          const linkKind = item.link.kind;
          const url = cleanLine(item.link.url, 400);
          if ((linkKind === 'zoom' || linkKind === 'youtube') && url.startsWith('https://')) {
            post.link = { kind: linkKind, url };
          }
        }
        return post;
      })
      .filter((item): item is CommunityPost => Boolean(item));
  } catch {
    return [];
  }
}

export function sortedFeed(posts: CommunityPost[]) {
  return [...posts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function withDueAwareness(posts: CommunityPost[], now = new Date()) {
  const due = dueAwarenessPosts(now, new Set(posts.map((post) => post.id)));
  if (due.length === 0) return { posts, added: [] as CommunityPost[] };
  const added: CommunityPost[] = due.map((item) => ({
    id: item.id,
    kind: 'awareness',
    authorId: 'taaluf_awareness',
    authorName: 'مجتمع تآلف',
    authorRole: 'awareness',
    title: item.title,
    body: item.body,
    createdAt: item.createdAt,
    mediaKind: item.mediaKind,
    mediaCaption: item.mediaCaption,
    comments: [],
  }));
  return { posts: [...posts, ...added], added };
}

type Author = { id: string; name: string; role: string };

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addDiscussion(
  posts: CommunityPost[],
  author: Author,
  title: string,
  body: string
): { ok: true; posts: CommunityPost[]; post: CommunityPost } | { ok: false; error: string } {
  const cleanTitle = cleanLine(title, 140);
  const cleanBody = cleanLine(body, 2000);
  if (cleanTitle.length < 3 || cleanBody.length < 3) {
    return { ok: false, error: 'TEXT_REQUIRED' };
  }
  const post: CommunityPost = {
    id: newId('disc'),
    kind: 'discussion',
    authorId: author.id,
    authorName: author.name || 'مسجّل',
    authorRole: author.role,
    title: cleanTitle,
    body: cleanBody,
    createdAt: new Date().toISOString(),
    comments: [],
  };
  return { ok: true, posts: [post, ...posts].slice(0, 200), post };
}

export function addLecture(
  posts: CommunityPost[],
  author: Author,
  input: {
    title: string;
    body: string;
    link?: { kind: 'zoom' | 'youtube'; url: string };
  }
): { ok: true; posts: CommunityPost[]; post: CommunityPost } | { ok: false; error: string } {
  const cleanTitle = cleanLine(input.title, 140);
  const cleanBody = cleanLine(input.body, 2000);
  if (cleanTitle.length < 3 || cleanBody.length < 3) {
    return { ok: false, error: 'TEXT_REQUIRED' };
  }
  const post: CommunityPost = {
    id: newId('lecture'),
    kind: 'lecture',
    authorId: author.id,
    authorName: author.name || 'المشرف',
    authorRole: author.role,
    title: cleanTitle,
    body: cleanBody,
    createdAt: new Date().toISOString(),
    link: input.link,
    comments: [],
  };
  return { ok: true, posts: [post, ...posts].slice(0, 200), post };
}

export function addComment(
  posts: CommunityPost[],
  postId: string,
  author: Author,
  body: string
): { ok: true; posts: CommunityPost[]; post: CommunityPost } | { ok: false; error: string } {
  const cleanBody = cleanLine(body, 800);
  if (cleanBody.length < 2) return { ok: false, error: 'TEXT_REQUIRED' };
  const index = posts.findIndex((post) => post.id === postId);
  if (index < 0) return { ok: false, error: 'POST_NOT_FOUND' };
  const comment: CommunityComment = {
    id: newId('c'),
    authorId: author.id,
    authorName: author.name || 'مسجّل',
    authorRole: author.role,
    body: cleanBody,
    createdAt: new Date().toISOString(),
    staff: isCommunityStaff(author.role),
  };
  const post: CommunityPost = {
    ...posts[index],
    comments: [...posts[index].comments, comment].slice(-40),
  };
  const next = [...posts];
  next[index] = post;
  return { ok: true, posts: next, post };
}

export async function loadCommunityPosts(now = new Date()): Promise<CommunityPost[]> {
  const current = parseCommunityFeed(await readHubJsonFile(COMMUNITY_FEED_FILE));
  const merged = withDueAwareness(current, now);
  if (merged.added.length > 0) {
    await writeHubJsonFile(
      COMMUNITY_FEED_FILE,
      JSON.stringify({ posts: merged.posts })
    );
  }
  return sortedFeed(merged.posts);
}

export async function saveCommunityPosts(posts: CommunityPost[]): Promise<void> {
  await writeHubJsonFile(COMMUNITY_FEED_FILE, JSON.stringify({ posts }));
}

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { classifyCommunityLink } from '@/lib/community/awarenessSchedule';
import {
  addComment,
  addDiscussion,
  addLecture,
  isCommunityStaff,
  loadCommunityPosts,
  saveCommunityPosts,
  sortedFeed,
} from '@/lib/community/feedStore';

function authorFrom(session: {
  user?: { id?: string; name?: string | null; role?: string };
}) {
  return {
    id: session.user?.id || '',
    name: session.user?.name || 'مسجّل',
    role: session.user?.role || '',
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const posts = await loadCommunityPosts();
  return NextResponse.json({
    ok: true,
    posts,
    staff: isCommunityStaff(session.user.role),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    action?: string;
    title?: string;
    body?: string;
    postId?: string;
    link?: string;
  } | null;
  const posts = await loadCommunityPosts();
  const author = authorFrom(session);

  if (body?.action === 'comment') {
    const saved = addComment(posts, body.postId || '', author, body.body || '');
    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: 400 });
    }
    await saveCommunityPosts(saved.posts);
    return NextResponse.json({ ok: true, post: saved.post });
  }

  if (body?.action === 'lecture') {
    if (!isCommunityStaff(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    let link: { kind: 'zoom' | 'youtube'; url: string } | undefined;
    if (body.link?.trim()) {
      const classified = classifyCommunityLink(body.link);
      if (!classified.ok) {
        return NextResponse.json({ error: classified.error }, { status: 400 });
      }
      link = { kind: classified.kind, url: classified.url };
    }
    const saved = addLecture(posts, author, {
      title: body.title || '',
      body: body.body || '',
      link,
    });
    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: 400 });
    }
    await saveCommunityPosts(saved.posts);
    return NextResponse.json({ ok: true, post: saved.post });
  }

  const saved = addDiscussion(posts, author, body?.title || '', body?.body || '');
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 400 });
  }
  await saveCommunityPosts(sortedFeed(saved.posts));
  return NextResponse.json({ ok: true, post: saved.post });
}

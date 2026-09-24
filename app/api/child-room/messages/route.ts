import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  appendRoomMessage,
  canUseRoomChannel,
  loadRoomMessages,
  messagesForChild,
  saveRoomMessages,
} from '@/lib/childRoom/roomMessages';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  if (!canUseRoomChannel(session.user.role)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const childId = new URL(req.url).searchParams.get('childId')?.trim() || '';
  if (!childId) {
    return NextResponse.json({ error: 'CHILD_REQUIRED' }, { status: 400 });
  }
  const messages = messagesForChild(await loadRoomMessages(), childId);
  return NextResponse.json({ ok: true, messages });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  if (!canUseRoomChannel(session.user.role)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as {
    childId?: string;
    body?: string;
  } | null;
  const current = await loadRoomMessages();
  const saved = appendRoomMessage(current, {
    childId: body?.childId || '',
    body: body?.body || '',
    authorId: session.user.id || '',
    authorName: session.user.name || 'مشارك',
    authorRole: session.user.role || '',
  });
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 400 });
  }
  await saveRoomMessages(saved.messages);
  return NextResponse.json({ ok: true, message: saved.message });
}

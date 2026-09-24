import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  createInviteRecord,
  loadTeacherInvites,
  saveTeacherInvites,
  toPublicInvite,
} from '@/lib/childRoom/inviteStore';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const childId = new URL(req.url).searchParams.get('childId')?.trim() || '';
  if (!childId) {
    return NextResponse.json({ error: 'CHILD_REQUIRED' }, { status: 400 });
  }
  const invites = await loadTeacherInvites();
  const invite =
    invites.find((item) => item.childId === childId && item.form) ??
    invites.find((item) => item.childId === childId);
  return NextResponse.json({
    ok: true,
    invite: invite ? toPublicInvite(invite) : null,
    form: invite?.form ?? null,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    childId?: string;
    childName?: string;
  } | null;
  const childId = body?.childId?.trim() || '';
  const childName = body?.childName?.trim() || '';
  if (!childId || !childName) {
    return NextResponse.json({ error: 'CHILD_REQUIRED' }, { status: 400 });
  }
  const current = await loadTeacherInvites();
  const created = createInviteRecord(current, childId, childName);
  await saveTeacherInvites(created.invites);
  return NextResponse.json({ ok: true, invite: toPublicInvite(created.invite) });
}

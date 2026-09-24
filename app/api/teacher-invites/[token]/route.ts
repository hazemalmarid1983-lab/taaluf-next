import { NextResponse } from 'next/server';
import {
  acceptInviteRecord,
  attachTeacherForm,
  loadTeacherInvites,
  saveTeacherInvites,
  toPublicInvite,
} from '@/lib/childRoom/inviteStore';

type Params = { params: { token: string } };

export async function GET(_req: Request, { params }: Params) {
  const token = params.token?.trim();
  const invites = await loadTeacherInvites();
  const invite = invites.find((item) => item.token === token);
  if (!invite) {
    return NextResponse.json({ error: 'INVITE_NOT_FOUND' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, invite: toPublicInvite(invite) });
}

export async function POST(req: Request, { params }: Params) {
  const token = params.token?.trim();
  const body = (await req.json().catch(() => null)) as {
    action?: string;
    teacherName?: string;
    password?: string;
    scores?: Array<{ criterionId?: string; score?: number }>;
  } | null;
  const invites = await loadTeacherInvites();

  if (body?.action === 'form') {
    const scores = (body.scores ?? [])
      .filter((row) => row?.criterionId)
      .map((row) => ({
        criterionId: String(row.criterionId),
        score: Number(row.score),
      }));
    const saved = attachTeacherForm(invites, token, scores);
    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: 400 });
    }
    await saveTeacherInvites(saved.invites);
    return NextResponse.json({
      ok: true,
      invite: toPublicInvite(saved.invite),
      form: saved.invite.form ?? null,
    });
  }

  const accepted = acceptInviteRecord(
    invites,
    token,
    body?.teacherName || '',
    body?.password || ''
  );
  if (!accepted.ok) {
    const status = accepted.error === 'INVITE_NOT_FOUND' ? 404 : 400;
    return NextResponse.json({ error: accepted.error }, { status });
  }
  await saveTeacherInvites(accepted.invites);
  return NextResponse.json({ ok: true, invite: toPublicInvite(accepted.invite) });
}

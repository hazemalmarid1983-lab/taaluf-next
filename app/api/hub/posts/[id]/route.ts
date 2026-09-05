import { NextResponse } from 'next/server';
import {
  canApproveHubProposal,
  isHubPostStatus,
} from '@/lib/clinicalHub';
import { hubForbidden, requireHubActor } from '@/lib/clinicalHubApi';
import { addHubReply, setHubPostStatus } from '@/lib/clinicalHubStore';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireHubActor();
  if ('response' in gate) return gate.response;

  const postId = String(params.id || '');
  if (!postId) {
    return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const replyText = String(body.reply || '').trim();
    const statusRaw = body.status != null ? String(body.status) : '';

    if (replyText) {
      const post = await addHubReply(postId, {
        authorRole: gate.actor.role,
        authorName: gate.actor.nameAr,
        authorMemberId: gate.actor.memberId,
        body: replyText,
      });
      if (!post) {
        return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, post });
    }

    if (statusRaw) {
      if (!canApproveHubProposal(gate.actor.role)) {
        return hubForbidden('اعتماد المقترحات محصور بالمشرف العام');
      }
      if (!isHubPostStatus(statusRaw)) {
        return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
      }
      const post = await setHubPostStatus(
        postId,
        statusRaw,
        gate.actor.nameAr
      );
      if (!post) {
        return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, post });
    }

    return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'HUB_PATCH_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import {
  canProposeOnHub,
  isHubPostCategory,
} from '@/lib/clinicalHub';
import { requireHubActor, hubForbidden } from '@/lib/clinicalHubApi';
import { createHubPost } from '@/lib/clinicalHubStore';

export async function POST(req: Request) {
  const gate = await requireHubActor();
  if ('response' in gate) return gate.response;
  if (!canProposeOnHub(gate.actor.role)) {
    return hubForbidden('لا صلاحية للكتابة في غرفة الاجتماعات');
  }

  try {
    const body = await req.json();
    const category = String(body.category || '');
    const title = String(body.title || '').trim();
    const text = String(body.body || '').trim();
    if (!isHubPostCategory(category) || !title || !text) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    const post = await createHubPost({
      category,
      title,
      body: text,
      authorRole: gate.actor.role,
      authorName: gate.actor.nameAr,
      authorMemberId: gate.actor.memberId,
    });

    return NextResponse.json({ ok: true, post });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'HUB_POST_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

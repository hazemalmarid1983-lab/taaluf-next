import { NextResponse } from 'next/server';
import { hubForbidden, requireHubActor } from '@/lib/clinicalHubApi';
import { updateHubMerhidDirectives } from '@/lib/clinicalHubStore';

export async function POST(req: Request) {
  const gate = await requireHubActor();
  if ('response' in gate) return gate.response;

  if (gate.actor.role !== 'admin') {
    return hubForbidden('توجيه مرشد تآلف محصور بالإدارة');
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { text?: string };
    const text = String(body.text || '').trim();
    if (!text) {
      return NextResponse.json({ error: 'EMPTY' }, { status: 400 });
    }
    const merhidDirectives = await updateHubMerhidDirectives(
      text,
      gate.actor.nameAr
    );
    return NextResponse.json({ ok: true, merhidDirectives });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'DIRECTIVES_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

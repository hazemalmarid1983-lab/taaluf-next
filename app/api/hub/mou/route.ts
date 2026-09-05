import { NextResponse } from 'next/server';
import { mouOverallStatus } from '@/lib/clinicalHub';
import { hubForbidden, requireHubActor } from '@/lib/clinicalHubApi';
import { resetAdvisoryMou, signAdvisoryMou } from '@/lib/clinicalHubStore';

export async function POST(req: Request) {
  const gate = await requireHubActor();
  if ('response' in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      signerName?: string;
    };
    const action = String(body.action || 'sign');

    if (action === 'reset') {
      if (gate.actor.role !== 'admin') {
        return hubForbidden('إعادة ضبط المذكرة محصورة بالمشرف العام');
      }
      const mou = await resetAdvisoryMou();
      return NextResponse.json({
        ok: true,
        mou,
        mouStatus: mouOverallStatus(mou),
      });
    }

    const signerName = String(body.signerName || '').trim();
    if (!signerName) {
      return NextResponse.json({ error: 'SIGNER_REQUIRED' }, { status: 400 });
    }

    const mou = await signAdvisoryMou(gate.actor.memberId, signerName);
    return NextResponse.json({
      ok: true,
      mou,
      mouStatus: mouOverallStatus(mou),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'MOU_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

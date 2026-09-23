import { NextResponse } from 'next/server';
import { requireHubActor } from '@/lib/clinicalHubApi';
import { getClinicalHubSnapshot } from '@/lib/clinicalHubStore';

export async function GET() {
  const gate = await requireHubActor();
  if ('response' in gate) return gate.response;

  const snapshot = await getClinicalHubSnapshot();
  return NextResponse.json({
    ok: true,
    actor: gate.actor,
    snapshot,
  });
}

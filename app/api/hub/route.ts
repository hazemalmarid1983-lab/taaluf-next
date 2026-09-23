import { NextResponse } from 'next/server';
import { requireHubActor } from '@/lib/clinicalHubApi';
import { getClinicalHubSnapshot } from '@/lib/clinicalHubStore';
import { hubStorageIsEphemeral, hubStorageMode } from '@/lib/hubPersistence';
import { platformEnvironmentSummary } from '@/lib/platformEnvironment';

export async function GET() {
  const gate = await requireHubActor();
  if ('response' in gate) return gate.response;

  const snapshot = await getClinicalHubSnapshot();
  const env = platformEnvironmentSummary();
  return NextResponse.json({
    ok: true,
    actor: gate.actor,
    snapshot,
    environment: env,
    storage: {
      mode: hubStorageMode(),
      ephemeral: hubStorageIsEphemeral(),
      namespace: env.hubNamespace,
    },
  });
}

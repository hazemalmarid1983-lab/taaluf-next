import { NextResponse } from 'next/server';
import { requireHubActor } from '@/lib/clinicalHubApi';
import { hubStorageIsEphemeral, hubStorageMode } from '@/lib/hubPersistence';
import { platformEnvironmentSummary } from '@/lib/platformEnvironment';

export async function GET() {
  const gate = await requireHubActor();
  if ('response' in gate) return gate.response;

  const env = platformEnvironmentSummary();
  return NextResponse.json({
    ok: true,
    environment: env,
    storage: {
      mode: hubStorageMode(),
      ephemeral: hubStorageIsEphemeral(),
      namespace: env.hubNamespace,
    },
  });
}

import { NextResponse } from 'next/server';
import {
  platformEnvironmentSummary,
  maintenanceModeEnabled,
  isProductionPlatform,
} from '@/lib/platformEnvironment';
import { validatePlatformEnvironment } from '@/lib/validatePlatformEnvironment';
import { hubStorageIsEphemeral, hubStorageMode } from '@/lib/hubPersistence';

/** Public health — no secrets. */
export async function GET() {
  const env = platformEnvironmentSummary();
  const validation = validatePlatformEnvironment();
  return NextResponse.json({
    ok: validation.ok,
    tier: env.tier,
    maintenance: env.maintenance,
    maintenanceModeConfigured: maintenanceModeEnabled(),
    production: isProductionPlatform(),
    hub: {
      mode: hubStorageMode(),
      ephemeral: hubStorageIsEphemeral(),
      namespace: env.hubNamespace,
    },
    airtable: {
      isolated: !env.previewUsesProductionAirtable,
      previewUsesProduction: env.previewUsesProductionAirtable,
    },
    issues: validation.issues,
    warnings: validation.warnings,
  });
}

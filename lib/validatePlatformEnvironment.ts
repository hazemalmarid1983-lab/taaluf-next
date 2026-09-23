import { airtableCreds } from '@/lib/env';
import {
  isProductionPlatform,
  platformEnvironmentSummary,
  platformTier,
  previewUsesProductionAirtable,
  productionAirtableBaseId,
} from '@/lib/platformEnvironment';

export type PlatformValidationResult = {
  ok: boolean;
  tier: ReturnType<typeof platformTier>;
  issues: string[];
  warnings: string[];
};

export function validatePlatformEnvironment(): PlatformValidationResult {
  const tier = platformTier();
  const issues: string[] = [];
  const warnings: string[] = [];
  const currentBase = airtableCreds().baseId;
  const prodBase = productionAirtableBaseId();

  if (isProductionPlatform()) {
    if (!currentBase) {
      issues.push('AIRTABLE_BASE_ID is missing on Production');
    }
    if (prodBase && currentBase && prodBase !== currentBase) {
      issues.push(
        'Production AIRTABLE_BASE_ID must match AIRTABLE_PRODUCTION_BASE_ID'
      );
    }
    if (!prodBase && currentBase) {
      warnings.push(
        'Set AIRTABLE_PRODUCTION_BASE_ID on Production to enable preview isolation guards'
      );
    }
  } else {
    if (previewUsesProductionAirtable()) {
      issues.push(
        'Preview/Development is using the production Airtable base — use a sandbox base'
      );
    }
    if (!prodBase) {
      warnings.push(
        'Set AIRTABLE_PRODUCTION_BASE_ID so non-production tiers cannot touch prod data'
      );
    }
  }

  return { ok: issues.length === 0, tier, issues, warnings };
}

export function assertPlatformEnvironmentSafe() {
  const result = validatePlatformEnvironment();
  if (!result.ok) {
    throw new Error(`PLATFORM_ENV_INVALID: ${result.issues.join(' · ')}`);
  }
  return result;
}

export function logPlatformEnvironmentOnBoot() {
  const summary = platformEnvironmentSummary();
  const validation = validatePlatformEnvironment();
  const label = `[taaluf:${summary.tier}]`;
  console.info(
    `${label} hub=${summary.hubNamespace} maintenance=${summary.maintenance} prodAirtableGuard=${!summary.previewUsesProductionAirtable}`
  );
  for (const w of validation.warnings) {
    console.warn(`${label} ${w}`);
  }
  if (!validation.ok) {
    console.error(`${label} ${validation.issues.join(' · ')}`);
  }
}

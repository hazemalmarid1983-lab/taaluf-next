import { airtableCreds, cleanEnv } from '@/lib/env';

export type PlatformTier = 'development' | 'preview' | 'production';

export function platformTier(): PlatformTier {
  const vercelEnv = cleanEnv(process.env.VERCEL_ENV).toLowerCase();
  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'preview';
  return 'development';
}

export function isProductionPlatform() {
  return platformTier() === 'production';
}

export function isPreviewPlatform() {
  return platformTier() === 'preview';
}

export function isDevelopmentPlatform() {
  return platformTier() === 'development';
}

/** Namespace for hub JSON files — isolates production from preview/dev. */
export function hubStorageNamespace() {
  return `taaluf-data/${platformTier()}`;
}

export function maintenanceModeEnabled() {
  return (
    cleanEnv(process.env.MAINTENANCE_MODE).toLowerCase() === 'true' ||
    cleanEnv(process.env.NEXT_PUBLIC_MAINTENANCE_MODE).toLowerCase() === 'true'
  );
}

/** Production Airtable base id — set on Preview to block accidental prod writes. */
export function productionAirtableBaseId() {
  return cleanEnv(process.env.AIRTABLE_PRODUCTION_BASE_ID) || null;
}

export function previewUsesProductionAirtable() {
  if (isProductionPlatform()) return false;
  const prodBase = productionAirtableBaseId();
  const currentBase = airtableCreds().baseId;
  if (!prodBase || !currentBase) return false;
  return prodBase === currentBase;
}

export function allowPreviewProductionData() {
  return cleanEnv(process.env.ALLOW_PREVIEW_PRODUCTION_DATA).toLowerCase() === 'true';
}

export function assertSafePlatformDataAccess(action = 'write') {
  if (!previewUsesProductionAirtable() || allowPreviewProductionData()) return;
  throw new Error(
    `PLATFORM_DATA_GUARD: ${action} blocked — Preview/Development is pointed at the production Airtable base. ` +
      'Use a separate AIRTABLE_BASE_ID for non-production, or set ALLOW_PREVIEW_PRODUCTION_DATA=true only for emergencies.'
  );
}

export function maintenanceBypassRoles() {
  return ['admin', 'scientific_advisor'] as const;
}

export function roleBypassesMaintenance(role?: string | null) {
  if (!role) return false;
  return (maintenanceBypassRoles() as readonly string[]).includes(role);
}

export function showEnvironmentBanner() {
  if (isProductionPlatform()) return false;
  return cleanEnv(process.env.NEXT_PUBLIC_SHOW_ENV_BANNER).toLowerCase() !== 'false';
}

export function platformEnvironmentSummary() {
  return {
    tier: platformTier(),
    maintenance: maintenanceModeEnabled() && isProductionPlatform(),
    hubNamespace: hubStorageNamespace(),
    previewUsesProductionAirtable: previewUsesProductionAirtable(),
    showBanner: showEnvironmentBanner(),
  };
}

export function platformTierLabel(isAr: boolean) {
  const tier = platformTier();
  if (tier === 'production') return isAr ? 'الإنتاج' : 'Production';
  if (tier === 'preview') return isAr ? 'معاينة (Preview)' : 'Preview';
  return isAr ? 'تطوير محلي' : 'Local development';
}

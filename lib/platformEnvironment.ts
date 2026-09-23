import { cleanEnv } from '@/lib/env';

export type PlatformTier = 'production' | 'preview' | 'development';

export function platformTier(): PlatformTier {
  const vercel = cleanEnv(process.env.VERCEL_ENV);
  if (vercel === 'production') return 'production';
  if (vercel === 'preview') return 'preview';
  return 'development';
}

export function isProductionPlatform() {
  return platformTier() === 'production';
}

export function productionAirtableBaseId() {
  return cleanEnv(process.env.AIRTABLE_PRODUCTION_BASE_ID);
}

export function previewUsesProductionAirtable() {
  if (isProductionPlatform()) return false;
  const prod = productionAirtableBaseId();
  const current = cleanEnv(process.env.AIRTABLE_BASE_ID);
  if (!prod || !current) return false;
  return prod === current;
}

export function maintenanceModeEnabled() {
  return (
    cleanEnv(process.env.TAALUF_MAINTENANCE_MODE).toLowerCase() === 'true'
  );
}

export function roleBypassesMaintenance(role?: string | null) {
  return role === 'admin';
}

export function platformEnvironmentSummary() {
  return {
    tier: platformTier(),
    maintenance: maintenanceModeEnabled(),
    hubNamespace: cleanEnv(process.env.TAALUF_HUB_NAMESPACE) || 'default',
    previewUsesProductionAirtable: previewUsesProductionAirtable(),
  };
}

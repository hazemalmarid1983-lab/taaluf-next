import { NextResponse } from 'next/server';
import {
  isProductionPlatform,
  maintenanceModeEnabled,
  roleBypassesMaintenance,
} from '@/lib/platformEnvironment';

/** Returns 503 when production maintenance mode is on and role cannot bypass. */
export function maintenanceBlockedResponse(role?: string | null) {
  if (
    !maintenanceModeEnabled() ||
    !isProductionPlatform() ||
    roleBypassesMaintenance(role)
  ) {
    return null;
  }
  return NextResponse.json(
    { ok: false, error: 'MAINTENANCE', message: 'المنصة قيد التحديث' },
    { status: 503 }
  );
}

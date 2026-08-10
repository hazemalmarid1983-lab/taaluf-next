import { FieldSet } from 'airtable';
import { isAirtableConfigured } from '@/lib/airtable';

const TABLE =
  process.env.AIRTABLE_AUDIT_TABLE || 'AuditLog';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create_student'
  | 'create_assessment'
  | 'view_report'
  | 'delete_data'
  | 'consent_accepted';

export async function logAction(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    if (!isAirtableConfigured()) return;

    const { airtableCreds } = await import('@/lib/env');
    const { apiKey, baseId } = airtableCreds();
    if (!apiKey || !baseId) return;

    const Airtable = (await import('airtable')).default;
    const base = new Airtable({ apiKey }).base(baseId);

    await base(TABLE).create([
      {
        fields: {
          User: params.userId,
          Action: params.action,
          EntityType: params.entityType,
          EntityId: params.entityId,
          IPAddress: params.ipAddress || '',
          Timestamp: new Date().toISOString(),
          UserAgent: params.userAgent || '',
        } as FieldSet,
      },
    ]);
  } catch {
    // never let audit logging break the main operation
  }
}

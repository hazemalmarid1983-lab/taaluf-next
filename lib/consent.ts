import { FieldSet } from 'airtable';
import { isAirtableConfigured } from '@/lib/airtable';
import { airtableCreds, cleanEnv } from '@/lib/env';

export {
  CONSENT_COOKIE,
  CONSENT_LAYERS,
  CONSENT_STORAGE_KEY,
} from '@/lib/consentConstants';

const TABLE = cleanEnv(process.env.AIRTABLE_CONSENTS_TABLE) || 'Consents';

export async function saveConsentRecords(params: {
  userId: string;
  childId?: string;
  ipAddress?: string;
  layers: Array<{ type: string; text: string }>;
}) {
  if (!isAirtableConfigured()) {
    return { ok: true, source: 'local' as const, ids: [] as string[] };
  }

  try {
    const { apiKey, baseId } = airtableCreds();
    const Airtable = (await import('airtable')).default;
    const base = new Airtable({ apiKey }).base(baseId);
    const now = new Date().toISOString();

    const created = await base(TABLE).create(
      params.layers.map((layer) => ({
        fields: {
          User: params.userId,
          Child: params.childId || '',
          ConsentType: layer.type,
          ConsentText: layer.text,
          AcceptedAt: now,
          IPAddress: params.ipAddress || '',
        } as FieldSet,
      }))
    );

    return {
      ok: true,
      source: 'airtable' as const,
      ids: created.map((r) => r.id),
    };
  } catch {
    // لا نوقف مسار الموافقة إن فشل Airtable مؤقتاً
    return { ok: true, source: 'local' as const, ids: [] as string[] };
  }
}

export async function userHasConsent(userId: string): Promise<boolean> {
  if (!userId || !isAirtableConfigured()) return false;
  try {
    const { apiKey, baseId } = airtableCreds();
    const Airtable = (await import('airtable')).default;
    const base = new Airtable({ apiKey }).base(baseId);
    const safe = userId.replace(/'/g, "\\'");
    const rows = await base(TABLE)
      .select({
        maxRecords: 1,
        filterByFormula: `{User} = '${safe}'`,
      })
      .all();
    return rows.length > 0;
  } catch {
    return false;
  }
}

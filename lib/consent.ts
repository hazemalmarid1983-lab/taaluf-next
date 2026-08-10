import { FieldSet } from 'airtable';
import { isAirtableConfigured } from '@/lib/airtable';

export {
  CONSENT_COOKIE,
  CONSENT_LAYERS,
  CONSENT_STORAGE_KEY,
} from '@/lib/consentConstants';

const TABLE = process.env.AIRTABLE_CONSENTS_TABLE || 'Consents';

export async function saveConsentRecords(params: {
  userId: string;
  childId?: string;
  ipAddress?: string;
  layers: Array<{ type: string; text: string }>;
}) {
  if (!isAirtableConfigured()) {
    return { ok: true, source: 'local' as const, ids: [] as string[] };
  }

  const apiKey = process.env.AIRTABLE_API_KEY || '';
  const baseId = process.env.AIRTABLE_BASE_ID || '';
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
}

export async function userHasConsent(userId: string): Promise<boolean> {
  if (!userId || !isAirtableConfigured()) return false;
  try {
    const apiKey = process.env.AIRTABLE_API_KEY || '';
    const baseId = process.env.AIRTABLE_BASE_ID || '';
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

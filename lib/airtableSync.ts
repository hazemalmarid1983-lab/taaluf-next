/**
 * مزامنة آمنة مع Airtable — خادم فقط.
 * المفاتيح تُقرأ من process.env عبر airtableCreds() ولا تُعاد للعميل.
 */

import { airtableCreds, cleanEnv } from '@/lib/env';
import { isAirtableConfigured, TABLE_NAMES } from '@/lib/airtable';
import type { FusionSummary } from '@/lib/fusion';

export type SyncSource = 'airtable' | 'local';

export type SyncResult<T = unknown> = {
  ok: boolean;
  source: SyncSource;
  id?: string;
  data: T | null;
  error?: string;
};

export interface SyncChildData {
  childId: string;
  name: string;
  birthDate: string;
  ageBand: string;
  gender?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  guardianName?: string;
}

export type SyncConsentType =
  | 'platform_consent'
  | 'assessment_consent'
  | 'data_consent'
  | 'video_consent'
  | 'general_platform'
  | 'assessment'
  | 'data_privacy'
  | 'video_analysis';

export interface SyncConsentData {
  userId: string;
  childId: string;
  consentType: SyncConsentType;
  consentText: string;
  ipAddress?: string;
  acceptedAt?: string;
}

export interface SyncAssessmentData {
  childId: string;
  journeyMode: 'independent_parent' | 'specialist_guided';
  totalNeedPercentage: number;
  overallClassification: string;
  suggestedReassessmentDays: number;
  domainScores: { domain: string; percentage: number }[];
  fusedResultsJson: string;
  evaluatedAt: string;
}

function consentsTable() {
  return cleanEnv(process.env.AIRTABLE_CONSENTS_TABLE) || 'Consents';
}

function auditTable() {
  return cleanEnv(process.env.AIRTABLE_AUDIT_TABLE) || 'AuditLog';
}

function assertServerOnly(): boolean {
  return typeof window === 'undefined';
}

function redact(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/pat[A-Za-z0-9]{10,}/g, '[redacted]')
    .replace(/AIRTABLE_API_KEY\s*[:=]\s*\S+/gi, 'AIRTABLE_API_KEY=[redacted]');
}

function formulaEscape(value: string): string {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function nextAssessmentDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(1, Number(days) || 180));
  return d.toISOString().slice(0, 10);
}

function childNotes(child: SyncChildData): string {
  return [`taalufId:${child.childId}`, `ageBand:${child.ageBand}`]
    .filter(Boolean)
    .join(' | ');
}

function localResult<T>(error?: string): SyncResult<T> {
  return { ok: true, source: 'local', data: null, error };
}

function failResult<T>(error: string): SyncResult<T> {
  return { ok: false, source: 'local', data: null, error: redact(error) };
}

type AirtableRecord = { id: string; fields: Record<string, unknown> };
type AirtableList = { records?: AirtableRecord[] };

async function airtableFetch(
  table: string,
  method: 'GET' | 'POST' | 'PATCH',
  opts?: { body?: unknown; query?: string }
): Promise<AirtableList | null> {
  if (!assertServerOnly()) return null;
  if (!isAirtableConfigured()) return null;

  const { apiKey, baseId } = airtableCreds();
  if (!apiKey || !baseId) return null;

  const path = `${encodeURIComponent(table)}${opts?.query || ''}`;
  const url = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',
    });

    if (!res.ok) {
      await res.text().catch(() => '');
      return null;
    }
    return (await res.json()) as AirtableList;
  } catch {
    return null;
  }
}

function firstRecord(payload: AirtableList | null): AirtableRecord | null {
  return payload?.records?.[0] || null;
}

/**
 * 1) حفظ أو تحديث سجل الطفل (Students)
 */
export async function syncChildRecord(
  child: SyncChildData
): Promise<SyncResult<AirtableRecord>> {
  if (!assertServerOnly() || !isAirtableConfigured()) {
    return localResult('AIRTABLE_NOT_CONFIGURED');
  }

  const fields = {
    Name: child.name,
    DOB: child.birthDate.slice(0, 10),
    Gender: child.gender || '',
    ParentName: child.guardianName || '',
    ParentPhone: child.guardianPhone || '',
    ParentEmail: child.guardianEmail || '',
    Status: 'نشط',
    Notes: childNotes(child),
  };

  const existingQuery = `?filterByFormula=${encodeURIComponent(
    `FIND('taalufId:${formulaEscape(child.childId)}', {Notes})`
  )}&maxRecords=1`;
  const existing = firstRecord(
    await airtableFetch(TABLE_NAMES.students, 'GET', { query: existingQuery })
  );

  const payload = existing
    ? { records: [{ id: existing.id, fields }] }
    : { records: [{ fields }] };
  const method = existing ? 'PATCH' : 'POST';
  const saved = firstRecord(
    await airtableFetch(TABLE_NAMES.students, method, { body: payload })
  );

  if (!saved) return failResult('CHILD_SYNC_FAILED');
  return { ok: true, source: 'airtable', id: saved.id, data: saved };
}

export async function fetchChildRecord(
  childId: string
): Promise<SyncResult<AirtableRecord>> {
  if (!assertServerOnly() || !isAirtableConfigured()) {
    return localResult('AIRTABLE_NOT_CONFIGURED');
  }
  const query = childId.startsWith('rec')
    ? `?filterByFormula=${encodeURIComponent(
        `RECORD_ID()='${formulaEscape(childId)}'`
      )}&maxRecords=1`
    : `?filterByFormula=${encodeURIComponent(
        `FIND('taalufId:${formulaEscape(childId)}', {Notes})`
      )}&maxRecords=1`;
  const row = firstRecord(
    await airtableFetch(TABLE_NAMES.students, 'GET', { query })
  );
  if (!row) return { ok: true, source: 'airtable', data: null };
  return { ok: true, source: 'airtable', id: row.id, data: row };
}

/**
 * 2) حفظ الموافقات القانونية (Consents)
 */
export async function syncConsentRecord(
  consent: SyncConsentData
): Promise<SyncResult<AirtableRecord>> {
  if (!assertServerOnly() || !isAirtableConfigured()) {
    return localResult('AIRTABLE_NOT_CONFIGURED');
  }

  const fields = {
    User: consent.userId,
    Child: consent.childId,
    ConsentType: consent.consentType,
    ConsentText: consent.consentText,
    IPAddress: consent.ipAddress || '',
    AcceptedAt: consent.acceptedAt || new Date().toISOString(),
  };

  const saved = firstRecord(
    await airtableFetch(consentsTable(), 'POST', {
      body: { records: [{ fields }] },
    })
  );
  if (!saved) return failResult('CONSENT_SYNC_FAILED');
  return { ok: true, source: 'airtable', id: saved.id, data: saved };
}

export async function fetchConsentRecords(
  userId: string
): Promise<SyncResult<AirtableRecord[]>> {
  if (!assertServerOnly() || !isAirtableConfigured()) {
    return localResult('AIRTABLE_NOT_CONFIGURED');
  }
  const query = `?filterByFormula=${encodeURIComponent(
    `{User}='${formulaEscape(userId)}'`
  )}&maxRecords=50`;
  const payload = await airtableFetch(consentsTable(), 'GET', { query });
  return {
    ok: true,
    source: 'airtable',
    data: payload?.records || [],
  };
}

/**
 * 3) حفظ نتيجة التقييم (Assessments)
 */
export async function syncAssessmentResult(
  assessment: SyncAssessmentData
): Promise<SyncResult<AirtableRecord>> {
  if (!assertServerOnly() || !isAirtableConfigured()) {
    return localResult('AIRTABLE_NOT_CONFIGURED');
  }

  const fields: Record<string, unknown> = {
    AssessmentDate: (assessment.evaluatedAt || new Date().toISOString()).slice(
      0,
      10
    ),
    AssessmentType:
      assessment.journeyMode === 'independent_parent'
        ? 'أسري مستقل'
        : 'مدمج شامل',
    TotalScore: assessment.totalNeedPercentage,
    MaxScore: 100,
    Classification: assessment.overallClassification,
    Status: 'مكتمل',
    ScoresJSON: assessment.fusedResultsJson,
    DomainAveragesJSON: JSON.stringify(assessment.domainScores),
    NextAssessmentDate: nextAssessmentDate(
      assessment.suggestedReassessmentDays
    ),
  };

  if (assessment.childId && !assessment.childId.startsWith('local_')) {
    fields.Student = [assessment.childId];
  }

  const saved = firstRecord(
    await airtableFetch(TABLE_NAMES.assessments, 'POST', {
      body: { records: [{ fields }] },
    })
  );
  if (!saved) return failResult('ASSESSMENT_SYNC_FAILED');
  return { ok: true, source: 'airtable', id: saved.id, data: saved };
}

export async function fetchAssessmentRecords(
  childId: string
): Promise<SyncResult<AirtableRecord[]>> {
  if (!assertServerOnly() || !isAirtableConfigured()) {
    return localResult('AIRTABLE_NOT_CONFIGURED');
  }
  const query = `?filterByFormula=${encodeURIComponent(
    `FIND('${formulaEscape(childId)}', ARRAYJOIN({Student}))`
  )}&maxRecords=50`;
  const payload = await airtableFetch(TABLE_NAMES.assessments, 'GET', {
    query,
  });
  return {
    ok: true,
    source: 'airtable',
    data: payload?.records || [],
  };
}

export function toSyncAssessmentData(params: {
  childId: string;
  journeyMode: 'independent_parent' | 'specialist_guided';
  summary: FusionSummary;
  evaluatedAt?: string;
}): SyncAssessmentData {
  return {
    childId: params.childId,
    journeyMode: params.journeyMode,
    totalNeedPercentage: params.summary.totalNeedPercentage,
    overallClassification: params.summary.overallClassification,
    suggestedReassessmentDays: params.summary.suggestedReassessmentDays,
    domainScores: params.summary.domainScores.map((d) => ({
      domain: d.domain,
      percentage: d.percentage,
    })),
    fusedResultsJson: JSON.stringify(params.summary.fusedResults),
    evaluatedAt: params.evaluatedAt || new Date().toISOString(),
  };
}

/**
 * 4) سجل تدقيق (AuditLog) — بدون إيقاف العملية الأساسية
 */
export async function logAuditEvent(
  action: string,
  entity: string,
  userId: string,
  details?: string
): Promise<SyncResult<AirtableRecord>> {
  if (!assertServerOnly() || !isAirtableConfigured()) {
    return localResult('AIRTABLE_NOT_CONFIGURED');
  }

  const fields = {
    User: userId,
    Action: action,
    EntityType: entity,
    EntityId: details || entity,
    Timestamp: new Date().toISOString(),
  };

  const saved = firstRecord(
    await airtableFetch(auditTable(), 'POST', {
      body: { records: [{ fields }] },
    })
  );
  if (!saved) return failResult('AUDIT_SYNC_FAILED');
  return { ok: true, source: 'airtable', id: saved.id, data: saved };
}

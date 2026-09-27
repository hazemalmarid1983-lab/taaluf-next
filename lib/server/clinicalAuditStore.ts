/**
 * سجل تدقيق سريري إلحاقي لكل طفل — لا توجد عملية حذف أو تعديل.
 */

import type { AuditDraft, ClinicalAuditEntry } from '@/lib/clinicalAudit';
import type { ClinicalActor } from '@/lib/clinicalAccess';
import { logAction } from '@/lib/auditLog';
import { readHubJsonFile, writeHubJsonFile } from '@/lib/hubPersistence';
import { CLINICAL_RECORDS_DIR, assertChildId, withFileLock } from '@/lib/server/clinicalRecordStore';

function auditFile(childId: string) {
  return `${CLINICAL_RECORDS_DIR}/audit/${assertChildId(childId)}.json`;
}

export async function loadClinicalAudit(childId: string): Promise<ClinicalAuditEntry[]> {
  try {
    const raw = await readHubJsonFile(auditFile(childId));
    const parsed = raw ? (JSON.parse(raw) as { entries?: ClinicalAuditEntry[] }) : null;
    return Array.isArray(parsed?.entries) ? parsed!.entries : [];
  } catch {
    return [];
  }
}

let sequence = 0;

export function buildAuditEntries(
  childId: string,
  actor: ClinicalActor,
  drafts: AuditDraft[],
  now: Date = new Date()
): ClinicalAuditEntry[] {
  const at = now.toISOString();
  return drafts.map((d) => ({
    ...d,
    id: `audit_${now.getTime().toString(36)}_${(sequence++).toString(36)}`,
    at,
    childId,
    actorUserId: actor.userId,
    actorRole: actor.role,
  }));
}

export async function appendClinicalAudit(
  childId: string,
  actor: ClinicalActor,
  drafts: AuditDraft[],
  now: Date = new Date()
): Promise<ClinicalAuditEntry[]> {
  if (!drafts.length) return [];
  const entries = buildAuditEntries(childId, actor, drafts, now);
  const file = auditFile(childId);
  await withFileLock(file, async () => {
    const existing = await loadClinicalAudit(childId);
    await writeHubJsonFile(file, JSON.stringify({ entries: [...existing, ...entries] }));
  });
  for (const e of entries) {
    void logAction({
      userId: actor.userId,
      action: `clinical:${e.event}`,
      entityType: 'child',
      entityId: e.goalId ? `${childId}/${e.goalId}` : childId,
    });
  }
  return entries;
}

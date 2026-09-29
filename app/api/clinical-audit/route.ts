import { NextResponse } from 'next/server';
import { requireApiPermission, storeErrorResponse } from '@/lib/server/apiAuth';
import { loadClinicalAudit } from '@/lib/server/clinicalAuditStore';
import { getChildRecordForActor } from '@/lib/server/clinicalRecordService';
import { assertChildId } from '@/lib/server/clinicalRecordStore';

/** سجل التدقيق التربوي لطفل — للفريق المهني فقط (لا يشمل ولي الأمر) */
export async function GET(req: Request) {
  const auth = await requireApiPermission([
    'manage_all_cases',
    'manage_assigned_cases',
    'review_clinical_content',
  ]);
  if (!auth.ok) return auth.response;
  try {
    const childId = assertChildId(new URL(req.url).searchParams.get('childId'));
    const found = await getChildRecordForActor(auth.actor, childId, 'read');
    if (!found.ok) return NextResponse.json({ error: found.error }, { status: found.status });
    return NextResponse.json({ ok: true, childId, entries: await loadClinicalAudit(childId) });
  } catch (err) {
    return storeErrorResponse(err);
  }
}

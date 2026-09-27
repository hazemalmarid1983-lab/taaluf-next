import { NextResponse } from 'next/server';
import { requireApiPermission, storeErrorResponse } from '@/lib/server/apiAuth';
import { assignSpecialist } from '@/lib/server/clinicalRecordService';
import { assertChildId } from '@/lib/server/clinicalRecordStore';

/** إسناد أخصائي لملف طفل — للمشرف العام فقط */
export async function POST(req: Request, { params }: { params: { childId: string } }) {
  const auth = await requireApiPermission(['manage_all_cases']);
  if (!auth.ok) return auth.response;
  try {
    const childId = assertChildId(params.childId);
    const body = (await req.json()) as { specialistUserId?: unknown };
    const result = await assignSpecialist(auth.actor, childId, String(body.specialistUserId ?? ''));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, specialistUserIds: result.record.specialistUserIds });
  } catch (err) {
    return storeErrorResponse(err);
  }
}

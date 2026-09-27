import { NextResponse } from 'next/server';
import { requireApiPermission, storeErrorResponse } from '@/lib/server/apiAuth';
import { linkChild, parentStageForUser } from '@/lib/server/clinicalRecordService';
import { assertChildId } from '@/lib/server/clinicalRecordStore';

/** ربط المستخدم الحالي بملف الطفل على الخادم (ولي الأمر، الأخصائي، المشرف) */
export async function POST(req: Request) {
  const auth = await requireApiPermission(['run_home_session', 'manage_assigned_cases', 'manage_all_cases']);
  if (!auth.ok) return auth.response;
  try {
    const body = (await req.json()) as { childId?: unknown; childName?: unknown };
    const childId = assertChildId(body.childId);
    const childName = typeof body.childName === 'string' ? body.childName : undefined;
    const result = await linkChild(auth.actor, childId, childName);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({
      ok: true,
      childId,
      created: result.created,
      parentStage: auth.actor.role === 'PARENT' ? await parentStageForUser(auth.actor.userId) : undefined,
    });
  } catch (err) {
    return storeErrorResponse(err);
  }
}

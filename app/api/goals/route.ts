import { NextResponse } from 'next/server';
import { requireApiPermission, storeErrorResponse } from '@/lib/server/apiAuth';
import { getChildRecordForActor, importGoals } from '@/lib/server/clinicalRecordService';
import { assertChildId } from '@/lib/server/clinicalRecordStore';

/** أهداف الطفل ومجسات التعميم من السجل السريري على الخادم */
export async function GET(req: Request) {
  const auth = await requireApiPermission(['view_child_progress']);
  if (!auth.ok) return auth.response;
  try {
    const childId = assertChildId(new URL(req.url).searchParams.get('childId'));
    const found = await getChildRecordForActor(auth.actor, childId, 'read');
    if (!found.ok) {
      if (found.status === 404) {
        return NextResponse.json({ ok: true, childId, linked: false, goals: [], generalizationProbes: [] });
      }
      return NextResponse.json({ error: found.error }, { status: found.status });
    }
    return NextResponse.json({
      ok: true,
      childId,
      linked: true,
      goals: found.record.goals,
      generalizationProbes: found.record.generalizationProbes,
    });
  } catch (err) {
    return storeErrorResponse(err);
  }
}

/** استيراد أهداف من المتصفح (ترحيل أو توليد أولي) — لا يستبدل أهدافاً قائمة */
export async function POST(req: Request) {
  const auth = await requireApiPermission(['update_iep_goals', 'run_home_session']);
  if (!auth.ok) return auth.response;
  try {
    const body = (await req.json()) as { childId?: unknown; goals?: unknown; generalizationProbes?: unknown };
    const childId = assertChildId(body.childId);
    const goals = Array.isArray(body.goals) ? body.goals : [];
    const probes = Array.isArray(body.generalizationProbes) ? body.generalizationProbes : [];
    const result = await importGoals(auth.actor, childId, goals, probes);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({
      ok: true,
      imported: result.imported,
      goals: result.record.goals,
      generalizationProbes: result.record.generalizationProbes,
    });
  } catch (err) {
    return storeErrorResponse(err);
  }
}

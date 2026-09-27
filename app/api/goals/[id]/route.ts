import { NextResponse } from 'next/server';
import { parseGoalAction } from '@/lib/clinicalGoalActions';
import { requireApiPermission, storeErrorResponse } from '@/lib/server/apiAuth';
import { deleteGoal, performGoalAction } from '@/lib/server/clinicalRecordService';
import { assertChildId } from '@/lib/server/clinicalRecordStore';

/**
 * تعديل هدف على الخادم: body = { childId, action, input | session | status }.
 * الإجراءات: session، session_entry، maintenance_probe، generalization_probe، status.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiPermission(['record_session_trials', 'run_home_session', 'update_iep_goals']);
  if (!auth.ok) return auth.response;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const childId = assertChildId(body.childId);
    const action = parseGoalAction(body);
    if (!action) return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 });
    const result = await performGoalAction(auth.actor, childId, params.id, action);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, errors: result.errors }, { status: result.status });
    }
    return NextResponse.json({
      ok: true,
      goal: result.goal,
      generalizationProbes: result.record.generalizationProbes,
      withdrawn: result.withdrawn ?? false,
      passed: result.passed,
      countsTowardIndex: result.countsTowardIndex,
    });
  } catch (err) {
    return storeErrorResponse(err);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiPermission(['update_iep_goals']);
  if (!auth.ok) return auth.response;
  try {
    const childId = assertChildId(new URL(req.url).searchParams.get('childId'));
    const result = await deleteGoal(auth.actor, childId, params.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return storeErrorResponse(err);
  }
}

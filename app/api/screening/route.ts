import { NextResponse } from 'next/server';
import { logAction } from '@/lib/auditLog';
import { calculateScreening, validateScreeningAnswers } from '@/lib/screeningEngine';
import { ASSESSMENT_SUBMIT_PERMISSIONS } from '@/lib/clinicalAccess';
import { requireApiPermission } from '@/lib/server/apiAuth';
import { recordAssessmentSummary } from '@/lib/server/clinicalRecordService';
import { isValidStoreId } from '@/lib/server/clinicalRecordStore';

export async function POST(req: Request) {
  const auth = await requireApiPermission(ASSESSMENT_SUBMIT_PERMISSIONS);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const childId = String(body.childId || '');
    const validation = validateScreeningAnswers(body.answers);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error, itemIds: validation.itemIds },
        { status: 400 }
      );
    }

    const result = calculateScreening(validation.answers);
    const id = `screen_${Date.now().toString(36)}`;
    const savedAt = new Date().toISOString();

    await logAction({
      userId: auth.actor.userId,
      action: 'create_assessment',
      entityType: 'assessment',
      entityId: id,
    });

    const stored =
      isValidStoreId(childId) &&
      (
        await recordAssessmentSummary(auth.actor, childId, {
          id,
          savedAt,
          source: 'screening',
          percentage: result.overall,
          classification: result.band,
        }).catch(() => null)
      )?.ok === true;

    return NextResponse.json({
      ok: true,
      id,
      childId,
      result,
      savedAt,
      source: stored ? 'server' : 'local',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SCREENING_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

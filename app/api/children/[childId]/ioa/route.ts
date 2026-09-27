import { NextResponse } from 'next/server';
import type { IoaInput } from '@/lib/ioa';
import { requireApiPermission, storeErrorResponse } from '@/lib/server/apiAuth';
import {
  IOA_RECORD_PERMISSIONS,
  IOA_REVIEW_PERMISSIONS,
  getIoaReview,
  recordIoa,
} from '@/lib/server/clinicalRecordService';
import { assertChildId } from '@/lib/server/clinicalRecordStore';

/** مراجعة اتفاق الملاحظين للطفل — للفريق المهني (لا يشمل ولي الأمر) */
export async function GET(_req: Request, { params }: { params: { childId: string } }) {
  const auth = await requireApiPermission(IOA_REVIEW_PERMISSIONS);
  if (!auth.ok) return auth.response;
  try {
    const result = await getIoaReview(auth.actor, assertChildId(params.childId));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, records: result.records, summary: result.summary });
  } catch (err) {
    return storeErrorResponse(err);
  }
}

/**
 * ملاحظ ثانٍ يسجّل بيانات موازية لجلسة محفوظة:
 * body = { goalId, sessionAt, observerName?, trialScores? | totalCount? | totalDurationMinutes?, notes? }
 */
export async function POST(req: Request, { params }: { params: { childId: string } }) {
  const auth = await requireApiPermission(IOA_RECORD_PERMISSIONS);
  if (!auth.ok) return auth.response;
  try {
    const childId = assertChildId(params.childId);
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
    const input: IoaInput = {
      goalId: typeof body.goalId === 'string' ? body.goalId : undefined,
      sessionAt: typeof body.sessionAt === 'string' ? body.sessionAt : undefined,
      observerName: typeof body.observerName === 'string' ? body.observerName : undefined,
      trialScores: body.trialScores,
      totalCount: body.totalCount as IoaInput['totalCount'],
      totalDurationMinutes: body.totalDurationMinutes as IoaInput['totalDurationMinutes'],
      notes: typeof body.notes === 'string' ? body.notes : undefined,
    };
    const result = await recordIoa(auth.actor, childId, input);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, errors: result.errors }, { status: result.status });
    }
    return NextResponse.json({ ok: true, record: result.record });
  } catch (err) {
    return storeErrorResponse(err);
  }
}

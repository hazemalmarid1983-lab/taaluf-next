import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/auditLog';
import {
  createAssessment,
  createAssessmentCriteriaRows,
  isAirtableConfigured,
} from '@/lib/airtable';
import {
  CRITERIA_LIST,
  calculateAssessmentResult,
  getAgeBand,
  getAgeBandFromYears,
  type AssessmentScore,
} from '@/types/taalof';

/** قائمة تقييمات طالب — من التخزين المحلي عبر الواجهة؛ هنا ملخص Airtable إن وُجد */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const studentId = new URL(req.url).searchParams.get('studentId') || '';
  if (!studentId) {
    return NextResponse.json({ error: 'STUDENT_REQUIRED' }, { status: 400 });
  }

  // الواجهة تدمج مع localStorage؛ هذا المسار يعيد قائمة فارغة أو Airtable لاحقاً
  return NextResponse.json({
    ok: true,
    studentId,
    assessments: [],
    source: 'local',
  });
}

/** توافق قديم — المفضّل: /api/airtable/assessments */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json();
  const scores = (body.scores || []) as AssessmentScore[];
  const studentId = String(body.studentId || '');
  if (!studentId || !scores.length) {
    return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
  }

  const ageBand = String(
    body.ageBand ||
      (body.birthdate ? getAgeBand(String(body.birthdate)) : '') ||
      (body.childAge != null ? getAgeBandFromYears(Number(body.childAge)) : '') ||
      '5-6'
  );
  const result = calculateAssessmentResult(scores, ageBand);
  const ai = body.aiAnalysis || null;
  const fields = {
    student_id: studentId,
    specialist_id: session.user.id || '',
    scores_json: JSON.stringify(scores),
    total_score: result.totalScore,
    max_score: result.maxScore,
    percentage: result.percentage,
    classification: result.classification,
    ai_analysis: ai ? JSON.stringify(ai) : '',
    ai_confidence:
      ai?.confidence != null
        ? Math.round(Number(ai.confidence) * (Number(ai.confidence) <= 1 ? 100 : 1))
        : undefined,
    domain_averages_json: JSON.stringify(result.domainAverages),
    assessment_date: new Date().toISOString(),
  };

  if (!isAirtableConfigured()) {
    const localId = `local_assess_${Date.now().toString(36)}`;
    await logAction({
      userId: session.user.id || '',
      action: 'create_assessment',
      entityType: 'assessment',
      entityId: localId,
    });
    return NextResponse.json({
      ok: true,
      source: 'local',
      record: { id: localId, fields },
      result,
    });
  }

  try {
    const record = await createAssessment(fields);
    try {
      await createAssessmentCriteriaRows(
        record.id,
        scores.map((s) => {
          const c = CRITERIA_LIST.find((x) => x.id === s.criterionId);
          return {
            domain: c?.domain || '',
            criterionCode: s.criterionId,
            criterionName: c?.name || s.criterionId,
            score: s.score,
          };
        })
      );
    } catch {
      /* optional */
    }
    await logAction({
      userId: session.user.id || '',
      action: 'create_assessment',
      entityType: 'assessment',
      entityId: record.id,
    });
    return NextResponse.json({ ok: true, source: 'airtable', record, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CREATE_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

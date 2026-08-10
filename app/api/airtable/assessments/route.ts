import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const scores = (body.scores || body.criteriaScores || []) as AssessmentScore[];
    const studentId = String(body.studentId || body.Student || '');
    if (!studentId || !scores.length) {
      return NextResponse.json({ success: false, error: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    const ageBand = String(
      body.ageBand ||
        (body.birthdate ? getAgeBand(String(body.birthdate)) : '') ||
        (body.childAge != null
          ? getAgeBandFromYears(Number(body.childAge))
          : '') ||
        '5-6'
    );
    const result = calculateAssessmentResult(scores, ageBand);
    const ai = body.aiAnalysis || body.ai || null;

    const fields = {
      student_id: studentId,
      specialist_id: session.user.id || '',
      scores_json: JSON.stringify(scores),
      total_score: result.totalScore,
      max_score: result.maxScore,
      percentage: result.percentage,
      classification: result.classification,
      ai_analysis: ai ? JSON.stringify(ai) : '',
      ai_confidence: ai?.confidence != null ? Math.round(Number(ai.confidence) * (Number(ai.confidence) <= 1 ? 100 : 1)) : undefined,
      domain_averages_json: JSON.stringify(result.domainAverages),
      assessment_date: new Date().toISOString(),
      next_assessment_date: String(body.nextAssessmentDate || ''),
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
        success: true,
        source: 'local',
        data: { id: localId, fields },
        result,
      });
    }

    const record = await createAssessment(fields);

    // صفوف AssessmentCriteria لكل مؤشر
    const criteriaRows = scores.map((s) => {
      const c = CRITERIA_LIST.find((x) => x.id === s.criterionId);
      return {
        domain: c?.domain || '',
        criterionCode: s.criterionId,
        criterionName: c?.name || s.criterionId,
        score: s.score,
      };
    });
    try {
      await createAssessmentCriteriaRows(record.id, criteriaRows);
    } catch {
      /* الجدول قد لا يكون جاهزاً بعد — التقييم الأساسي محفوظ */
    }

    await logAction({
      userId: session.user.id || '',
      action: 'create_assessment',
      entityType: 'assessment',
      entityId: record.id,
    });

    return NextResponse.json({
      success: true,
      source: 'airtable',
      data: record,
      result,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}

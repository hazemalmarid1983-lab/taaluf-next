import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { buildLocalAiAnalysis } from '@/lib/goalsEngine';
import {
  analyzeAssessmentWithGemini,
  isGeminiConfigured,
} from '@/lib/gemini';
import {
  calculateAssessmentResult,
  getAgeBand,
  getAgeBandFromYears,
  type AssessmentScore,
} from '@/types/taalof';

/**
 * نقطة دخول Gemini لكتابة التقرير التوجيهي وفق دستور تآلف.
 * الجسم: { scores, studentName?, childAge?, birthdate?, ageBand?, parentNotes? }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const scores = (body.scores || []) as AssessmentScore[];
    if (!Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json({ error: 'SCORES_REQUIRED' }, { status: 400 });
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

    if (!isGeminiConfigured()) {
      const ai = buildLocalAiAnalysis(result, scores);
      return NextResponse.json({
        ok: true,
        ai,
        result,
        source: 'local',
        message:
          'تم توليد تحليل محلي (GEMINI_API_KEY غير مُعدّ). أضف المفتاح لتفعيل دستور التقرير عبر Gemini.',
      });
    }

    const ai = await analyzeAssessmentWithGemini({
      studentName: body.studentName,
      childAge: body.childAge,
      parentNotes: body.parentNotes,
      scores,
      result,
    });

    return NextResponse.json({ ok: true, ai, result, source: 'gemini' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GEMINI_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

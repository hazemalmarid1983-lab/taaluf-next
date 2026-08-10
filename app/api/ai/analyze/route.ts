import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { buildLocalAiAnalysis } from '@/lib/goalsEngine';
import { analyzeAssessment, isOpenAIConfigured } from '@/lib/openai';
import {
  calculateAssessmentResult,
  getAgeBand,
  getAgeBandFromYears,
  type AssessmentScore,
} from '@/types/taalof';

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

    if (!isOpenAIConfigured()) {
      const ai = buildLocalAiAnalysis(result, scores);
      return NextResponse.json({
        ok: true,
        ai,
        result,
        source: 'local',
        message:
          'تم توليد تحليل تربوي محلي من درجات التقييم (OPENAI_API_KEY غير مُعدّ).',
      });
    }

    try {
      const ai = await analyzeAssessment({
        studentName: body.studentName,
        childAge: body.childAge,
        scores,
        result,
      });
      return NextResponse.json({ ok: true, ai, result, source: 'openai' });
    } catch {
      const ai = buildLocalAiAnalysis(result, scores);
      return NextResponse.json({
        ok: true,
        ai,
        result,
        source: 'local-fallback',
        message: 'تعذر الاتصال بـ OpenAI — عُرض تحليل تربوي محلي من النتائج.',
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

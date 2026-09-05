import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import {
  activityGenerationPrompt,
  buildLocalActivity,
  normalizeGeneratedActivity,
  type GeneratedActivityPayload,
} from '@/lib/activityGenerator';
import { authOptions } from '@/lib/auth';
import { getOpenAI, isOpenAIConfigured } from '@/lib/openai';

const MIN_GOAL_LENGTH = 5;
const MAX_GOAL_LENGTH = 300;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const goalText = String(body.goalText || '').trim();
    const iepGoalId = body.iepGoalId ? String(body.iepGoalId) : undefined;
    const childAge = body.childAge != null ? Number(body.childAge) : null;

    if (goalText.length < MIN_GOAL_LENGTH) {
      return NextResponse.json({ error: 'GOAL_TEXT_REQUIRED' }, { status: 400 });
    }
    if (goalText.length > MAX_GOAL_LENGTH) {
      return NextResponse.json({ error: 'GOAL_TEXT_TOO_LONG' }, { status: 413 });
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json({
        ok: true,
        activity: buildLocalActivity(goalText, iepGoalId),
        source: 'local',
        message:
          'تم توليد الوسيلة من بنك المفردات المدمج (لا يوجد OPENAI_API_KEY).',
      });
    }

    try {
      const client = getOpenAI();
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.5,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: activityGenerationPrompt() },
          {
            role: 'user',
            content: JSON.stringify({
              iepGoal: goalText,
              childAge,
              // اللهجة البيضاء مطلوبة لأن ولي الأمر يقرأ النص ويقوله للطفل حرفياً
              arabicStyle: 'عربية بيضاء يومية بسيطة',
            }),
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw) as GeneratedActivityPayload;
      const activity = normalizeGeneratedActivity(parsed, goalText, iepGoalId);

      return NextResponse.json({ ok: true, activity, source: 'openai' });
    } catch {
      return NextResponse.json({
        ok: true,
        activity: buildLocalActivity(goalText, iepGoalId),
        source: 'local-fallback',
        message: 'تعذر الاتصال بمزوّد الذكاء الاصطناعي — وُلّدت وسيلة محلية.',
      });
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'ACTIVITY_GENERATION_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

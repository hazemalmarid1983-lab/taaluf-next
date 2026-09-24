import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import {
  activityGenerationPrompt,
  buildLocalActivity,
  normalizeGeneratedActivity,
  type GeneratedActivityPayload,
} from '@/lib/activityGenerator';
import { authOptions } from '@/lib/auth';
import {
  addCustomActivity,
  latestCustomForChild,
  loadCustomActivities,
  saveCustomActivities,
} from '@/lib/childRoom/customActivityStore';
import { getOpenAI, isOpenAIConfigured } from '@/lib/openai';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const childId = new URL(req.url).searchParams.get('childId')?.trim() || '';
  if (!childId) {
    return NextResponse.json({ error: 'CHILD_REQUIRED' }, { status: 400 });
  }
  const activities = await loadCustomActivities();
  return NextResponse.json({
    ok: true,
    activity: latestCustomForChild(activities, childId),
    activities: activities.filter((item) => item.childId === childId).slice(0, 20),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    childId?: string;
    goalText?: string;
  } | null;
  const childId = body?.childId?.trim() || '';
  const goalText = body?.goalText?.trim() || '';
  if (!childId) {
    return NextResponse.json({ error: 'CHILD_REQUIRED' }, { status: 400 });
  }

  let generated = buildLocalActivity(goalText);
  if (isOpenAIConfigured() && goalText.length >= 5) {
    try {
      const client = getOpenAI();
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.5,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: activityGenerationPrompt() },
          { role: 'user', content: JSON.stringify({ iepGoal: goalText }) },
        ],
      });
      const parsed = JSON.parse(
        completion.choices[0]?.message?.content || '{}'
      ) as GeneratedActivityPayload;
      generated = normalizeGeneratedActivity(parsed, goalText);
    } catch {
      generated = buildLocalActivity(goalText);
    }
  }

  const current = await loadCustomActivities();
  const saved = addCustomActivity(current, { childId, goalText, activity: generated });
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 400 });
  }
  await saveCustomActivities(saved.activities);
  return NextResponse.json({ ok: true, activity: saved.activity });
}

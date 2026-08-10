import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/auditLog';
import { calculateScreening, type ScreeningAnswer } from '@/lib/screeningEngine';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const answers = (body.answers || []) as ScreeningAnswer[];
    const childId = String(body.childId || '');
    if (!answers.length) {
      return NextResponse.json({ error: 'ANSWERS_REQUIRED' }, { status: 400 });
    }

    const result = calculateScreening(answers);
    const id = `screen_${Date.now().toString(36)}`;

    await logAction({
      userId: session.user.id || '',
      action: 'create_assessment',
      entityType: 'assessment',
      entityId: id,
    });

    return NextResponse.json({
      ok: true,
      id,
      childId,
      result,
      savedAt: new Date().toISOString(),
      source: 'local',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SCREENING_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

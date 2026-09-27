import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/auditLog';
import { calculateScreening, validateScreeningAnswers } from '@/lib/screeningEngine';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

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

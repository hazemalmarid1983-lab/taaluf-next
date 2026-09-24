import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  asJourneyPlan,
  journeysForParent,
  loadChildJourneys,
  saveChildJourneys,
  upsertJourney,
  type ChildJourneyRecord,
} from '@/lib/childRoom/journeyStore';
import { findTeacherAccountById } from '@/lib/childRoom/teacherAccounts';

function canRead(
  record: ChildJourneyRecord,
  userId: string,
  role: string,
  teacherChildIds: string[]
) {
  if (role === 'admin' || role === 'scientific_advisor' || role === 'specialist') return true;
  if (role === 'teacher') return teacherChildIds.includes(record.childId);
  return !record.parentUserId || record.parentUserId === userId;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const role = session.user.role || '';
  const userId = session.user.id;
  const childId = new URL(req.url).searchParams.get('childId')?.trim() || '';
  const teacher = role === 'teacher' ? await findTeacherAccountById(userId) : null;
  const teacherChildIds = teacher?.rooms.map((room) => room.childId) || [];
  const journeys = await loadChildJourneys();

  if (role === 'teacher' && teacher) {
    const assigned = teacher.rooms.map((room) => {
      const stored = journeys.find((row) => row.childId === room.childId);
      return (
        stored || {
          childId: room.childId,
          childName: room.childName,
          planId: 'child_room' as const,
          parentAssessments: [],
          childResponses: [],
          updatedAt: new Date(0).toISOString(),
        }
      );
    });
    const one = childId ? assigned.filter((row) => row.childId === childId) : assigned;
    return NextResponse.json({ ok: true, journeys: one, journey: one[0] || null });
  }

  if (childId) {
    const journey = journeys.find((row) => row.childId === childId) || null;
    if (journey && !canRead(journey, userId, role, teacherChildIds)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ ok: true, journey, journeys: journey ? [journey] : [] });
  }

  const mine =
    role === 'parent'
      ? journeysForParent(journeys, userId)
      : journeys.slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return NextResponse.json({ ok: true, journeys: mine, journey: mine[0] || null });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const role = session.user.role || '';
  if (role === 'teacher') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as {
    childId?: string;
    childName?: string;
    planId?: string;
    screening?: Record<string, unknown>;
    parentAssessment?: Record<string, unknown>;
    childResponse?: Record<string, unknown>;
  } | null;
  const childId = String(body?.childId || '').trim();
  if (!childId || childId === 'child_local') {
    return NextResponse.json({ error: 'CHILD_REQUIRED' }, { status: 400 });
  }
  const current = await loadChildJourneys();
  const existing = current.find((row) => row.childId === childId);
  if (
    existing?.parentUserId &&
    existing.parentUserId !== session.user.id &&
    role !== 'admin'
  ) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const planId = asJourneyPlan(body?.planId);
  const next = upsertJourney(current, {
    childId,
    childName: body?.childName,
    parentUserId: role === 'parent' ? session.user.id : existing?.parentUserId,
    ...(planId ? { planId } : {}),
    ...(body?.screening ? { screening: body.screening } : {}),
    ...(body?.parentAssessment ? { parentAssessment: body.parentAssessment } : {}),
    ...(body?.childResponse ? { childResponse: body.childResponse } : {}),
  });
  await saveChildJourneys(next);
  const journey = next.find((row) => row.childId === childId) || null;
  return NextResponse.json({ ok: true, journey });
}

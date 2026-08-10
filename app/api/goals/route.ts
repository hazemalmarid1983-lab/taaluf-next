import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import type { TrackedGoal } from '@/lib/goalsEngine';

/** تخزين مؤقت على مستوى العملية — الواجهة تعتمد أيضاً على localStorage */
const memoryGoals = new Map<string, TrackedGoal>();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId') || '';
  const goals = Array.from(memoryGoals.values()).filter((g) =>
    childId ? g.childId === childId : true
  );
  return NextResponse.json({ ok: true, goals });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const goal = body.goal as TrackedGoal | undefined;
    if (!goal?.id || !goal.childId) {
      return NextResponse.json({ error: 'INVALID_GOAL' }, { status: 400 });
    }
    memoryGoals.set(goal.id, goal);
    return NextResponse.json({ ok: true, goal });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GOAL_CREATE_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

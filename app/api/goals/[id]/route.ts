import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import type { GoalSession, TrackedGoal } from '@/lib/goalsEngine';

const memoryGoals = new Map<string, TrackedGoal>();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const id = params.id;
    const body = await req.json();
    const existing = (body.goal as TrackedGoal | undefined) || memoryGoals.get(id);
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const sessionEntry = body.session as GoalSession | undefined;
    const sessions = sessionEntry
      ? [...(existing.sessions || []), sessionEntry]
      : existing.sessions || [];

    const updated: TrackedGoal = {
      ...existing,
      ...((body.patch as Partial<TrackedGoal>) || {}),
      current:
        body.current != null
          ? Number(body.current)
          : sessionEntry?.progress != null
            ? Number(sessionEntry.progress)
            : existing.current,
      sessions,
      lastUpdate: new Date().toISOString(),
      id,
    };
    memoryGoals.set(id, updated);
    return NextResponse.json({ ok: true, goal: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GOAL_UPDATE_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  memoryGoals.delete(params.id);
  return NextResponse.json({ ok: true });
}

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  syncFourSourceAssessment,
  syncGameSessionReport,
  syncGoalChain,
  type FourSourceCriterion,
  type GoalSyncRow,
} from '@/lib/airtableService';
import { loadChildJourneys } from '@/lib/childRoom/journeyStore';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    kind?: string;
    childId?: string;
    criteria?: FourSourceCriterion[];
    goals?: GoalSyncRow[];
    gameCode?: string;
    independence?: number;
    mood?: string;
    accuracy?: number;
    levelReached?: number;
    totalTrials?: number;
    startedAt?: string;
    endedAt?: string;
    summary?: string;
  } | null;

  const childId = String(body?.childId || '').trim();
  if (!childId) {
    return NextResponse.json({ error: 'CHILD_REQUIRED' }, { status: 400 });
  }

  if (session.user.role === 'parent') {
    const journeys = await loadChildJourneys();
    const owned = journeys.find((row) => row.childId === childId);
    if (owned?.parentUserId && owned.parentUserId !== session.user.id) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
  }

  if (body?.kind === 'four-source') {
    const criteria = Array.isArray(body.criteria) ? body.criteria.slice(0, 80) : [];
    const goals = Array.isArray(body.goals) ? body.goals.slice(0, 8) : [];
    const assessment = await syncFourSourceAssessment({ childId, criteria });
    const goalSync = goals.length
      ? await syncGoalChain(goals.map((goal) => ({ ...goal, childId })))
      : null;
    const ok = assessment.assessment.ok && (criteria.length === 0 || assessment.criteria.ok);
    console.log(
      `[airtable] four-source child=${childId} assessment HTTP ${assessment.assessment.status} criteria HTTP ${assessment.criteria.status}` +
        (goalSync ? ` goals HTTP ${goalSync.status}` : '')
    );
    return NextResponse.json(
      { ok, assessment, goals: goalSync },
      { status: ok && (!goalSync || goalSync.ok) ? 200 : 502 }
    );
  }

  if (body?.kind === 'game-session') {
    const result = await syncGameSessionReport({
      childId,
      gameCode: String(body.gameCode || 'session'),
      independence: Number(body.independence) || 0,
      mood: body.mood ? String(body.mood) : undefined,
      accuracy: body.accuracy != null ? Number(body.accuracy) : undefined,
      levelReached: body.levelReached != null ? Number(body.levelReached) : undefined,
      totalTrials: body.totalTrials != null ? Number(body.totalTrials) : undefined,
      startedAt: body.startedAt ? String(body.startedAt) : undefined,
      endedAt: body.endedAt ? String(body.endedAt) : undefined,
      summary: body.summary ? String(body.summary) : undefined,
    });
    const ok = result.session.ok && result.report.ok;
    console.log(
      `[airtable] game-session child=${childId} session HTTP ${result.session.status} report HTTP ${result.report.status}`
    );
    return NextResponse.json(result, { status: ok ? 200 : 502 });
  }

  return NextResponse.json({ error: 'UNKNOWN_KIND' }, { status: 400 });
}

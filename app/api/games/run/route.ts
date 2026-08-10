import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { FieldSet } from 'airtable';
import { authOptions } from '@/lib/auth';
import { isAirtableConfigured } from '@/lib/airtable';
import { logAction } from '@/lib/auditLog';

const TABLE = process.env.AIRTABLE_GAME_SESSIONS_TABLE || 'GameSessions';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const childId = new URL(req.url).searchParams.get('childId') || '';
  if (!childId) {
    return NextResponse.json({ error: 'CHILD_REQUIRED' }, { status: 400 });
  }

  if (isAirtableConfigured()) {
    try {
      const apiKey = process.env.AIRTABLE_API_KEY || '';
      const baseId = process.env.AIRTABLE_BASE_ID || '';
      const Airtable = (await import('airtable')).default;
      const base = new Airtable({ apiKey }).base(baseId);
      const safe = childId.replace(/'/g, "\\'");
      const rows = await base(TABLE)
        .select({
          maxRecords: 40,
          filterByFormula: `{child_id} = '${safe}'`,
        })
        .all();
      return NextResponse.json({
        ok: true,
        sessions: rows.map((r) => {
          const f = r.fields as Record<string, unknown>;
          return {
            id: r.id,
            childId: String(f.child_id || ''),
            gameCode: String(f.game_code || ''),
            score: Number(f.score || 0),
            levelReached: Number(f.level_reached || 0),
            startedAt: String(f.started_at || ''),
            endedAt: String(f.ended_at || ''),
          };
        }),
        source: 'airtable',
      });
    } catch {
      /* fall through */
    }
  }

  return NextResponse.json({ ok: true, sessions: [], source: 'local' });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const childId = String(body.childId || '');
    const gameCode = String(body.gameCode || '');
    if (!childId || !gameCode) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    const payload = {
      child_id: childId,
      game_code: gameCode,
      score: Number(body.score) || 0,
      level_reached: Number(body.levelReached) || 0,
      metrics_json: JSON.stringify(body.metrics || {}),
      trials_json: JSON.stringify(body.trials || []),
      started_at: String(body.startedAt || new Date().toISOString()),
      ended_at: String(body.endedAt || new Date().toISOString()),
    };

    let id = `game_${Date.now().toString(36)}`;
    let source: 'local' | 'airtable' = 'local';

    if (isAirtableConfigured()) {
      try {
        const apiKey = process.env.AIRTABLE_API_KEY || '';
        const baseId = process.env.AIRTABLE_BASE_ID || '';
        const Airtable = (await import('airtable')).default;
        const base = new Airtable({ apiKey }).base(baseId);
        const [record] = await base(TABLE).create([
          {
            fields: {
              child_id: payload.child_id,
              game_code: payload.game_code,
              score: payload.score,
              level_reached: payload.level_reached,
              metrics_json: payload.metrics_json,
              trials_json: payload.trials_json,
              started_at: payload.started_at,
              ended_at: payload.ended_at,
            } as FieldSet,
          },
        ]);
        id = record.id;
        source = 'airtable';
      } catch {
        /* fall back to local id */
      }
    }

    await logAction({
      userId: session.user.id || '',
      action: 'create_assessment',
      entityType: 'assessment',
      entityId: id,
    });

    return NextResponse.json({ ok: true, id, source, fields: payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GAME_SAVE_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

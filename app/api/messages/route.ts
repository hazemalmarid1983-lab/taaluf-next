import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { FieldSet } from 'airtable';
import { authOptions } from '@/lib/auth';
import { isAirtableConfigured } from '@/lib/airtable';
import type { ChatMessage } from '@/lib/messagesStore';

const TABLE = process.env.AIRTABLE_MESSAGES_TABLE || 'Messages';
const memory = new Map<string, ChatMessage>();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const childId = searchParams.get('childId') || '';

  let messages = Array.from(memory.values()).filter((m) =>
    childId ? m.childId === childId : true
  );

  if (isAirtableConfigured() && childId) {
    try {
      const apiKey = process.env.AIRTABLE_API_KEY || '';
      const baseId = process.env.AIRTABLE_BASE_ID || '';
      const Airtable = (await import('airtable')).default;
      const base = new Airtable({ apiKey }).base(baseId);
      const safe = childId.replace(/'/g, "\\'");
      const rows = await base(TABLE)
        .select({
          filterByFormula: `{ChildId} = '${safe}'`,
          maxRecords: 100,
          sort: [{ field: 'CreatedAt', direction: 'asc' }],
        })
        .all();
      messages = rows.map((r) => {
        const f = r.fields as Record<string, unknown>;
        return {
          id: r.id,
          from: String(f.From || ''),
          to: String(f.To || ''),
          childId: String(f.ChildId || ''),
          body: String(f.Body || ''),
          read: Boolean(f.Read),
          createdAt: String(f.CreatedAt || new Date().toISOString()),
        };
      });
    } catch {
      /* keep memory */
    }
  }

  const unread = messages.filter(
    (m) => !m.read && m.to === session.user?.id
  ).length;

  return NextResponse.json({ ok: true, messages, unread });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const childId = String(body.childId || '');
    const text = String(body.body || '').trim();
    const to = String(body.to || 'counterpart');
    if (!childId || !text) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    const msg: ChatMessage = {
      id: `msg_${Date.now().toString(36)}`,
      from: session.user.id || '',
      to,
      childId,
      body: text,
      read: false,
      createdAt: new Date().toISOString(),
      fromRole:
        session.user.role === 'parent'
          ? 'parent'
          : session.user.role === 'admin'
            ? 'admin'
            : 'specialist',
    };

    memory.set(msg.id, msg);

    if (isAirtableConfigured()) {
      try {
        const apiKey = process.env.AIRTABLE_API_KEY || '';
        const baseId = process.env.AIRTABLE_BASE_ID || '';
        const Airtable = (await import('airtable')).default;
        const base = new Airtable({ apiKey }).base(baseId);
        const [record] = await base(TABLE).create([
          {
            fields: {
              From: msg.from,
              To: msg.to,
              ChildId: msg.childId,
              Body: msg.body,
              Read: false,
              CreatedAt: msg.createdAt,
            } as FieldSet,
          },
        ]);
        msg.id = record.id;
        memory.set(msg.id, msg);
      } catch {
        /* local ok */
      }
    }

    return NextResponse.json({ ok: true, message: msg });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'MESSAGE_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

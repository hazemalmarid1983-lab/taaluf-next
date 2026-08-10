import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { FieldSet } from 'airtable';
import { authOptions } from '@/lib/auth';
import { isAirtableConfigured } from '@/lib/airtable';

const TABLE = process.env.AIRTABLE_MESSAGES_TABLE || 'Messages';

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const id = params.id;

  if (isAirtableConfigured() && !id.startsWith('msg_')) {
    try {
      const apiKey = process.env.AIRTABLE_API_KEY || '';
      const baseId = process.env.AIRTABLE_BASE_ID || '';
      const Airtable = (await import('airtable')).default;
      const base = new Airtable({ apiKey }).base(baseId);
      await base(TABLE).update([
        { id, fields: { Read: true } as FieldSet },
      ]);
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ ok: true, id, read: true });
}

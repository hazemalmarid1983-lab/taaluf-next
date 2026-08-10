import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { isAirtableConfigured, listStudents } from '@/lib/airtable';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const id = params.id;

  if (isAirtableConfigured()) {
    try {
      const records = await listStudents(100);
      const found = records.find((r) => r.id === id);
      if (found) {
        return NextResponse.json({ ok: true, student: found, source: 'airtable' });
      }
    } catch {
      /* fall through */
    }
  }

  return NextResponse.json({
    ok: true,
    student: { id, fields: {} },
    source: 'local',
    message: 'استخدم التخزين المحلي في الواجهة إن لم يُعثر على السجل',
  });
}

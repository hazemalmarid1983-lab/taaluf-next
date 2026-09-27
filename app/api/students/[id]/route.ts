import { NextResponse } from 'next/server';
import { isAirtableConfigured, listStudents } from '@/lib/airtable';
import { requireApiPermission } from '@/lib/server/apiAuth';
import { filterStudentsForActor } from '@/lib/studentVisibility';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireApiPermission(['view_child_progress']);
  if (!auth.ok) return auth.response;

  const id = params.id;

  if (isAirtableConfigured()) {
    try {
      const records = await listStudents(100);
      const found = records.find((r) => r.id === id);
      if (found) {
        if (!filterStudentsForActor([found], auth.actor).length) {
          return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
        }
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

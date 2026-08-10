import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/auditLog';
import {
  createStudent,
  isAirtableConfigured,
  listStudents,
} from '@/lib/airtable';

function ageFromDob(dob: string) {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? age : 0;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!isAirtableConfigured()) {
    return NextResponse.json({
      ok: true,
      source: 'local',
      records: [],
      message: 'Airtable غير مضبوط — استخدم التخزين المحلي في الواجهة',
    });
  }

  try {
    const records = await listStudents();
    return NextResponse.json({ ok: true, source: 'airtable', records });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'LIST_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name || '').trim();
  const dob = String(body.dob || '').trim();
  if (!name || !dob) {
    return NextResponse.json(
      { error: 'NAME_DOB_REQUIRED', message: 'الاسم وتاريخ الميلاد مطلوبان' },
      { status: 400 }
    );
  }

  const age = ageFromDob(dob);
  const fields = {
    name,
    dob,
    age,
    parent_phone: String(body.parent_phone || ''),
    notes: String(body.notes || ''),
    center_code: String(body.center_code || 'ONLINE'),
    created_at: new Date().toISOString(),
  };

  if (!isAirtableConfigured()) {
    const localId = `local_${Date.now().toString(36)}`;
    await logAction({
      userId: session.user.id || '',
      action: 'create_student',
      entityType: 'student',
      entityId: localId,
    });
    return NextResponse.json({
      ok: true,
      source: 'local',
      record: { id: localId, fields },
    });
  }

  try {
    const record = await createStudent(fields);
    await logAction({
      userId: session.user.id || '',
      action: 'create_student',
      entityType: 'student',
      entityId: record.id,
    });
    return NextResponse.json({ ok: true, source: 'airtable', record });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CREATE_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

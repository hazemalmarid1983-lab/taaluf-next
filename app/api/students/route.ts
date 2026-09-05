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
    const role = session.user.role;
    const email = String(session.user.email || '').toLowerCase();
    const visible =
      role === 'parent'
        ? records.filter(
            (r) =>
              String(
                (r.fields as { parent_email?: string }).parent_email || ''
              ).toLowerCase() === email
          )
        : role === 'specialist'
          ? records.filter((r) => {
              const assigned = String(
                (r.fields as { specialist_email?: string }).specialist_email ||
                  ''
              ).toLowerCase();
              return !assigned || assigned === email;
            })
          : records;
    return NextResponse.json({ ok: true, source: 'airtable', records: visible });
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
  const parentEmail =
    session.user.role === 'parent'
      ? String(session.user.email || '')
      : String(body.parent_email || '');
  const specialistEmail =
    session.user.role === 'specialist' || session.user.role === 'admin'
      ? String(session.user.email || '')
      : String(body.specialist_email || '');
  const fields = {
    name,
    dob,
    age,
    parent_phone: String(body.parent_phone || ''),
    parent_email: parentEmail,
    parent_name:
      session.user.role === 'parent'
        ? String(session.user.name || '')
        : String(body.parent_name || ''),
    specialist_email: specialistEmail,
    specialist_name:
      session.user.role === 'specialist' || session.user.role === 'admin'
        ? String(session.user.name || '')
        : String(body.specialist_name || ''),
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
    const record = await createStudent({
      name: fields.name,
      dob: fields.dob,
      age: fields.age,
      parent_phone: fields.parent_phone,
      parent_name: fields.parent_name,
      parent_email: fields.parent_email,
      notes: fields.notes,
      center_code: fields.center_code,
      created_at: fields.created_at,
    });
    await logAction({
      userId: session.user.id || '',
      action: 'create_student',
      entityType: 'student',
      entityId: record.id,
    });
    return NextResponse.json({
      ok: true,
      source: 'airtable',
      record: {
        ...record,
        fields: { ...fields, ...record.fields },
      },
    });
  } catch (err) {
    const localId = `local_${Date.now().toString(36)}`;
    await logAction({
      userId: session.user.id || '',
      action: 'create_student',
      entityType: 'student',
      entityId: localId,
    }).catch(() => undefined);
    return NextResponse.json({
      ok: true,
      source: 'local',
      record: { id: localId, fields },
      warning: err instanceof Error ? err.message : 'CREATE_FAILED',
    });
  }
}

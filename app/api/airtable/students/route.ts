import { NextRequest, NextResponse } from 'next/server';
import { logAction } from '@/lib/auditLog';
import { requireApiPermission } from '@/lib/server/apiAuth';
import { filterStudentsForActor } from '@/lib/studentVisibility';
import { isAirtableConfigured, listStudents, createStudent } from '@/lib/airtable';

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
  const auth = await requireApiPermission(['view_child_progress']);
  if (!auth.ok) return auth.response;

  if (!isAirtableConfigured()) {
    return NextResponse.json({
      success: true,
      source: 'local',
      data: [],
      message: 'Airtable غير مضبوط',
    });
  }

  try {
    const records = filterStudentsForActor(await listStudents(), auth.actor);
    const data = records.map((r) => ({ id: r.id, ...r.fields }));
    return NextResponse.json({ success: true, source: 'airtable', data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission(['manage_assigned_cases', 'manage_all_cases', 'run_home_session']);
  if (!auth.ok) return auth.response;
  const userId = auth.actor.userId;

  try {
    const body = await request.json();
    const name = String(body.Name || body.name || '').trim();
    const dob = String(body.DOB || body.dob || '').trim();
    if (!name || !dob) {
      return NextResponse.json(
        { success: false, error: 'NAME_DOB_REQUIRED' },
        { status: 400 }
      );
    }

    const fields = {
      name,
      dob,
      age: ageFromDob(dob),
      parent_phone: String(body.ParentPhone || body.parent_phone || ''),
      parent_name: String(body.ParentName || body.parent_name || ''),
      parent_email: String(body.ParentEmail || body.parent_email || ''),
      gender: String(body.Gender || body.gender || ''),
      diagnosis: String(body.Diagnosis || body.diagnosis || ''),
      notes: String(body.Notes || body.notes || ''),
    };

    if (!isAirtableConfigured()) {
      const id = `local_${Date.now().toString(36)}`;
      await logAction({
        userId,
        action: 'create_student',
        entityType: 'student',
        entityId: id,
      });
      return NextResponse.json({
        success: true,
        source: 'local',
        data: [{ id, fields }],
        record: { id, fields },
      });
    }

    const record = await createStudent(fields);
    await logAction({
      userId,
      action: 'create_student',
      entityType: 'student',
      entityId: record.id,
    });
    return NextResponse.json({ success: true, source: 'airtable', data: record, record });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create student' },
      { status: 500 }
    );
  }
}

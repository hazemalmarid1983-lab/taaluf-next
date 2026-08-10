import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/auditLog';

/** طلب حذف بيانات — يسجّل الحدث (التنفيذ الفعلي يعتمد على سياسات Airtable) */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const entityType = String(body.entityType || 'student');
    const entityId = String(body.entityId || session.user.id);

    await logAction({
      userId: session.user.id,
      action: 'delete_data',
      entityType,
      entityId,
      ipAddress:
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        '',
      userAgent: req.headers.get('user-agent') || '',
    });

    return NextResponse.json({
      ok: true,
      message: 'تم تسجيل طلب حذف البيانات',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'DELETE_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

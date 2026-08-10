import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/auditLog';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = String(body.action || '');
    const entityType = String(body.entityType || '');
    const entityId = String(body.entityId || session.user.id);
    if (!action || !entityType) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    await logAction({
      userId: session.user.id,
      action,
      entityType,
      entityId,
      ipAddress:
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        '',
      userAgent: req.headers.get('user-agent') || '',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AUDIT_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

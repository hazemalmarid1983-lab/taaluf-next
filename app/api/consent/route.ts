import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/auditLog';
import {
  CONSENT_COOKIE,
  CONSENT_LAYERS,
  saveConsentRecords,
  userHasConsent,
} from '@/lib/consent';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const consented = await userHasConsent(session.user.id);
  return NextResponse.json({ ok: true, consented });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const childId = String(body.childId || body.Child || '');
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '';

    const result = await saveConsentRecords({
      userId: session.user.id,
      childId,
      ipAddress,
      layers: CONSENT_LAYERS.map((l) => ({ type: l.type, text: l.text })),
    });

    await logAction({
      userId: session.user.id,
      action: 'consent_accepted',
      entityType: 'consent',
      entityId: result.ids[0] || session.user.id,
      ipAddress,
      userAgent: req.headers.get('user-agent') || '',
    });

    const res = NextResponse.json({
      ok: true,
      source: result.source,
      ids: result.ids,
    });
    res.cookies.set(CONSENT_COOKIE, 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CONSENT_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

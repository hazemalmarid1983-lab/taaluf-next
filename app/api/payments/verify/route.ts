import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import {
  ENTITLEMENTS_COOKIE,
  parseEntitlements,
  serializeEntitlements,
} from '@/lib/access';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/auditLog';
import { fetchCharge, verifyCharge } from '@/lib/payments';
import { savePaymentRecord } from '@/lib/paymentStore';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const chargeId = String(body.chargeId || '');
    if (!chargeId) {
      return NextResponse.json({ error: 'CHARGE_ID_REQUIRED' }, { status: 400 });
    }

    const captured = await verifyCharge(chargeId);
    const charge = await fetchCharge(chargeId);

    await savePaymentRecord({
      chargeId,
      userId: session.user.id || '',
      childId: String(
        (charge.metadata as Record<string, string> | undefined)?.childId ||
          body.childId ||
          ''
      ),
      amount: Number(charge.amount || body.amount || 0),
      currency: String(charge.currency || body.currency || 'SAR'),
      status: captured ? 'captured' : 'failed',
      description: String(charge.description || 'تقييم تآلف'),
      createdAt: new Date().toISOString(),
    });

    if (captured) {
      const current = parseEntitlements(
        cookies().get(ENTITLEMENTS_COOKIE)?.value
      );
      const next = { ...current, assessmentPaid: true };
      cookies().set(ENTITLEMENTS_COOKIE, serializeEntitlements(next), {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 90,
      });
      await logAction({
        userId: session.user.id || '',
        action: 'create_assessment',
        entityType: 'assessment',
        entityId: chargeId,
      });
    }

    return NextResponse.json({
      ok: true,
      captured,
      chargeId,
      status: charge.status,
      message: captured ? 'تم الدفع بنجاح' : 'فشل الدفع',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'VERIFY_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ENTITLEMENTS_COOKIE,
  parseEntitlements,
  serializeEntitlements,
} from '@/lib/access';
import { fetchCharge, verifyCharge } from '@/lib/payments';
import { savePaymentRecord } from '@/lib/paymentStore';
import { logAction } from '@/lib/auditLog';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const chargeId = String(
      body.id || body.charge_id || body.tap_id || body.data?.id || ''
    );
    if (!chargeId) {
      return NextResponse.json({ error: 'CHARGE_ID_REQUIRED' }, { status: 400 });
    }

    const captured = await verifyCharge(chargeId);
    const charge = await fetchCharge(chargeId);
    const meta = (charge.metadata || {}) as Record<string, string>;
    const userId = String(meta.userId || body.userId || '');
    const childId = String(meta.childId || body.childId || '');
    const amount = Number(charge.amount || body.amount || 0);
    const currency = String(charge.currency || body.currency || 'SAR');

    await savePaymentRecord({
      chargeId,
      userId,
      childId,
      amount,
      currency,
      status: captured ? 'captured' : 'failed',
      description: String(charge.description || 'Tap payment'),
      createdAt: new Date().toISOString(),
    });

    if (captured) {
      const current = parseEntitlements(
        cookies().get(ENTITLEMENTS_COOKIE)?.value
      );
      const next = {
        ...current,
        assessmentPaid: true,
        studentName: current.studentName,
      };
      cookies().set(ENTITLEMENTS_COOKIE, serializeEntitlements(next), {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 90,
      });

      await logAction({
        userId: userId || 'webhook',
        action: 'create_assessment',
        entityType: 'assessment',
        entityId: chargeId,
      });
    }

    return NextResponse.json({ ok: true, captured, chargeId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'WEBHOOK_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

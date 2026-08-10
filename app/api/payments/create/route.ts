import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/lib/auditLog';
import {
  createCharge,
  extractCheckoutUrl,
  isTapConfigured,
} from '@/lib/payments';
import { savePaymentRecord } from '@/lib/paymentStore';
import { getPrice, type PricingTierId } from '@/lib/pricing';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const childId = String(body.childId || '');
    const assessmentType = String(body.assessmentType || body.tierId || 'assessment');
    const currency = String(body.currency || 'SAR').toUpperCase();
    const amount =
      body.amount != null
        ? Number(body.amount)
        : getPrice(assessmentType, currency);

    if (!childId) {
      return NextResponse.json(
        { error: 'CHILD_REQUIRED', message: 'معرّف الطفل مطلوب' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: 'INVALID_AMOUNT' }, { status: 400 });
    }

    const base =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
    const reference = `ord_${Date.now().toString(36)}_${childId.slice(0, 8)}`;
    const description =
      assessmentType === 'monitoring'
        ? 'متابعة شهرية — تآلف'
        : assessmentType === 'specialist'
          ? 'بوابة الأخصائي — تآلف'
          : 'تقييم شامل — تآلف';

    const redirectUrl = `${base}/payments/callback`;

    const charge = await createCharge({
      amount,
      currency,
      customer: {
        name: session.user.name || 'ولي أمر',
        email: session.user.email || 'parent@taaluf.local',
        phone: String(body.phone || '0500000000'),
      },
      redirectUrl,
      description,
      reference,
      metadata: {
        userId: session.user.id || '',
        childId,
        assessmentType,
      },
    });

    const checkoutUrl = extractCheckoutUrl(charge);
    if (!checkoutUrl || !charge.id) {
      return NextResponse.json(
        {
          error: 'CHARGE_FAILED',
          message: charge.message || 'تعذر إنشاء عملية الدفع',
          details: charge.errors || charge,
        },
        { status: 502 }
      );
    }

    await savePaymentRecord({
      chargeId: charge.id,
      userId: session.user.id || '',
      childId,
      amount,
      currency,
      status: 'pending',
      description,
      createdAt: new Date().toISOString(),
    });

    await logAction({
      userId: session.user.id || '',
      action: 'create_assessment',
      entityType: 'assessment',
      entityId: charge.id,
    });

    return NextResponse.json({
      ok: true,
      chargeId: charge.id,
      checkoutUrl,
      reference,
      amount,
      currency,
      tierId: assessmentType as PricingTierId,
      tapConfigured: isTapConfigured(),
      devMode: Boolean(charge._dev),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'PAYMENT_CREATE_FAILED';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

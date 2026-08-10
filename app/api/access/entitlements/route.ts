import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  arePaymentsDisabled,
  ENTITLEMENTS_COOKIE,
  isValidSubscriptionCode,
  OPEN_ENTITLEMENTS,
  parseEntitlements,
  serializeEntitlements,
  type Entitlements,
} from '@/lib/access';

function readEntitlements(): Entitlements {
  if (arePaymentsDisabled()) return { ...OPEN_ENTITLEMENTS };
  return parseEntitlements(cookies().get(ENTITLEMENTS_COOKIE)?.value);
}

function writeEntitlements(e: Entitlements) {
  cookies().set(ENTITLEMENTS_COOKIE, serializeEntitlements(e), {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, entitlements: readEntitlements() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const action = String(body.action || '');
  const current = readEntitlements();

  if (action === 'subscribe') {
    if (!isValidSubscriptionCode(String(body.code || ''))) {
      return NextResponse.json(
        { error: 'INVALID_CODE', message: 'رمز الاشتراك غير صحيح' },
        { status: 400 }
      );
    }
    const next: Entitlements = {
      ...current,
      subscriber: true,
      assessmentPaid: true,
      specialistPaid: true,
    };
    writeEntitlements(next);
    return NextResponse.json({
      ok: true,
      entitlements: next,
      message: 'تم تفعيل الاشتراك — البوابات مفتوحة بدون دفع إضافي',
    });
  }

  if (action === 'pay') {
    const product = String(body.product || '');
    const studentName = body.studentName
      ? String(body.studentName)
      : current.studentName;
    const next: Entitlements = { ...current, studentName };

    if (product === 'assessment') next.assessmentPaid = true;
    else if (product === 'specialistAccess') next.specialistPaid = true;
    else if (product === 'booking') {
      const slotId = String(body.slotId || '');
      if (!slotId) {
        return NextResponse.json(
          { error: 'SLOT_REQUIRED', message: 'اختر موعداً أولاً' },
          { status: 400 }
        );
      }
      if (!next.bookedSlots.includes(slotId)) {
        next.bookedSlots = [...next.bookedSlots, slotId];
      }
    } else {
      return NextResponse.json({ error: 'UNKNOWN_PRODUCT' }, { status: 400 });
    }

    writeEntitlements(next);
    return NextResponse.json({
      ok: true,
      entitlements: next,
      message: 'تم تأكيد الدفع التجريبي وتفعيل الخدمة',
    });
  }

  if (action === 'setStudent') {
    const next = {
      ...current,
      studentName: String(body.studentName || current.studentName || ''),
    };
    writeEntitlements(next);
    return NextResponse.json({ ok: true, entitlements: next });
  }

  return NextResponse.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
}

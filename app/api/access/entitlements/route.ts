import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  arePaymentsDisabled,
  ENTITLEMENTS_COOKIE,
  OPEN_ENTITLEMENTS,
  parseEntitlements,
  serializeEntitlements,
  type Entitlements,
} from '@/lib/access';
import { authOptions } from '@/lib/auth';
import { isValidSubscriptionCode } from '@/lib/subscriptionCodes';

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

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }),
    };
  }
  return { session };
}

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  return NextResponse.json({ ok: true, entitlements: readEntitlements() });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

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
    if (!arePaymentsDisabled()) {
      return NextResponse.json(
        {
          error: 'PAY_VIA_GATEWAY',
          message: 'الدفع يتم عبر بوابة Tap فقط',
        },
        { status: 403 }
      );
    }
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

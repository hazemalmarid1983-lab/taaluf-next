import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { PRICES } from '@/lib/access';
import { authOptions } from '@/lib/auth';
import { getSlotById } from '@/lib/booking';
import {
  addAssessment,
  addBooking,
  addPayment,
  addStudent,
} from '@/lib/platformData';

/** تسجيل أحداث المنصة (طلاب/تقييمات/حجوزات/مدفوعات) */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json();
  const type = String(body.type || '');
  const email = session.user.email || undefined;
  const role = session.user.role || undefined;

  if (type === 'student') {
    const row = await addStudent({
      id: String(body.id || `child_${Date.now()}`),
      name: String(body.name || 'طفل'),
      age: body.age != null ? Number(body.age) : undefined,
      dob: body.dob ? String(body.dob) : undefined,
      parentEmail:
        role === 'parent' ? email : body.parentEmail ? String(body.parentEmail) : undefined,
      parentName: body.parentName ? String(body.parentName) : undefined,
      specialistEmail:
        role === 'specialist' || role === 'teacher' ? email : undefined,
      createdAt: new Date().toISOString(),
      source:
        role === 'specialist' || role === 'teacher'
          ? 'specialist'
          : role === 'admin'
            ? 'admin'
            : 'parent',
    });
    return NextResponse.json({ ok: true, row });
  }

  if (type === 'assessment') {
    const row = await addAssessment({
      id: String(body.id || `asm_${Date.now()}`),
      studentId: body.studentId ? String(body.studentId) : undefined,
      studentName: String(body.studentName || 'طالب'),
      percentage: Number(body.percentage || 0),
      classification: String(body.classification || ''),
      totalScore: Number(body.totalScore || 0),
      maxScore: Number(body.maxScore || 0),
      savedAt: new Date().toISOString(),
      byRole: role,
      byEmail: email,
    });
    return NextResponse.json({ ok: true, row });
  }

  if (type === 'booking') {
    const slotId = String(body.slotId || '');
    const slot = getSlotById(slotId);
    const row = await addBooking({
      id: `bk_${Date.now()}`,
      slotId,
      slotLabel: slot?.label || slotId,
      studentName: String(body.studentName || 'طفل'),
      paidAt: new Date().toISOString(),
      byEmail: email,
    });
    return NextResponse.json({ ok: true, row });
  }

  if (type === 'payment') {
    const product = String(body.product || '') as keyof typeof PRICES;
    const price = PRICES[product];
    const row = await addPayment({
      id: `pay_${Date.now()}`,
      product,
      amount: price?.amount || Number(body.amount || 0),
      currency: price?.currency || 'AED',
      studentName: body.studentName ? String(body.studentName) : undefined,
      at: new Date().toISOString(),
      byEmail: email,
    });
    return NextResponse.json({ ok: true, row });
  }

  return NextResponse.json({ error: 'UNKNOWN_TYPE' }, { status: 400 });
}

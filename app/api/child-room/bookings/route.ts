import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSlotById } from '@/lib/booking';
import { canUseRoomChannel } from '@/lib/childRoom/roomMessages';
import {
  loadClinicalBookings,
  requestClinicalBooking,
  saveClinicalBookings,
} from '@/lib/childRoom/clinicalBookings';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  if (!canUseRoomChannel(session.user.role)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const childId = new URL(req.url).searchParams.get('childId')?.trim() || '';
  if (!childId) {
    return NextResponse.json({ error: 'CHILD_REQUIRED' }, { status: 400 });
  }
  const bookings = (await loadClinicalBookings()).filter(
    (row) => row.childId === childId
  );
  return NextResponse.json({ ok: true, bookings });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  if (!canUseRoomChannel(session.user.role)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as {
    childId?: string;
    childName?: string;
    slotId?: string;
  } | null;
  const slot = getSlotById(String(body?.slotId || ''));
  if (!slot) {
    return NextResponse.json({ error: 'SLOT_REQUIRED' }, { status: 400 });
  }
  const current = await loadClinicalBookings();
  const saved = requestClinicalBooking(current, {
    childId: body?.childId || '',
    childName: body?.childName || '',
    slotId: slot.id,
    slotLabel: slot.label,
    requestedBy: session.user.email || session.user.id || '',
  });
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: 400 });
  }
  await saveClinicalBookings(saved.bookings);
  return NextResponse.json({ ok: true, booking: saved.booking });
}

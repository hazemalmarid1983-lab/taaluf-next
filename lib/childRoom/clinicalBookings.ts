/**
 * طلبات موعد مراجعة التقدم داخل غرفة الطفل. الطلب ليس تأكيداً تشخيصياً ولا دفعة.
 */

import { readHubJsonFile, writeHubJsonFile } from '@/lib/hubPersistence';

export const CLINICAL_BOOKINGS_FILE = 'clinical-bookings.json';

export type ClinicalBookingRequest = {
  id: string;
  childId: string;
  childName: string;
  slotId: string;
  slotLabel: string;
  requestedBy: string;
  requestedAt: string;
  purpose: 'progress_review';
};

function clean(value: unknown, max: number) {
  return String(value || '').trim().slice(0, max);
}

export function parseClinicalBookings(raw: string | null): ClinicalBookingRequest[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { bookings?: unknown[] };
    if (!Array.isArray(parsed.bookings)) return [];
    return parsed.bookings.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      const booking: ClinicalBookingRequest = {
        id: clean(row.id, 80),
        childId: clean(row.childId, 80),
        childName: clean(row.childName, 80) || 'الطفل',
        slotId: clean(row.slotId, 80),
        slotLabel: clean(row.slotLabel, 160),
        requestedBy: clean(row.requestedBy, 120),
        requestedAt: clean(row.requestedAt, 40),
        purpose: 'progress_review',
      };
      if (!booking.id || !booking.childId || !booking.slotId) return [];
      return [booking];
    });
  } catch {
    return [];
  }
}

export function requestClinicalBooking(
  bookings: ClinicalBookingRequest[],
  input: Omit<ClinicalBookingRequest, 'id' | 'requestedAt' | 'purpose'>
):
  | { ok: true; bookings: ClinicalBookingRequest[]; booking: ClinicalBookingRequest }
  | { ok: false; error: string } {
  const childId = clean(input.childId, 80);
  const slotId = clean(input.slotId, 80);
  if (!childId || !slotId) return { ok: false, error: 'SLOT_REQUIRED' };
  if (bookings.some((row) => row.childId === childId && row.slotId === slotId)) {
    return { ok: false, error: 'SLOT_TAKEN' };
  }
  const booking: ClinicalBookingRequest = {
    id: `cb_${Date.now().toString(36)}`,
    childId,
    childName: clean(input.childName, 80) || 'الطفل',
    slotId,
    slotLabel: clean(input.slotLabel, 160) || slotId,
    requestedBy: clean(input.requestedBy, 120),
    requestedAt: new Date().toISOString(),
    purpose: 'progress_review',
  };
  return { ok: true, bookings: [booking, ...bookings].slice(0, 200), booking };
}

export async function loadClinicalBookings(): Promise<ClinicalBookingRequest[]> {
  return parseClinicalBookings(await readHubJsonFile(CLINICAL_BOOKINGS_FILE));
}

export async function saveClinicalBookings(
  bookings: ClinicalBookingRequest[]
): Promise<void> {
  await writeHubJsonFile(CLINICAL_BOOKINGS_FILE, JSON.stringify({ bookings }));
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAvailableSlots, type BookingSlot } from '@/lib/booking';
import type { ClinicalBookingRequest } from '@/lib/childRoom/clinicalBookings';
import {
  PRICING_PATH,
  readSelectedTier,
  tierAllowsClinicalBooking,
} from '@/lib/subscriptionTiers';

export default function ClinicalBookingButton({
  childId,
  childName,
}: {
  childId: string;
  childName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [selected, setSelected] = useState('');
  const [bookings, setBookings] = useState<ClinicalBookingRequest[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [clinical, setClinical] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSlots(getAvailableSlots());
    setClinical(tierAllowsClinicalBooking(readSelectedTier()));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetch(`/api/child-room/bookings?childId=${encodeURIComponent(childId)}`)
      .then((response) => response.json())
      .then((data: { bookings?: ClinicalBookingRequest[] }) => {
        setBookings(data.bookings || []);
      })
      .catch(() => setError('تعذر تحميل المواعيد السابقة.'));
  }, [open, childId]);

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    setError('');
    const response = await fetch('/api/child-room/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childId,
        childName: childName || 'الطفل',
        slotId: selected,
      }),
    });
    const data = (await response.json().catch(() => null)) as {
      booking?: ClinicalBookingRequest;
      error?: string;
    } | null;
    setBusy(false);
    if (!response.ok || !data?.booking) {
      setError(
        data?.error === 'SLOT_TAKEN'
          ? 'هذا الموعد مطلوب مسبقاً لهذه الغرفة.'
          : 'تعذر حفظ طلب الموعد.'
      );
      return;
    }
    setBookings((current) => [data.booking as ClinicalBookingRequest, ...current]);
    setSelected('');
  };

  if (!ready) return null;

  if (!clinical) {
    return (
      <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-slate-200 bg-white p-4 text-right">
        <p className="text-sm font-bold text-slate-900">حجز المختص السريري</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          حجز الموعد والمتابعة المباشرة ضمن باقة الإشراف السريري.
        </p>
        <Link href={PRICING_PATH} className="mt-3 inline-block text-sm font-bold text-[#2E7D8E] underline">
          عرض الباقة المتقدمة
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 max-w-lg">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-[#2E7D8E] px-4 py-4 text-base font-bold text-white shadow-sm"
      >
        حجز موعد مع المختص السريري
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 text-right"
            dir="rtl"
          >
            <h2 className="text-lg font-bold text-slate-900">مراجعة التقدم</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              طلب موعد استشاري لمراجعة تقدم {childName || 'الطفل'}. الطلب يصل إلى
              سجل المواعيد ولا يُعد تشخيصاً ولا تأكيداً سريرياً.
            </p>
            {bookings.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm text-emerald-800">
                {bookings.map((booking) => (
                  <li key={booking.id}>طُلب: {booking.slotLabel}</li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4 grid gap-2">
              {slots.map((slot) => {
                const taken = bookings.some((booking) => booking.slotId === slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={taken}
                    onClick={() => setSelected(slot.id)}
                    className={
                      taken
                        ? 'rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-400'
                        : selected === slot.id
                          ? 'rounded-xl border-2 border-[#2E7D8E] bg-sky-50 px-3 py-2 text-sm font-semibold'
                          : 'rounded-xl border border-slate-200 px-3 py-2 text-sm'
                    }
                  >
                    {slot.label}
                    {taken ? ' — مطلوب' : ''}
                  </button>
                );
              })}
            </div>
            {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={!selected || busy}
                onClick={() => void submit()}
                className="rounded-xl bg-[#2E7D8E] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                تأكيد الطلب
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

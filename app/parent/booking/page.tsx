'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getAvailableSlots, type BookingSlot } from '@/lib/booking';
import { PRICES, type Entitlements } from '@/lib/access';
import { useLanguage } from '@/components/LanguageProvider';

export default function ParentBookingPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [selected, setSelected] = useState('');
  const [ent, setEnt] = useState<Entitlements | null>(null);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    setSlots(getAvailableSlots());
    try {
      const raw = localStorage.getItem('taaluf.activeStudent');
      if (raw) setStudentName(JSON.parse(raw).name || '');
    } catch {
      /* ignore */
    }
    fetch('/api/access/entitlements')
      .then((r) => r.json())
      .then((d) => {
        setEnt(d.entitlements);
        if (d.entitlements?.studentName) {
          setStudentName((n) => n || d.entitlements.studentName);
        }
      })
      .catch(() => undefined);
  }, []);

  const booked = ent?.bookedSlots || [];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0b1f14]">{t('bookTitle')}</h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {t('bookLead', {
            amount: PRICES.booking.amount,
            currency: PRICES.booking.currency,
          })}
          {studentName ? ` ${t('childLabel', { name: studentName })}` : ''}
        </p>
      </div>

      {booked.length > 0 && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="font-bold">{t('confirmedBookings')}</p>
          <ul className="mt-2 list-disc pr-5">
            {booked.map((id) => (
              <li key={id}>
                {slots.find((s) => s.id === id)?.label || id}
                {studentName ? ` — ${studentName}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {slots.map((slot) => {
          const isBooked = booked.includes(slot.id);
          return (
            <button
              key={slot.id}
              type="button"
              disabled={isBooked}
              onClick={() => setSelected(slot.id)}
              className={
                isBooked
                  ? 'rounded-2xl border border-slate-100 bg-slate-50 p-4 text-start text-slate-400'
                  : selected === slot.id
                    ? 'rounded-2xl border-2 border-[#2D8B5A] bg-emerald-50 p-4 text-start'
                    : 'rounded-2xl border border-emerald-100 bg-white p-4 text-start hover:border-[#2D8B5A]/40'
              }
            >
              <p className="font-bold text-slate-900">{slot.label}</p>
              <p className="mt-1 text-xs text-slate-500">{slot.team}</p>
              {isBooked && (
                <p className="mt-2 text-xs font-semibold text-[#2D8B5A]">
                  {t('bookedPaid')}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <Button
        className="w-full sm:w-auto"
        disabled={!selected}
        onClick={() =>
          router.push(`/parent/booking/pay?slot=${encodeURIComponent(selected)}`)
        }
      >
        {t('continuePayBooking')}
      </Button>
    </section>
  );
}

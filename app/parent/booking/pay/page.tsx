'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentPanel from '@/components/access/PaymentPanel';
import { getSlotById } from '@/lib/booking';

function BookingPayInner() {
  const router = useRouter();
  const params = useSearchParams();
  const slotId = params.get('slot') || '';
  const slot = getSlotById(slotId);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('taaluf.activeStudent');
      if (raw) setStudentName(JSON.parse(raw).name || '');
    } catch {
      /* ignore */
    }
  }, []);

  if (!slot) {
    return (
      <p className="text-sm text-rose-600">
        الموعد غير متاح.{' '}
        <button
          type="button"
          className="underline"
          onClick={() => router.push('/parent/booking')}
        >
          العودة لاختيار موعد
        </button>
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-[#0b1f14]">دفع وتأكيد الحجز</h1>
        <p className="mt-2 text-sm text-slate-600">
          الموعد: <strong>{slot.label}</strong>
        </p>
        <p className="mt-1 text-sm text-slate-600">
          باسم: <strong>{studentName || 'الطفل المسجّل'}</strong>
        </p>
      </div>
      <PaymentPanel
        product="booking"
        slotId={slot.id}
        studentName={studentName}
        title="دفع فحص الفريق متعدد التخصصات"
        onPaid={() => router.push('/parent/booking?confirmed=1')}
      />
    </section>
  );
}

export default function BookingPayPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm">جاري التحميل…</p>}>
      <BookingPayInner />
    </Suspense>
  );
}

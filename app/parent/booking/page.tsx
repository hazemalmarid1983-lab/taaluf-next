'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CHILD_ROOM_PATH } from '@/lib/childRoom/gate';

export default function ParentBookingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`${CHILD_ROOM_PATH}?book=1`);
  }, [router]);

  return (
    <p className="px-4 py-16 text-center text-sm text-slate-600" dir="rtl">
      جارٍ فتح نافذة حجز الموعد المرتبطة بباقة الطفل.
    </p>
  );
}

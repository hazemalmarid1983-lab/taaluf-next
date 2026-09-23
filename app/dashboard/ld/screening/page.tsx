'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** يُعيد توجيه فرز صعوبات التعلم إلى الصفحة القائمة */
export default function LdScreeningRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/screening-learning');
  }, [router]);
  return null;
}

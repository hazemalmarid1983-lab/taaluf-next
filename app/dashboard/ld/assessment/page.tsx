'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** يُعيد توجيه التقييم الشامل إلى الصفحة القائمة */
export default function LdAssessmentRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/academic-assessment');
  }, [router]);
  return null;
}

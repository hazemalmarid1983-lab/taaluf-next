'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { JOURNEY_HYDRATED_EVENT } from '@/lib/childRoom/journeyClient';
import { readActiveChild } from '@/lib/parentJourney';
import { writeParentStageCookie } from '@/lib/parentRouteGuard';

/** يُبقي كوكي مرحلة ولي الأمر مطابقاً للطفل المسجل في المتصفح */
export default function ParentStageCookieSync() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isParent = session?.user?.role === 'parent';

  useEffect(() => {
    if (!isParent) return;
    const sync = () => writeParentStageCookie(Boolean(readActiveChild()));
    sync();
    window.addEventListener(JOURNEY_HYDRATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(JOURNEY_HYDRATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [isParent, pathname]);

  return null;
}

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { browserOwnerKey, ensureBrowserDataOwner } from '@/lib/browserDataOwner';

/** يمسح بيانات حساب سابق من المتصفح عند دخول حساب مختلف، ثم يعيد تحميل الصفحة نظيفة. */
export default function BrowserDataOwnerGuard() {
  const { data: session, status } = useSession();
  const owner = status === 'authenticated' ? browserOwnerKey(session?.user) : '';

  useEffect(() => {
    if (owner && ensureBrowserDataOwner(owner)) window.location.reload();
  }, [owner]);

  return null;
}

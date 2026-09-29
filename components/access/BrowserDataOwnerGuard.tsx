'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { browserOwnerKey, ensureBrowserDataOwner } from '@/lib/browserDataOwner';

/** يمسح بيانات حساب سابق من المتصفح عند دخول حساب مختلف، ثم يعيد تحميل الصفحة نظيفة. */
export default function BrowserDataOwnerGuard() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  // صفحة الدخول تمسح البيانات بنفسها قبل التوجيه؛ إعادة التحميل هنا تلغي ذلك التوجيه.
  const onLogin = pathname?.startsWith('/login') ?? false;
  const owner = status === 'authenticated' && !onLogin ? browserOwnerKey(session?.user) : '';

  useEffect(() => {
    if (owner && ensureBrowserDataOwner(owner)) window.location.reload();
  }, [owner]);

  return null;
}

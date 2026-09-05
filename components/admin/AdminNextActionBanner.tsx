'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import FrictionlessNextAction from '@/components/flow/FrictionlessNextAction';
import { useAdminHubNextAction } from '@/components/flow/useNextBestAction';
import type { ClinicalHubSnapshot } from '@/lib/clinicalHub';

/** يجلب حالة المركز البحثي لاقتراح الإجراء التالي على لوحة الإدارة */
export default function AdminNextActionBanner() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [snapshot, setSnapshot] = useState<ClinicalHubSnapshot | null>(null);

  useEffect(() => {
    fetch('/api/hub')
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data?.snapshot) setSnapshot(data.snapshot);
      })
      .catch(() => {
        /* admin may still use fallback NBA */
      });
  }, []);

  const action = useAdminHubNextAction(snapshot);

  return <FrictionlessNextAction action={action} isAr={isAr} />;
}

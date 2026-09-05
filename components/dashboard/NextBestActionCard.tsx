'use client';

import { useEffect, useMemo, useState } from 'react';
import FrictionlessNextAction from '@/components/flow/FrictionlessNextAction';
import { resolveSpecialistNextAction } from '@/lib/nextBestActionFlow';
import { readActiveChild } from '@/lib/parentJourney';

/**
 * بطاقة الخطوة التالية للأخصائي — تغليف موحّد للإجراء التالي الأفضل.
 */
export default function NextBestActionCard({
  childId: childIdProp,
  childName: childNameProp,
  isAr,
  className,
}: {
  childId?: string;
  childName?: string;
  isAr: boolean;
  className?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const action = useMemo(() => {
    if (!ready) return null;
    const active = readActiveChild();
    const childId = childIdProp || active?.id || 'child_local';
    const childName = childNameProp || active?.name;
    return resolveSpecialistNextAction(childId, childName);
  }, [ready, childIdProp, childNameProp]);

  return (
    <FrictionlessNextAction action={action} isAr={isAr} className={className} />
  );
}

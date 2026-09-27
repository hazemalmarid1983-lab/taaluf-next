'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { JOURNEY_HYDRATED_EVENT } from '@/lib/childRoom/journeyClient';
import { isServerChildId, syncChildClinicalRecord } from '@/lib/clinicalRecordClient';
import { ACTIVE_CHILD_CHANGED_EVENT, readActiveChild } from '@/lib/parentJourney';

/**
 * يربط طفل ولي الأمر المسجل في المتصفح بسجله على الخادم ويرحّل أهدافه،
 * ثم يحدّث parentStage في JWT (update) حتى يعتمد الـ middleware على الخادم.
 */
export default function ClinicalRecordSync() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const isParent = session?.user?.role === 'parent';
  const stage = session?.user?.parentStage;
  const synced = useRef(new Set<string>());

  useEffect(() => {
    if (!isParent) return;
    let cancelled = false;
    const sync = async () => {
      const child = readActiveChild();
      if (!child || !isServerChildId(child.id) || synced.current.has(child.id)) return;
      synced.current.add(child.id);
      const result = await syncChildClinicalRecord(child.id, { childName: child.name });
      if (cancelled || result.source !== 'server') return;
      if (result.parentStage && result.parentStage !== stage) {
        await update();
        router.refresh();
      }
    };
    void sync();
    const onChange = () => void sync();
    window.addEventListener(ACTIVE_CHILD_CHANGED_EVENT, onChange);
    window.addEventListener(JOURNEY_HYDRATED_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(ACTIVE_CHILD_CHANGED_EVENT, onChange);
      window.removeEventListener(JOURNEY_HYDRATED_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [isParent, stage, update, router]);

  return null;
}

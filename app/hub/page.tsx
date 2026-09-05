'use client';

import { Suspense } from 'react';
import HubWorkspace from '@/components/hub/HubWorkspace';

export default function HubPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl bg-white p-8 text-sm text-slate-500">
          جاري فتح المساحة الآمنة…
        </div>
      }
    >
      <HubWorkspace />
    </Suspense>
  );
}

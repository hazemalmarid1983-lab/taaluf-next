'use client';

import ResourceRoomScheduler from '@/components/ld/ResourceRoomScheduler';
import { useLanguage } from '@/components/LanguageProvider';

export default function LdResourceRoomPage() {
  const { t, dir } = useLanguage();

  return (
    <div dir={dir}>
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-900">{t('ldResourceRoom')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('ldResourceRoomSubtitle')}</p>
      </div>
      <ResourceRoomScheduler />
    </div>
  );
}

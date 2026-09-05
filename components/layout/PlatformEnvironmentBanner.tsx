'use client';

import { useLanguage } from '@/components/LanguageProvider';
import { platformTierLabel } from '@/lib/platformEnvironment';

export default function PlatformEnvironmentBanner({
  tier,
}: {
  tier: 'development' | 'preview' | 'production';
}) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const label = platformTierLabel(isAr);

  if (tier === 'production') return null;

  return (
    <div
      role="status"
      dir={isAr ? 'rtl' : 'ltr'}
      className="border-b border-amber-300/80 bg-amber-50 px-4 py-2 text-center text-xs font-semibold leading-6 text-amber-950 print:hidden"
    >
      {isAr ? (
        <>
          ⚠️ بيئة تجريبية — {label} · البيانات منفصلة عن الإنتاج · لا ترسل هذا
          الرابط للمستخدمين
        </>
      ) : (
        <>
          ⚠️ Non-production — {label} · Data is isolated from production · Do
          not share this URL with end users
        </>
      )}
    </div>
  );
}

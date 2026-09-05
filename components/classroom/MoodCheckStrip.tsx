'use client';

import { useLanguage } from '@/components/LanguageProvider';
import {
  REGULATION_ZONES,
  type RegulationZoneId,
} from '@/lib/regulationZones';

/**
 * تسجيل سريع لمنطقة الطفل الانفعالية بنقرة واحدة.
 *
 * مختصر عمداً: يُستعمل في لحظتين ضيّقتين (قبل المحاولات وبعدها)، فلو حمل
 * الشرح الكامل لأزاح التدريب نفسه عن الشاشة.
 */
export default function MoodCheckStrip({
  value = null,
  onChange,
  titleAr,
  titleEn,
  hintAr,
  hintEn,
  className,
}: {
  value?: RegulationZoneId | null;
  onChange: (zone: RegulationZoneId) => void;
  titleAr: string;
  titleEn: string;
  hintAr?: string;
  hintEn?: string;
  className?: string;
}) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <div className={`space-y-2.5 ${className || ''}`}>
      <div className="min-w-0">
        <strong className="text-xs font-black text-[#0b1f14]">
          {isAr ? titleAr : titleEn}
        </strong>
        {(hintAr || hintEn) && (
          <p className="mt-0.5 text-[11px] leading-6 text-slate-500">
            {isAr ? hintAr : hintEn}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {REGULATION_ZONES.map((zone) => {
          const active = value === zone.id;
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onChange(zone.id)}
              aria-pressed={active}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2.5 transition active:scale-95 ${zone.tone} ${
                active ? zone.activeTone : 'opacity-70 hover:opacity-100'
              }`}
            >
              <span className="text-xl leading-none">{zone.emoji}</span>
              <span className="text-[11px] font-black leading-5">
                {isAr ? zone.labelAr : zone.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

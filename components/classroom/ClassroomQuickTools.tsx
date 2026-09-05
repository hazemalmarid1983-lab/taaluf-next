'use client';

import { useEffect, type ReactNode } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import AACCommunicationBoard from './AACCommunicationBoard';
import EmotionalRegulationHub from './EmotionalRegulationHub';
import MotorTracingEngine from './MotorTracingEngine';
import type { RegulationZoneId } from '@/lib/regulationZones';

export type QuickToolId = 'aac' | 'calm' | 'tracing';

/** استعلامات تفتح الأداة مباشرة عند الوصول من روابط الأدوات الداخلية */
const OPEN_PARAMS: Record<QuickToolId, string> = {
  aac: 'aac',
  calm: 'calm',
  tracing: 'tracing',
};

const PANEL_COPY: Record<
  QuickToolId,
  { ariaAr: string; ariaEn: string; headerAr: string; headerEn: string }
> = {
  aac: {
    ariaAr: 'لوحة التواصل المعزز والبديل',
    ariaEn: 'Communication board',
    headerAr: 'التواصل أثناء التدريب',
    headerEn: 'Communicate during training',
  },
  calm: {
    ariaAr: 'محرك التنظيم الانفعالي',
    ariaEn: 'Emotional regulation hub',
    headerAr: 'التهدئة أثناء التدريب',
    headerEn: 'Calm down during training',
  },
  tracing: {
    ariaAr: 'محرك التتبع البصري الحركي',
    ariaEn: 'Motor tracing engine',
    headerAr: 'التتبع الحركي أثناء التدريب',
    headerEn: 'Motor tracing during training',
  },
};

/**
 * أدوات الوصول السريع أثناء التدريب: تواصل، تهدئة، وتتبع حركي.
 *
 * تُفتح فوق النشاط في شريط جانبي لا في صفحة مستقلة، فالطفل يطلب حاجته أو يهدأ
 * أو يمارس مهارة حركية ثم يعود للمحاولة نفسها دون فقدان ما رُصد.
 */
export default function ClassroomQuickTools({
  openTool,
  onOpenToolChange,
  soundOn = true,
  zone = null,
  onZoneChange,
}: {
  openTool: QuickToolId | null;
  onOpenToolChange: (tool: QuickToolId | null) => void;
  soundOn?: boolean;
  /** قراءة المشاعر الجارية — تُكتب في تقرير الجلسة */
  zone?: RegulationZoneId | null;
  onZoneChange?: (zone: RegulationZoneId) => void;
}) {
  const { lang, dir } = useLanguage();
  const isAr = lang === 'ar';

  // نقرأ الاستعلام من window لا من useSearchParams، فالأخير يفرض حدود Suspense على الصفحة
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const match = (Object.keys(OPEN_PARAMS) as QuickToolId[]).find(
      (tool) => params.get(OPEN_PARAMS[tool]) === '1'
    );
    if (match) onOpenToolChange(match);
    // مرة واحدة عند التحميل: الاستعلام نقطة بداية لا مصدر حقيقة مستمر
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!openTool) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenToolChange(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openTool, onOpenToolChange]);

  const close = () => onOpenToolChange(null);
  const panel = openTool ? PANEL_COPY[openTool] : null;

  return (
    <>
      <div className="fixed bottom-5 end-5 z-40 flex flex-col items-end gap-2.5">
        <QuickToolButton
          emoji="✏️"
          label={isAr ? 'التتبع' : 'Tracing'}
          title={
            isAr
              ? 'افتحي محرك التتبع الحركي'
              : 'Open the motor tracing engine'
          }
          expanded={openTool === 'tracing'}
          onClick={() => onOpenToolChange('tracing')}
          className="bg-[#7C6AE8] shadow-[#7C6AE8]/30 hover:bg-[#6a58d4]"
        />
        <QuickToolButton
          emoji="🧘"
          label={isAr ? 'التهدئة' : 'Calm'}
          title={
            isAr ? 'افتحي أدوات التنظيم الانفعالي' : 'Open the regulation tools'
          }
          expanded={openTool === 'calm'}
          onClick={() => onOpenToolChange('calm')}
          className="bg-[#5B8DEF] shadow-[#5B8DEF]/30 hover:bg-[#4a79d3]"
        />
        <QuickToolButton
          emoji="🗣️"
          label={isAr ? 'لوحة التواصل' : 'Communication'}
          title={
            isAr ? 'افتحي لوحة التواصل البديل' : 'Open the communication board'
          }
          expanded={openTool === 'aac'}
          onClick={() => onOpenToolChange('aac')}
          className="bg-[#2E7D8E] shadow-[#2E7D8E]/30 hover:bg-[#236372]"
        />
      </div>

      {openTool && panel && (
        <div dir={dir} className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label={isAr ? 'إغلاق اللوحة' : 'Close the panel'}
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/30 backdrop-blur-[2px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={isAr ? panel.ariaAr : panel.ariaEn}
            className="absolute inset-y-0 end-0 flex w-full max-w-xl flex-col overflow-y-auto border-s border-white/80 bg-[#f6f8f9] shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white bg-white/90 px-5 py-3 backdrop-blur-xl">
              <strong className="text-xs font-black text-[#0b1f14]">
                {isAr ? panel.headerAr : panel.headerEn}
              </strong>
              <button
                type="button"
                onClick={close}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-black text-slate-600 transition hover:bg-slate-100 active:scale-95"
              >
                {isAr ? 'إغلاق ✕' : 'Close ✕'}
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {openTool === 'aac' ? (
                <AACCommunicationBoard soundOn={soundOn} />
              ) : openTool === 'calm' ? (
                <EmotionalRegulationHub
                  soundOn={soundOn}
                  zone={zone}
                  onZoneChange={onZoneChange}
                />
              ) : (
                <MotorTracingEngine soundOn={soundOn} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function QuickToolButton({
  emoji,
  label,
  title,
  expanded,
  onClick,
  className,
}: {
  emoji: string;
  label: ReactNode;
  title: string;
  expanded: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      title={title}
      className={`flex items-center gap-2 rounded-full px-4 py-3.5 text-white shadow-xl transition active:scale-95 ${className}`}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <span className="hidden text-xs font-black sm:inline">{label}</span>
    </button>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import {
  BREATHING_COMPLETE_CUE,
  BREATHING_CYCLES,
  BREATHING_PHASES,
  BREATH_RESTING_SCALE,
  REGULATION_ZONES,
  breathCycleSeconds,
  zoneById,
  type RegulationZoneId,
} from '@/lib/regulationZones';
import { RewardAudio, speakText, stopSpeaking } from '@/lib/sensoryAudio';

/** عدد الفقاعات: يملأ صفّين دون أن تصغر الفقاعة عن مساحة لمس مريحة */
const BUBBLE_COUNT = 12;

/**
 * محرك التنظيم الانفعالي: مناطق المشاعر الأربع + أدوات تهدئة حسية فورية.
 *
 * الألوان مخفّفة والحركة بطيئة عن قصد؛ الطفل المتوتر يحتاج تقليل المدخلات
 * الحسية لا زيادتها، فأي وميض أو تشبّع لوني هنا يعاكس هدف الأداة.
 */
export default function EmotionalRegulationHub({
  zone = null,
  onZoneChange,
  soundOn = true,
  className,
}: {
  zone?: RegulationZoneId | null;
  onZoneChange?: (zone: RegulationZoneId) => void;
  soundOn?: boolean;
  className?: string;
}) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [popped, setPopped] = useState<number[]>([]);

  const audioRef = useRef<RewardAudio | null>(null);
  const refillRef = useRef<number | null>(null);

  // نقرأ اللغة والصوت من مراجع، فلا يُعاد تشغيل مؤقّت التنفس عند تبديل اللغة أثناء التمرين
  const soundRef = useRef(soundOn);
  const langRef = useRef(lang);
  useEffect(() => {
    soundRef.current = soundOn;
    langRef.current = lang;
  }, [soundOn, lang]);

  const getAudio = () => {
    if (!audioRef.current) audioRef.current = new RewardAudio();
    return audioRef.current;
  };

  useEffect(
    () => () => {
      stopSpeaking();
      if (refillRef.current) window.clearTimeout(refillRef.current);
    },
    []
  );

  // مؤقّت أطوار التنفس: كل طور ينطق إرشاده ثم يسلّم للطور التالي
  useEffect(() => {
    if (!running) return undefined;

    const phase = BREATHING_PHASES[phaseIndex];
    if (soundRef.current) {
      speakText(langRef.current === 'ar' ? phase.cueAr : phase.cueEn, {
        lang: langRef.current,
        rate: 0.72,
      });
    }

    const timer = window.setTimeout(() => {
      if (phaseIndex + 1 < BREATHING_PHASES.length) {
        setPhaseIndex(phaseIndex + 1);
        return;
      }
      if (cycle + 1 < BREATHING_CYCLES) {
        setCycle(cycle + 1);
        setPhaseIndex(0);
        return;
      }
      setRunning(false);
      setPhaseIndex(0);
      setCycle(0);
      if (soundRef.current) {
        getAudio().playChime();
        window.setTimeout(() => {
          speakText(
            langRef.current === 'ar'
              ? BREATHING_COMPLETE_CUE.cueAr
              : BREATHING_COMPLETE_CUE.cueEn,
            { lang: langRef.current, rate: 0.78 }
          );
        }, 420);
      }
    }, phase.seconds * 1000);

    return () => window.clearTimeout(timer);
  }, [running, phaseIndex, cycle]);

  const stopBreathing = () => {
    stopSpeaking();
    setRunning(false);
    setPhaseIndex(0);
    setCycle(0);
  };

  const pickZone = (id: RegulationZoneId) => {
    onZoneChange?.(id);
    const picked = zoneById(id);
    if (!picked || !soundOn) return;
    speakText(isAr ? picked.stateAr : picked.stateEn, { lang, rate: 0.8 });
  };

  const popBubble = (index: number) => {
    if (popped.includes(index)) return;
    const next = [...popped, index];
    setPopped(next);
    if (soundOn) getAudio().playPop();

    // تُعاد تعبئة اللوحة تلقائياً حتى يستمر التفريغ الحسي دون طلب من الطفل
    if (next.length === BUBBLE_COUNT) {
      if (refillRef.current) window.clearTimeout(refillRef.current);
      refillRef.current = window.setTimeout(() => setPopped([]), 800);
    }
  };

  const activePhase = BREATHING_PHASES[phaseIndex];
  const circleScale = running ? activePhase.scale : BREATH_RESTING_SCALE;
  const circleSeconds = running ? activePhase.seconds : 0.8;
  const selected = zoneById(zone);

  return (
    <section
      className={`space-y-5 rounded-3xl border border-white/90 bg-white/85 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-6 ${className || ''}`}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-sm font-black text-[#0b1f14] sm:text-base">
          <span className="text-xl">🧘</span>
          <span>
            {isAr
              ? 'محرك التنظيم الانفعالي ومناطق المشاعر'
              : 'Emotional regulation & feeling zones'}
          </span>
        </h2>
        <p className="mt-1 text-[11px] leading-6 text-slate-500">
          {isAr
            ? 'حدّدي منطقة الطفل الآن، ثم استخدمي أداة التهدئة المناسبة قبل بدء التدريب — بديل داخلي عن تطبيقات التهدئة الخارجية.'
            : 'Pick the child’s zone now, then use the matching calming tool before training — an in-platform alternative to external calming apps.'}
        </p>
      </div>

      {/* المناطق الأربع */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {REGULATION_ZONES.map((item) => {
          const active = zone === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => pickZone(item.id)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3.5 text-center transition active:scale-95 ${item.tone} ${
                active ? item.activeTone : 'hover:brightness-[0.98]'
              }`}
            >
              <span className="text-3xl leading-none">{item.emoji}</span>
              <span className="text-xs font-black leading-5">
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          aria-live="polite"
          className={`space-y-1.5 rounded-2xl border p-4 ${selected.tone}`}
        >
          <p dir="auto" className="text-xs font-black leading-6">
            «{isAr ? selected.stateAr : selected.stateEn}»
          </p>
          <p className="text-[11px] leading-6 opacity-80">
            <strong className="font-black">
              {isAr ? 'إرشاد ولي الأمر: ' : 'Parent guidance: '}
            </strong>
            {isAr ? selected.coachAr : selected.coachEn}
          </p>
        </div>
      )}

      {/* تمرين التنفس المتناغم */}
      <div className="space-y-4 rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50/80 to-white p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <strong className="flex items-center gap-2 text-xs font-black text-[#0b1f14]">
            <span className="text-base leading-none">🌬️</span>
            <span>{isAr ? 'تمرين التنفس المتناغم' : 'Paced breathing'}</span>
          </strong>
          <span className="text-[10px] font-bold text-slate-400">
            {isAr
              ? `${BREATHING_CYCLES} دورات · ${breathCycleSeconds()} ثانية لكل دورة`
              : `${BREATHING_CYCLES} cycles · ${breathCycleSeconds()}s each`}
          </span>
        </div>

        <div className="flex h-52 items-center justify-center">
          <div
            className="taaluf-breath-circle flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-teal-200 shadow-[0_0_45px_rgba(56,189,248,0.28)] ease-in-out"
            style={{
              transform: `scale(${circleScale})`,
              transitionProperty: 'transform',
              transitionDuration: `${circleSeconds}s`,
            }}
          >
            <span
              aria-live="polite"
              className="text-center text-sm font-black text-sky-900"
            >
              {running
                ? isAr
                  ? activePhase.labelAr
                  : activePhase.labelEn
                : isAr
                  ? 'جاهز'
                  : 'Ready'}
            </span>
          </div>
        </div>

        <p className="text-center text-[11px] font-bold leading-6 text-sky-900">
          {running
            ? `${isAr ? activePhase.cueAr : activePhase.cueEn} · ${
                isAr
                  ? `الدورة ${cycle + 1} من ${BREATHING_CYCLES}`
                  : `Cycle ${cycle + 1} of ${BREATHING_CYCLES}`
              }`
            : isAr
              ? 'اجلسي بجانب الطفل وتنفّسا معاً مع حركة الدائرة.'
              : 'Sit beside the child and breathe together with the circle.'}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => (running ? stopBreathing() : setRunning(true))}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-xs font-black text-white shadow-md transition active:scale-95 ${
              running
                ? 'bg-slate-500 hover:bg-slate-600'
                : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {running
              ? isAr
                ? '⏹ إيقاف التمرين'
                : '⏹ Stop the exercise'
              : isAr
                ? '▶ ابدئي التنفس معاً'
                : '▶ Start breathing together'}
          </button>
        </div>
      </div>

      {/* الفقاعات الحسية */}
      <div className="space-y-3 rounded-2xl border border-sky-100 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <strong className="flex items-center gap-2 text-xs font-black text-[#0b1f14]">
            <span className="text-base leading-none">🫧</span>
            <span>{isAr ? 'الفقاعات الحسية الهادئة' : 'Calm sensory pop'}</span>
          </strong>
          <button
            type="button"
            onClick={() => setPopped([])}
            disabled={!popped.length}
            className="rounded-full border border-sky-200 bg-white px-3 py-1 text-[10px] font-black text-sky-700 transition hover:bg-sky-50 active:scale-95 disabled:opacity-40"
          >
            {isAr ? '↺ إعادة الفقاعات' : '↺ Refill bubbles'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
          {Array.from({ length: BUBBLE_COUNT }, (_, index) => {
            const isPopped = popped.includes(index);
            return (
              <button
                key={index}
                type="button"
                onClick={() => popBubble(index)}
                disabled={isPopped}
                aria-label={
                  isAr ? `فقاعة ${index + 1}` : `Bubble ${index + 1}`
                }
                className="flex aspect-square items-center justify-center rounded-full p-0.5"
              >
                <span
                  className={`relative h-full w-full overflow-hidden rounded-full border-2 border-sky-400/55 bg-gradient-to-br from-cyan-200 via-sky-300 to-sky-500 shadow-[0_4px_16px_rgba(14,165,233,0.28),inset_0_2px_10px_rgba(255,255,255,0.75)] transition-all duration-300 ease-out ${
                    isPopped
                      ? 'scale-50 opacity-15'
                      : 'scale-100 opacity-100 hover:brightness-[1.04] active:scale-90'
                  }`}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-[14%] rounded-full bg-gradient-to-br from-white/80 via-white/35 to-transparent"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-[18%] start-[22%] h-[22%] w-[22%] rounded-full bg-white/45 blur-[1px]"
                  />
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-center text-[10px] leading-5 text-slate-400">
          {isAr
            ? 'لمسة ناعمة لتفريغ التوتر — تُعاد الفقاعات تلقائياً عند انتهائها.'
            : 'A gentle tap to release tension — bubbles refill automatically when finished.'}
        </p>
      </div>

      <p className="text-[10px] leading-5 text-slate-400">
        {isAr
          ? 'أدوات مساندة للتهدئة قبل التدريب، ولا تغني عن خطة سلوكية يضعها الأخصائي عند تكرار النوبات.'
          : 'Supportive calming tools before training — not a replacement for a specialist behaviour plan when meltdowns recur.'}
      </p>
    </section>
  );
}

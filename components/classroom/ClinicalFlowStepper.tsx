'use client';

import {
  CLINICAL_FLOW_STEPS,
  clinicalStepIndex,
  type ClinicalFlowStep,
} from '@/lib/adaptiveClinicalFlow';

/**
 * شريط مسار الجلسة السريرية المتدرّج.
 */
export default function ClinicalFlowStepper({
  currentStep,
  isAr,
  className,
}: {
  currentStep: ClinicalFlowStep;
  isAr: boolean;
  className?: string;
}) {
  const activeIdx = clinicalStepIndex(currentStep);

  return (
    <nav
      aria-label={isAr ? 'مسار الجلسة السريرية' : 'Clinical session flow'}
      className={`rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur-sm ${className || ''}`}
    >
      <ol className="flex items-center justify-between gap-1">
        {CLINICAL_FLOW_STEPS.map((step, idx) => {
          const done = idx < activeIdx;
          const active = idx === activeIdx;
          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition ${
                  active
                    ? 'bg-[#2E7D8E] text-white shadow-md'
                    : done
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-400'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                {done ? '✓' : step.emoji}
              </span>
              <span
                className={`hidden max-w-[4.5rem] truncate text-center text-[9px] font-bold leading-tight sm:block ${
                  active ? 'text-[#2E7D8E]' : done ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                {isAr ? step.labelAr : step.labelEn}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-1.5 text-center text-[10px] font-bold text-slate-500 sm:hidden">
        {isAr
          ? CLINICAL_FLOW_STEPS[activeIdx]?.labelAr
          : CLINICAL_FLOW_STEPS[activeIdx]?.labelEn}
      </p>
    </nav>
  );
}

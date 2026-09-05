'use client';

import type { SensorySessionEndReason } from '@/lib/sensorySessionEnd';
import { sensoryEndReasonLabel } from '@/lib/sensorySessionEnd';

export type SensorySessionResultStat = {
  labelAr: string;
  labelEn: string;
  value: string | number;
};

type SensorySessionResultsPanelProps = {
  isAr: boolean;
  titleAr: string;
  titleEn: string;
  endReason: SensorySessionEndReason;
  stats: SensorySessionResultStat[];
  onReplay: () => void;
  onExitGroup: () => void;
  variant?: 'dark' | 'light';
};

/** شاشة نتائج الجلسة — إعادة اللعب أو الخروج النهائي */
export default function SensorySessionResultsPanel({
  isAr,
  titleAr,
  titleEn,
  endReason,
  stats,
  onReplay,
  onExitGroup,
  variant = 'dark',
}: SensorySessionResultsPanelProps) {
  const dark = variant === 'dark';

  return (
    <div
      className={`absolute inset-0 z-[100] flex items-center justify-center p-4 ${
        dark ? 'bg-black/75 backdrop-blur-md' : 'bg-white/90 backdrop-blur-sm'
      }`}
      dir={isAr ? 'rtl' : 'ltr'}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className={`w-full max-w-md rounded-3xl border p-6 text-center shadow-2xl ${
          dark
            ? 'border-white/15 bg-slate-900/95 text-white'
            : 'border-teal-100 bg-white text-[#0b1f14]'
        }`}
      >
        <p className="text-5xl" aria-hidden>
          🌟
        </p>
        <h2 className="mt-3 text-xl font-black">{isAr ? titleAr : titleEn}</h2>
        <p
          className={`mt-1 text-xs font-bold ${
            dark ? 'text-amber-200/90' : 'text-amber-700'
          }`}
        >
          {sensoryEndReasonLabel(endReason, isAr)}
        </p>
        <p className={`mt-2 text-[11px] ${dark ? 'text-white/60' : 'text-slate-500'}`}>
          {isAr
            ? 'حُفظت نتيجة هذه الجولة. اختر إعادة اللعب أو الخروج النهائي من المجموعة.'
            : 'This round was saved. Replay or exit the full activity group.'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.labelAr}
              className={`rounded-2xl p-3 ${
                dark ? 'bg-white/8' : 'bg-teal-50'
              }`}
            >
              <p className={`text-[10px] ${dark ? 'text-white/50' : 'text-slate-500'}`}>
                {isAr ? stat.labelAr : stat.labelEn}
              </p>
              <p className={`text-lg font-black ${dark ? 'text-white' : 'text-teal-900'}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onReplay}
            className={`rounded-2xl px-5 py-3 text-sm font-bold ${
              dark
                ? 'bg-cyan-500 text-white hover:bg-cyan-400'
                : 'bg-[#2E7D8E] text-white hover:bg-[#256f7f]'
            }`}
          >
            {isAr ? 'إعادة اللعب' : 'Play again'}
          </button>

          <button
            type="button"
            onClick={onExitGroup}
            className={`rounded-2xl border px-5 py-3 text-sm font-bold ${
              dark
                ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isAr ? 'الخروج النهائي' : 'Final exit'}
          </button>
        </div>
      </div>
    </div>
  );
}

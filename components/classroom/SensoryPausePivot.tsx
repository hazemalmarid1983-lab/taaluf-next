'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getReadinessPath,
  saveSessionPause,
  type ReadinessState,
  type SessionPauseSnapshot,
} from '@/lib/adaptiveClinicalFlow';
import { stashSensoryReinforcerHandoff } from '@/lib/scheduleRewards';
import type { RegulationZoneId } from '@/lib/regulationZones';
import type { TrialResult } from '@/lib/homeClassroomEngine';

/**
 * إيقاف مؤقت للمحاولات والانتقال لغرفة حسية مهدئة — مع حفظ حالة الجلسة.
 */
export default function SensoryPausePivot({
  isAr,
  childId,
  goalId,
  goalTitleAr,
  trials,
  moodBefore,
  scheduleOn,
  schedulePassed,
  readiness,
  disabled,
}: {
  isAr: boolean;
  childId: string;
  goalId: string;
  goalTitleAr: string;
  trials: TrialResult[];
  moodBefore: RegulationZoneId | null;
  scheduleOn: boolean;
  schedulePassed: boolean;
  readiness: ReadinessState | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const pivot = (state: ReadinessState) => {
    const path = getReadinessPath(state);
    const snapshot: SessionPauseSnapshot = {
      childId,
      goalId,
      goalTitleAr,
      trials,
      moodBefore,
      scheduleOn,
      schedulePassed,
      readiness,
      savedAt: new Date().toISOString(),
      returnHref: '/dashboard/home-classroom',
      sensoryRoomHref: path.href,
    };
    saveSessionPause(snapshot);
    stashSensoryReinforcerHandoff({ href: path.href, totalSec: 120 });
    setConfirmOpen(false);
    router.push(path.href);
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setConfirmOpen(true)}
        className="fixed bottom-24 z-40 rounded-full border-2 border-violet-300/80 bg-violet-600 px-4 py-3 text-[11px] font-black text-white shadow-lg transition hover:bg-violet-700 active:scale-95 disabled:opacity-40 end-4"
        title={
          isAr
            ? 'إيقاف مؤقت — غرفة حسية مهدئة'
            : 'Sensory pause — calming room'
        }
      >
        {isAr ? '⏸ تحويل حسي' : '⏸ Sensory pause'}
      </button>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <h3 className="text-sm font-black text-[#0b1f14]">
              {isAr ? '⏸ تحويل حسي سريع' : '⏸ Quick sensory pivot'}
            </h3>
            <p className="mt-2 text-[11px] leading-6 text-slate-500">
              {isAr
                ? `تُحفظ ${trials.length} محاولة/محاولات وتعودين للتدريب بعد التهدئة.`
                : `${trials.length} trial(s) will be saved — resume training after calming.`}
            </p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => pivot('anxious')}
                className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-bold text-sky-900"
              >
                {isAr ? '🌌 تهدئة + تنفس' : '🌌 Calm & breathe'}
              </button>
              <button
                type="button"
                onClick={() => pivot('hyperactive')}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900"
              >
                {isAr ? '✨ تهدئة حركية' : '✨ Motor calming'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="mt-3 w-full text-center text-[11px] font-bold text-slate-400"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

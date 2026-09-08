'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { resolveTrainingEntryState } from '@/lib/training/planExecution';
import { setTrainingPlanLaunchContext } from '@/lib/training/planLaunchContext';
import { clearPlanActivityRecovery } from '@/lib/training/planActivitySafety';
import { readActiveTrainingChildId } from '@/lib/training/sessionPersistence';

function ActivityEmoji({ engineType }: { engineType: string }) {
  const emoji =
    engineType === 'follow-star'
      ? '⭐'
      : engineType === 'match-me'
        ? '🧩'
        : engineType === 'where-did-it-go'
          ? '👀'
          : engineType === 'find-the-target'
            ? '🎯'
            : engineType === 'wait-then-touch'
              ? '⏱️'
              : '🎮';

  return (
    <span className="text-6xl" aria-hidden>
      {emoji}
    </span>
  );
}

export default function TrainingPlanEntry() {
  const router = useRouter();
  const childId = useMemo(() => readActiveTrainingChildId(), []);

  const entryState = useMemo(() => {
    if (!childId) {
      return { kind: 'no_plan' as const };
    }
    try {
      return resolveTrainingEntryState(childId);
    } catch (error) {
      console.error('[taaluf-training] resolveTrainingEntryState failed', error);
      return { kind: 'no_plan' as const };
    }
  }, [childId]);

  const handleStart = useCallback(() => {
    if (entryState.kind !== 'ready') return;

    const { execution } = entryState;
    if (!execution.plan || !execution.assignment || !execution.activityRoute) {
      return;
    }

    clearPlanActivityRecovery();
    setTrainingPlanLaunchContext({
      planId: execution.plan.id,
      chapterId: execution.plan.chapterId,
      mediaId: execution.assignment.mediaId,
      difficulty: execution.assignment.difficulty,
      order: execution.assignment.order,
    });

    router.push(execution.activityRoute);
  }, [entryState, router]);

  if (!childId) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-amber-50 p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-amber-900">
          يرجى تحديد الطفل قبل بدء التدريب.
        </p>
      </div>
    );
  }

  if (entryState.kind === 'no_plan') {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-800">لا توجد خطة تدريب نشطة</p>
        <p className="mt-2 text-sm text-slate-600">
          اطلب من معلمك أو ولي أمرك تفعيل خطة تدريب قبل البدء.
        </p>
      </div>
    );
  }

  if (entryState.kind === 'complete') {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-emerald-50 p-8 text-center shadow-sm">
        <p className="text-2xl" aria-hidden>
          🎉
        </p>
        <p className="mt-3 text-lg font-semibold text-emerald-900">
          أحسنت! أنهيت خطة التدريب
        </p>
        <p className="mt-2 text-sm text-emerald-800">
          يمكنك العودة لاحقاً عندما تكون هناك خطة جديدة.
        </p>
      </div>
    );
  }

  const { execution } = entryState;
  const media = execution.media;

  if (!media) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-amber-50 p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-amber-900">تعذّر تحميل النشاط التالي</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm">
      <div className="flex justify-center">
        <ActivityEmoji engineType={media.engineType} />
      </div>
      <h1 className="mt-4 text-xl font-bold text-slate-900">{media.titleAr}</h1>
      <p className="mt-2 text-sm text-slate-600">نشاطك التالي في التدريب</p>
      <button
        type="button"
        onClick={handleStart}
        className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-700"
      >
        ابدأ
      </button>
    </div>
  );
}

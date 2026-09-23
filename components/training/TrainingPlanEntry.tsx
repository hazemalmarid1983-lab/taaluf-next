'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ActiveChildTrainingPrompt from '@/components/training/ActiveChildTrainingPrompt';
import { resolveTrainingEntryState } from '@/lib/training/planExecution';
import {
  beginSpecializedTrainingFromBridge,
  buildTrainingPlanLaunchContextFromExecution,
  consumeTrainingBridgeNotice,
} from '@/lib/training/trainingBridge';
import { useActiveTrainingStudent } from '@/lib/training/useActiveTrainingStudent';

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
  const profile = useActiveTrainingStudent();
  const childId = profile?.id ?? null;
  const [bridgeNotice, setBridgeNotice] = useState<string | null>(null);

  useEffect(() => {
    setBridgeNotice(consumeTrainingBridgeNotice());
  }, []);

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

    const launch = buildTrainingPlanLaunchContextFromExecution(execution);
    if (!launch) return;

    beginSpecializedTrainingFromBridge({
      launch,
      activityRoute: execution.activityRoute,
      navigate: (href) => router.push(href),
    });
  }, [entryState, router]);

  if (!childId) {
    return (
      <div className="mx-auto max-w-lg">
        <ActiveChildTrainingPrompt />
      </div>
    );
  }

  if (entryState.kind === 'no_plan') {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        {bridgeNotice ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900">
            {bridgeNotice}
          </p>
        ) : null}
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-800">لا توجد خطة تدريب نشطة</p>
        <p className="mt-2 text-sm text-slate-600">
          اطلب من معلمك أو ولي أمرك تفعيل خطة تدريب قبل البدء.
        </p>
        </div>
      </div>
    );
  }

  if (entryState.kind === 'complete') {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        {bridgeNotice ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900">
            {bridgeNotice}
          </p>
        ) : null}
      <div className="rounded-2xl bg-emerald-50 p-8 text-center shadow-sm">
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
    <div className="mx-auto max-w-lg space-y-4">
      {bridgeNotice ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900">
          {bridgeNotice}
        </p>
      ) : null}
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
      <div className="flex justify-center">
        <ActivityEmoji engineType={media.engineType} />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">{media.titleAr}</h2>
      <p className="mt-2 text-sm text-slate-600">نشاطك التالي في التدريب</p>
      <button
        type="button"
        onClick={handleStart}
        className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-700"
      >
        ابدأ
      </button>
      </div>
    </div>
  );
}

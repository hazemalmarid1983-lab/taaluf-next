'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ActiveChildTrainingPrompt from '@/components/training/ActiveChildTrainingPrompt';
import {
  ensureActiveTrainingPlanFromAssessment,
  hasCompletedAssessmentForTraining,
  isAssessmentPreparedPlan,
} from '@/lib/training/assessmentTrainingPlan';
import { findMediaInChapter, loadChapterById } from '@/lib/training/loadChapter';
import {
  resolveTrainingEntryState,
  type TrainingEntryState,
  type TrainingPlanExecutionResult,
} from '@/lib/training/planExecution';
import {
  beginSpecializedTrainingFromBridge,
  buildTrainingPlanLaunchContextFromExecution,
  consumeTrainingBridgeNotice,
} from '@/lib/training/trainingBridge';
import { useActiveTrainingStudent } from '@/lib/training/useActiveTrainingStudent';
import type { TrainingPlan } from '@/lib/training/types';

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

function preparedActivityTitles(plan: TrainingPlan): string[] {
  try {
    const chapter = loadChapterById(plan.chapterId);
    return [...plan.assignments]
      .sort((a, b) => a.order - b.order)
      .map((item) => findMediaInChapter(chapter, item.mediaId)?.titleAr)
      .filter((title): title is string => Boolean(title));
  } catch {
    return [];
  }
}

export default function TrainingPlanEntry() {
  const router = useRouter();
  const profile = useActiveTrainingStudent();
  const childId = profile?.id ?? null;
  const [bridgeNotice, setBridgeNotice] = useState<string | null>(null);
  const [entryState, setEntryState] = useState<TrainingEntryState | null>(null);

  useEffect(() => {
    setBridgeNotice(consumeTrainingBridgeNotice());
  }, []);

  const refreshEntry = useCallback(() => {
    if (!childId) {
      setEntryState({ kind: 'no_plan' });
      return { kind: 'no_plan' } as TrainingEntryState;
    }
    try {
      ensureActiveTrainingPlanFromAssessment(childId);
      const next = resolveTrainingEntryState(childId);
      setEntryState(next);
      return next;
    } catch (error) {
      console.error('[taaluf-training] resolveTrainingEntryState failed', error);
      const fallback = { kind: 'no_plan' } as const;
      setEntryState(fallback);
      return fallback;
    }
  }, [childId]);

  useEffect(() => {
    refreshEntry();
  }, [refreshEntry]);

  const startExecution = useCallback(
    (execution: TrainingPlanExecutionResult) => {
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
    },
    [router]
  );

  const handleStart = useCallback(() => {
    if (entryState?.kind !== 'ready') return;
    startExecution(entryState.execution);
  }, [entryState, startExecution]);

  const handlePrepareAndStart = useCallback(() => {
    const next = refreshEntry();
    if (next.kind === 'ready') {
      startExecution(next.execution);
    }
  }, [refreshEntry, startExecution]);

  if (!childId) {
    return (
      <div className="mx-auto max-w-lg">
        <ActiveChildTrainingPrompt />
      </div>
    );
  }

  if (!entryState) {
    return null;
  }

  const notice = bridgeNotice ? (
    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900">
      {bridgeNotice}
    </p>
  ) : null;

  const assessmentReady =
    entryState.kind === 'no_plan' && hasCompletedAssessmentForTraining(childId);

  if (assessmentReady) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        {notice}
        <PreparedStartCard onStart={handlePrepareAndStart} titles={[]} />
      </div>
    );
  }

  if (entryState.kind === 'no_plan') {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        {notice}
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
        {notice}
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

  if (
    execution.plan &&
    isAssessmentPreparedPlan(execution.plan) &&
    media
  ) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        {notice}
        <PreparedStartCard
          onStart={handleStart}
          titles={preparedActivityTitles(execution.plan)}
          leadTitle={media.titleAr}
        />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-amber-50 p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-amber-900">تعذّر تحميل النشاط التالي</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {notice}
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

function PreparedStartCard({
  onStart,
  titles,
  leadTitle,
}: {
  onStart: () => void;
  titles: string[];
  leadTitle?: string;
}) {
  const shown = titles.length > 0 ? titles : leadTitle ? [leadTitle] : [];
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
      <p className="text-lg font-bold text-slate-900">
        جاهز للبدء! بناءً على تقييم طفلك، تم تحضير الأنشطة التالية
      </p>
      {shown.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
          {shown.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-slate-500">
        أنشطة تدريب منزلية مُحضّرة من التقييم. إكمال الجلسة الرقمية لا يعني إتقان المعيار.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-700"
      >
        ابدأ الجلسة الأولى
      </button>
    </div>
  );
}

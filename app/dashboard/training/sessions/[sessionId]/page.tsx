'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { getTrainingProgress, getTrainingSession } from '@/lib/training/storage';
import { loadGoalsLocal } from '@/lib/goalsStore';
import {
  canViewTrainingSession,
  formatResponseTimeMs,
  formatTrainingDate,
  promptBreakdownEntries,
  promptLevelLabelAr,
  readActiveStudentProfile,
  resolveGoalImpactsForSession,
  resolveMediaTitleAr,
  resolveSessionMetrics,
} from '@/lib/training/trainingResultsPresentation';
import { readActiveTrainingChildId } from '@/lib/training/sessionPersistence';

function masteryLabelAr(
  level: string | undefined
): string {
  switch (level) {
    case 'mastered':
      return 'بلغ عتبة النشاط';
    case 'developing':
      return 'في تطور';
    case 'emerging':
      return 'ناشئ';
    case 'not_started':
      return 'لم يبدأ';
    default:
      return level ?? '—';
  }
}

export default function TrainingSessionDetailPage() {
  const params = useParams();
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';

  const profile = useMemo(() => readActiveStudentProfile(), []);
  const activeChildId = profile?.id ?? readActiveTrainingChildId();

  const session = useMemo(
    () => (sessionId ? getTrainingSession(sessionId) : null),
    [sessionId]
  );

  const allowed = canViewTrainingSession(session, activeChildId);

  const goals = useMemo(() => {
    if (!activeChildId) return [];
    return loadGoalsLocal(activeChildId);
  }, [activeChildId]);

  if (!sessionId || !allowed || !session) {
    return (
      <div className="px-4 py-8 sm:px-6" dir="rtl">
        <div className="mx-auto mt-2 max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-lg font-bold text-[#0b1f14]">تعذّر عرض الجلسة</h1>
          <p className="mt-2 text-sm text-slate-600">
            الجلسة غير موجودة، أو غير مكتملة، أو لا تتبع الطفل النشط على هذا
            الجهاز.
          </p>
        </div>
      </div>
    );
  }

  const metrics = resolveSessionMetrics(session);
  const breakdown = promptBreakdownEntries(metrics);
  const mediaTitle = resolveMediaTitleAr(session.chapterId, session.mediaId);
  const childName = profile?.name ?? session.childId;
  const goalImpacts = resolveGoalImpactsForSession(session, goals);
  const progress = getTrainingProgress(
    session.childId,
    session.chapterId,
    session.mediaId
  );

  return (
    <div className="px-4 py-8 sm:px-6" dir="rtl">
      <header className="mx-auto mt-2 max-w-3xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#2E7D8E]">
          تفاصيل جلسة تدريب
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#0b1f14]">{mediaTitle}</h1>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">الطفل</dt>
            <dd className="font-semibold text-slate-800">{childName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">التاريخ</dt>
            <dd className="font-semibold text-slate-800">
              {formatTrainingDate(session.endedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">الصعوبة</dt>
            <dd className="font-semibold text-slate-800">مستوى {session.difficulty}</dd>
          </div>
          <div>
            <dt className="text-slate-500">الخطة</dt>
            <dd className="font-semibold text-slate-800">
              {session.planId ?? '—'}
            </dd>
          </div>
        </dl>
      </header>

      <section className="mx-auto mt-6 max-w-3xl rounded-3xl border border-slate-100 bg-white p-6">
        <h2 className="text-base font-bold text-[#0b1f14]">ملخص الأداء</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">المحاولات</dt>
            <dd className="text-lg font-bold text-slate-900">{metrics.totalTrials}</dd>
          </div>
          <div>
            <dt className="text-slate-500">صحيح</dt>
            <dd className="text-lg font-bold text-emerald-800">{metrics.correctCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">خطأ / دون إنجاز</dt>
            <dd className="text-lg font-bold text-slate-800">{metrics.incorrectCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">الدقة</dt>
            <dd className="text-lg font-bold text-slate-900">{metrics.accuracy}%</dd>
          </div>
          <div>
            <dt className="text-slate-500">الاستقلالية</dt>
            <dd className="text-lg font-bold text-slate-900">{metrics.independence}%</dd>
          </div>
          <div>
            <dt className="text-slate-500">متوسط زمن الاستجابة</dt>
            <dd className="text-lg font-bold text-slate-900">
              {formatResponseTimeMs(metrics.averageResponseTimeMs)}
            </dd>
          </div>
        </dl>
      </section>

      {progress ? (
        <section className="mx-auto mt-4 max-w-3xl rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4 text-sm">
          <h2 className="text-xs font-bold text-slate-500">تقدم الوسيلة (TrainingProgress)</h2>
          <p className="mt-1 text-slate-700">
            جلسات مكتملة على هذا النشاط:{' '}
            <strong>{progress.completedSessions}</strong>
            {progress.lastSessionAt ? (
              <>
                {' '}
                · آخر جلسة: {formatTrainingDate(progress.lastSessionAt)}
              </>
            ) : null}
            {progress.masteryLevel ? (
              <>
                {' '}
                · مؤشر تقدّم النشاط داخل المنصة (ليس إتقان المعيار):{' '}
                {masteryLabelAr(progress.masteryLevel)}
              </>
            ) : null}
          </p>
        </section>
      ) : null}

      <section className="mx-auto mt-6 max-w-3xl rounded-3xl border border-slate-100 bg-white p-6">
        <h2 className="text-base font-bold text-[#0b1f14]">توزيع المساعدة</h2>
        {breakdown.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">لا توجد محاولات مسجّلة.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {breakdown.map((row) => (
              <li
                key={row.level}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm"
              >
                <span className="text-slate-700">{row.labelAr}</span>
                <span className="font-bold text-slate-900">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-auto mt-6 max-w-3xl rounded-3xl border border-slate-100 bg-white p-6">
        <h2 className="text-base font-bold text-[#0b1f14]">المحاولات</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-right text-xs text-slate-500">
                <th className="py-2 pe-3 font-semibold">#</th>
                <th className="py-2 pe-3 font-semibold">النتيجة</th>
                <th className="py-2 pe-3 font-semibold">درجة المساعدة</th>
                <th className="py-2 pe-3 font-semibold">زمن الاستجابة</th>
                <th className="py-2 font-semibold">وقت التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {session.trials.map((trial) => (
                <tr key={trial.trialNumber} className="border-b border-slate-100">
                  <td className="py-3 pe-3 font-medium text-slate-800">
                    {trial.trialNumber}
                  </td>
                  <td className="py-3 pe-3">
                    {trial.correct ? (
                      <span className="font-semibold text-emerald-800">صحيح</span>
                    ) : (
                      <span className="font-semibold text-slate-600">غير صحيح</span>
                    )}
                  </td>
                  <td className="py-3 pe-3 text-slate-700">
                    {promptLevelLabelAr(trial.promptLevel)}
                  </td>
                  <td className="py-3 pe-3 text-slate-700">
                    {formatResponseTimeMs(trial.responseTimeMs)}
                  </td>
                  <td className="py-3 text-slate-600">
                    {formatTrainingDate(trial.recordedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-3xl rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6">
        <h2 className="text-base font-bold text-[#0b1f14]">أثر الهدف</h2>
        {!session.goalIds?.length ? (
          <p className="mt-3 text-sm text-slate-600">
            لا توجد أهداف مرتبطة بهذه الجلسة.
          </p>
        ) : goalImpacts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            أهداف مرتبطة في الجلسة، لكن لا يوجد سجل GoalSession مطابق على هذا
            الجهاز.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {goalImpacts.map((impact) => (
              <li
                key={impact.goalId}
                className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm"
              >
                <p className="font-bold text-[#0b1f14]">{impact.goalTitle}</p>
                {impact.recordedProgressAfter !== null ? (
                  <p className="mt-1 text-slate-700">
                    التقدّم المسجّل بعد الجلسة:{' '}
                    <strong>{impact.recordedProgressAfter}</strong>
                  </p>
                ) : null}
                {impact.incrementDisplay ? (
                  <p className="mt-1 text-slate-600">
                    التقدّم المسجّل من هذه الجلسة:{' '}
                    <strong>{impact.incrementDisplay}</strong>
                  </p>
                ) : null}
                {!impact.recordedProgressAfter && !impact.incrementDisplay ? (
                  <p className="mt-1 text-slate-500">
                    لا يوجد سجل GoalSession لهذه الجلسة على هذا الهدف.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

'use client';



import Link from 'next/link';

import { useMemo } from 'react';

import ActiveChildTrainingPrompt from '@/components/training/ActiveChildTrainingPrompt';

import { listTrainingSessions } from '@/lib/training/storage';

import { loadGoalsLocal } from '@/lib/goalsStore';

import { useActiveTrainingStudent } from '@/lib/training/useActiveTrainingStudent';

import {

  filterCompletedSessionsForChild,

  formatResponseTimeMs,

  formatTrainingDate,

  resolveGoalTitles,

  resolveMediaTitleAr,

  resolveSessionMetrics,

} from '@/lib/training/trainingResultsPresentation';



export default function TrainingSessionResultsList() {

  const profile = useActiveTrainingStudent();

  const childId = profile?.id ?? null;



  const sessions = useMemo(() => {

    if (!childId) return [];

    return filterCompletedSessionsForChild(listTrainingSessions(), childId);

  }, [childId]);



  const goals = useMemo(() => {

    if (!childId) return [];

    return loadGoalsLocal(childId);

  }, [childId]);



  if (!childId) {

    return (

      <section

        className="mt-10"

        dir="rtl"

        aria-label="سجل جلسات التدريب"

      >

        <h2 className="mb-4 text-lg font-bold text-[#0b1f14]">سجل جلسات التدريب</h2>

        <ActiveChildTrainingPrompt

          title="يرجى تحديد الطفل النشط لعرض الجلسات المكتملة"

          subtitle="بعد اختيار الطفل من حالاتك، ارجع إلى هذه الصفحة لعرض السجل."

        />

      </section>

    );

  }



  return (

    <section

      className="mt-10 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm"

      dir="rtl"

      aria-label="سجل جلسات التدريب"

    >

      <h2 className="text-lg font-bold text-[#0b1f14]">سجل جلسات التدريب</h2>

      <p className="mt-1 text-xs text-slate-500">

        جلسات مكتملة للطفل النشط — للمراقب والمختص

      </p>



      {sessions.length === 0 ? (

        <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-600">

          لا توجد جلسات تدريب مكتملة محفوظة بعد. تظهر الجلسات هنا بعد إنهاء

          نشاط من الخطة وحفظ النتائج على هذا الجهاز.

        </p>

      ) : (

        <ul className="mt-6 space-y-4">

          {sessions.map((session) => {

            const metrics = resolveSessionMetrics(session);

            const title = resolveMediaTitleAr(session.chapterId, session.mediaId);

            const goalTitles = resolveGoalTitles(session.goalIds, goals);



            return (

              <li key={session.id}>

                <Link

                  href={`/dashboard/training/sessions/${encodeURIComponent(session.id)}`}

                  className="block rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-[#2E7D8E]/30 hover:bg-white"

                >

                  <div className="flex flex-wrap items-start justify-between gap-2">

                    <div>

                      <p className="font-bold text-[#0b1f14]">{title}</p>

                      <p className="mt-1 text-xs text-slate-500">

                        {formatTrainingDate(session.endedAt)}

                      </p>

                    </div>

                    <span className="rounded-full bg-[#2E7D8E]/10 px-3 py-1 text-xs font-semibold text-[#2E7D8E]">

                      صعوبة {session.difficulty}

                    </span>

                  </div>

                  {goalTitles.length > 0 ? (

                    <p className="mt-2 text-xs text-slate-600">

                      الأهداف: {goalTitles.join(' · ')}

                    </p>

                  ) : null}

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">

                    <div>

                      <dt className="text-slate-500">المحاولات</dt>

                      <dd className="font-semibold text-slate-800">

                        {metrics.totalTrials}

                      </dd>

                    </div>

                    <div>

                      <dt className="text-slate-500">الدقة</dt>

                      <dd className="font-semibold text-slate-800">

                        {metrics.accuracy}%

                      </dd>

                    </div>

                    <div>

                      <dt className="text-slate-500">الاستقلالية</dt>

                      <dd className="font-semibold text-slate-800">

                        {metrics.independence}%

                      </dd>

                    </div>

                    <div>

                      <dt className="text-slate-500">متوسط الزمن</dt>

                      <dd className="font-semibold text-slate-800">

                        {formatResponseTimeMs(metrics.averageResponseTimeMs)}

                      </dd>

                    </div>

                  </dl>

                </Link>

              </li>

            );

          })}

        </ul>

      )}

    </section>

  );

}


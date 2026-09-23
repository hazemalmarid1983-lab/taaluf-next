'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import type { TrackedGoal } from '@/lib/goalsEngine';
import {
  studentsForSpecialist,
  type SpecialistStudent,
} from '@/lib/specialistCaseload';
import {
  buildMediaOptionsFromGoalViews,
  checkPlanBuilderActivePlan,
  describeSavedPlan,
  listCandidateEntriesForGoal,
  loadGoalsForPlanBuilder,
  PLAN_BUILDER_ACTIVE_PLAN_MESSAGE,
  PLAN_BUILDER_EMPTY_CANDIDATES_HINT,
  PLAN_BUILDER_EMPTY_CANDIDATES_MESSAGE,
  resolvePlanBuilderGoalViews,
  saveTrainingPlanFromBuilder,
  TRAINING_PLAN_BUILDER_DISCLAIMER,
  type PlanBuilderGoalView,
} from '@/lib/training/planBuilder';
import type { TrainingDifficulty, TrainingPlan } from '@/lib/training/types';
import { syncActiveTrainingStudentAfterPlanSave } from '@/lib/training/trainingActiveChildUx';

type BuilderStep =
  | 'child'
  | 'goals'
  | 'activities'
  | 'configure'
  | 'review'
  | 'success';

const STEP_LABELS: Record<Exclude<BuilderStep, 'success'>, string> = {
  child: 'اختيار الطفل',
  goals: 'اختيار الأهداف',
  activities: 'اختيار الأنشطة',
  configure: 'ترتيب وصعوبة',
  review: 'مراجعة',
};

function readActiveStudent(): SpecialistStudent | null {
  try {
    const raw = localStorage.getItem('taaluf.activeStudent');
    if (!raw) return null;
    return JSON.parse(raw) as SpecialistStudent;
  } catch {
    return null;
  }
}

function goalStatusLabel(status: TrackedGoal['status']): string {
  if (status === 'active') return 'نشط';
  if (status === 'done') return 'مكتمل';
  return 'متوقف';
}

export default function TrainingPlanBuilder() {
  const { data: session } = useSession();
  const specialistEmail = String(session?.user?.email || '');

  const [step, setStep] = useState<BuilderStep>('child');
  const [students, setStudents] = useState<SpecialistStudent[]>([]);
  const [selectedChild, setSelectedChild] = useState<SpecialistStudent | null>(
    null
  );
  const [goals, setGoals] = useState<TrackedGoal[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<
    Record<string, TrainingDifficulty>
  >({});
  const [activePlanBlocked, setActivePlanBlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedPlan, setSavedPlan] = useState<TrainingPlan | null>(null);
  const [savedSummary, setSavedSummary] = useState<ReturnType<
    typeof describeSavedPlan
  > | null>(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await fetch('/api/students');
        const data = await res.json();
        const remote: SpecialistStudent[] =
          res.ok && Array.isArray(data.records)
            ? data.records.map(
                (r: { id: string; fields: Record<string, unknown> }) => ({
                  id: r.id,
                  name: String(r.fields.name || r.fields.Name || ''),
                  dob: String(r.fields.dob || r.fields.DOB || ''),
                  age: Number(r.fields.age || 0) || undefined,
                })
              )
            : [];
        setStudents(studentsForSpecialist(specialistEmail, remote));
      } catch {
        setStudents(studentsForSpecialist(specialistEmail));
      }
    };

    void loadStudents();
    setSelectedChild(readActiveStudent());
  }, [specialistEmail]);

  const goalViews = useMemo<PlanBuilderGoalView[]>(() => {
    if (!selectedChild || selectedGoalIds.length === 0) return [];
    try {
      return resolvePlanBuilderGoalViews(selectedChild.id, selectedGoalIds);
    } catch {
      return [];
    }
  }, [selectedChild, selectedGoalIds]);

  const mediaOptions = useMemo(
    () => buildMediaOptionsFromGoalViews(goalViews),
    [goalViews]
  );

  const selectedMediaOptions = useMemo(
    () =>
      selectedMediaIds
        .map((mediaId) => mediaOptions.find((item) => item.mediaId === mediaId))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [mediaOptions, selectedMediaIds]
  );

  const selectChild = useCallback((student: SpecialistStudent) => {
    setSelectedChild(student);
    localStorage.setItem('taaluf.activeStudent', JSON.stringify(student));
    setGoals(loadGoalsForPlanBuilder(student.id));
    setSelectedGoalIds([]);
    setSelectedMediaIds([]);
    setDifficulties({});
    setErrorMessage('');

    const activeCheck = checkPlanBuilderActivePlan(student.id);
    setActivePlanBlocked(!activeCheck.allowed);
  }, []);

  useEffect(() => {
    if (selectedChild) {
      setGoals(loadGoalsForPlanBuilder(selectedChild.id));
    }
  }, [selectedChild]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoalIds((current) =>
      current.includes(goalId)
        ? current.filter((id) => id !== goalId)
        : [...current, goalId]
    );
  };

  const toggleMedia = (mediaId: string) => {
    setSelectedMediaIds((current) => {
      if (current.includes(mediaId)) {
        return current.filter((id) => id !== mediaId);
      }
      setDifficulties((prev) => ({
        ...prev,
        [mediaId]: prev[mediaId] ?? 1,
      }));
      return [...current, mediaId];
    });
  };

  const moveMedia = (mediaId: string, direction: 'up' | 'down') => {
    setSelectedMediaIds((current) => {
      const index = current.indexOf(mediaId);
      if (index < 0) return current;
      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  };

  const handleSave = () => {
    if (!selectedChild) return;
    setErrorMessage('');

    try {
      const plan = saveTrainingPlanFromBuilder({
        childId: selectedChild.id,
        selectedGoalIds,
        orderedMediaIds: selectedMediaIds,
        difficulties,
      });
      syncActiveTrainingStudentAfterPlanSave({
        id: selectedChild.id,
        name: selectedChild.name || selectedChild.id,
        age: selectedChild.age,
        dob: selectedChild.dob,
      });
      setSavedPlan(plan);
      setSavedSummary(describeSavedPlan(plan));
      setStep('success');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'تعذّر حفظ الخطة'
      );
    }
  };

  if (step === 'success' && savedPlan && savedSummary && selectedChild) {
    return (
      <section dir="rtl" className="mx-auto max-w-2xl space-y-6 text-right">
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardTitle className="text-emerald-900">
            تم إنشاء البرنامج التدريبي
          </CardTitle>
          <div className="mt-4 space-y-3 text-sm text-emerald-900">
            <p>
              <span className="font-semibold">الطفل:</span>{' '}
              {selectedChild.name || selectedChild.id}
            </p>
            <p>
              <span className="font-semibold">عدد الأنشطة:</span>{' '}
              {savedSummary.activityCount}
            </p>
            <p>
              <span className="font-semibold">النشاط الأول:</span>{' '}
              {savedSummary.firstActivityTitleAr || savedSummary.firstActivityMediaId}
            </p>
            <p>
              <span className="font-semibold">حالة الخطة:</span> نشط
            </p>
            <Link href="/dashboard/training">
              <Button className="mt-4 w-full sm:w-auto">الانتقال إلى التدريب</Button>
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section dir="rtl" className="mx-auto max-w-4xl space-y-6 text-right">
      <div>
        <p className="text-sm font-semibold text-[#2E7D8E]">المختص · التدريب</p>
        <h1 className="mt-1 text-3xl font-bold text-[#0b1f14]">
          إنشاء برنامج تدريبي
        </h1>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          اختر الأهداف والأنشطة صراحةً. النظام يقترح محتوى تدريبياً فقط ولا
          يشخّص ولا يصف علاجاً.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {(Object.keys(STEP_LABELS) as Array<keyof typeof STEP_LABELS>).map(
          (key) => (
            <span
              key={key}
              className={`rounded-full px-3 py-1 font-semibold ${
                step === key
                  ? 'bg-[#2E7D8E] text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {STEP_LABELS[key]}
            </span>
          )
        )}
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      {activePlanBlocked && selectedChild ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {PLAN_BUILDER_ACTIVE_PLAN_MESSAGE}
        </div>
      ) : null}

      {step === 'child' ? (
        <Card>
          <CardTitle>1. اختيار الطفل</CardTitle>
          <div className="mt-4 space-y-3">
            {students.length === 0 ? (
              <p className="text-sm text-slate-600">
                لا توجد حالات مسجّلة.{' '}
                <Link href="/dashboard/students" className="text-[#2E7D8E] underline">
                  افتح قائمة الحالات
                </Link>
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {students.map((student) => (
                  <li key={student.id}>
                    <button
                      type="button"
                      onClick={() => selectChild(student)}
                      className={`w-full rounded-2xl border px-4 py-3 text-right transition ${
                        selectedChild?.id === student.id
                          ? 'border-[#2E7D8E] bg-[#2E7D8E]/5'
                          : 'border-slate-200 bg-white hover:border-[#2E7D8E]/40'
                      }`}
                    >
                      <p className="font-semibold text-[#0b1f14]">
                        {student.name || 'بدون اسم'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{student.id}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              disabled={!selectedChild}
              onClick={() => setStep('goals')}
              className="mt-4"
            >
              متابعة
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 'goals' && selectedChild ? (
        <Card>
          <CardTitle>2. اختيار الأهداف</CardTitle>
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600">
              الطفل: <span className="font-semibold">{selectedChild.name}</span>
            </p>
            {goals.length === 0 ? (
              <p className="text-sm text-slate-600">
                لا توجد أهداف مسجّلة لهذا الطفل.{' '}
                <Link href="/dashboard/goals" className="text-[#2E7D8E] underline">
                  راجع الأهداف
                </Link>
              </p>
            ) : (
              <ul className="space-y-2">
                {goals.map((goal) => (
                  <li key={goal.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedGoalIds.includes(goal.id)}
                        onChange={() => toggleGoal(goal.id)}
                        className="mt-1"
                      />
                      <span className="flex-1">
                        <span className="block font-semibold text-[#0b1f14]">
                          {goal.title}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {goal.criterionId} · {goalStatusLabel(goal.status)} ·
                          التقدم {goal.current}/{goal.target}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep('child')}>
                رجوع
              </Button>
              <Button
                type="button"
                disabled={selectedGoalIds.length === 0}
                onClick={() => setStep('activities')}
              >
                متابعة
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {step === 'activities' && selectedChild ? (
        <Card>
          <CardTitle>3. اختيار الأنشطة التدريبية</CardTitle>
          <div className="mt-4 space-y-6">
            {goalViews.map((view) => (
              <div
                key={view.goal.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <p className="text-xs font-semibold text-[#2E7D8E]">الهدف</p>
                <p className="font-semibold text-[#0b1f14]">{view.goal.title}</p>

                {!view.hasCandidates ? (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                    <p>{PLAN_BUILDER_EMPTY_CANDIDATES_MESSAGE}</p>
                    <p className="mt-2 text-xs">{PLAN_BUILDER_EMPTY_CANDIDATES_HINT}</p>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {listCandidateEntriesForGoal(view).map((entry) => (
                      <li key={`${view.goal.id}-${entry.mediaId}`}>
                        <label className="flex cursor-pointer gap-3 rounded-xl border border-white bg-white p-3 shadow-sm">
                          <input
                            type="checkbox"
                            checked={selectedMediaIds.includes(entry.mediaId)}
                            onChange={() => toggleMedia(entry.mediaId)}
                            className="mt-1"
                          />
                          <span className="flex-1 space-y-1 text-sm">
                            <span className="block text-xs text-slate-500">
                              المعيار: {entry.criterionId} — {entry.criterionTitle}
                            </span>
                            <span className="block text-xs text-slate-500">
                              المهارة: {entry.skillTitleAr}
                            </span>
                            <span className="block font-semibold text-[#0b1f14]">
                              النشاط: {entry.mediaTitleAr}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep('goals')}>
                رجوع
              </Button>
              <Button
                type="button"
                disabled={selectedMediaIds.length === 0}
                onClick={() => setStep('configure')}
              >
                متابعة ({selectedMediaIds.length} نشاط)
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {step === 'configure' ? (
        <Card>
          <CardTitle>4. ترتيب الأنشطة والصعوبة</CardTitle>
          <div className="mt-4 space-y-3">
            {selectedMediaOptions.map((option, index) => (
              <div
                key={option.mediaId}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <p className="font-semibold text-[#0b1f14]">
                  {index + 1}. {option.mediaTitleAr}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  المهارة: {option.skillTitleAr}
                </p>
                {option.relatedGoalTitles.length > 1 ? (
                  <p className="mt-1 text-xs text-slate-500">
                    مرتبط بعدة أهداف: {option.relatedGoalTitles.join(' · ')}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="text-sm">
                    الصعوبة:
                    <select
                      value={difficulties[option.mediaId] ?? 1}
                      onChange={(event) =>
                        setDifficulties((prev) => ({
                          ...prev,
                          [option.mediaId]: Number(
                            event.target.value
                          ) as TrainingDifficulty,
                        }))
                      }
                      className="mr-2 rounded-lg border border-slate-200 px-2 py-1"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() => moveMedia(option.mediaId, 'up')}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={index === selectedMediaOptions.length - 1}
                    onClick={() => moveMedia(option.mediaId, 'down')}
                  >
                    ↓
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('activities')}
              >
                رجوع
              </Button>
              <Button type="button" onClick={() => setStep('review')}>
                مراجعة
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {step === 'review' && selectedChild ? (
        <Card>
          <CardTitle>5. مراجعة وحفظ</CardTitle>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p>
                <span className="font-semibold">الطفل:</span>{' '}
                {selectedChild.name || selectedChild.id}
              </p>
              <p className="mt-2">
                <span className="font-semibold">الأهداف:</span>{' '}
                {goalViews.map((view) => view.goal.title).join(' · ')}
              </p>
            </div>

            <ul className="space-y-2">
              {selectedMediaOptions.map((option, index) => (
                <li
                  key={option.mediaId}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <p className="font-semibold">
                    {index + 1}. {option.mediaTitleAr}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    المهارة: {option.skillTitleAr} · الصعوبة:{' '}
                    {difficulties[option.mediaId] ?? 1}
                  </p>
                </li>
              ))}
            </ul>

            <p className="rounded-xl border border-[#2E7D8E]/20 bg-[#2E7D8E]/5 px-4 py-3 text-sm text-slate-700">
              {TRAINING_PLAN_BUILDER_DISCLAIMER}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('configure')}
              >
                رجوع
              </Button>
              <Button
                type="button"
                disabled={activePlanBlocked}
                onClick={handleSave}
              >
                تأكيد وإنشاء البرنامج
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
    </section>
  );
}

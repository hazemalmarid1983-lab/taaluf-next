'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import PhysicianClinicalSummary, {
  type PhysicianSummaryData,
} from '@/components/PhysicianClinicalSummary';
import {
  DEMO_PHYSICIAN_SUMMARY,
  DOCTOR_DEMO_CODE,
  doctorReferralCode,
  isValidDoctorReferral,
} from '@/lib/doctorReferral';
import { loadGoalsLocal } from '@/lib/goalsStore';
import {
  TRACKING_PLAN_LABEL,
  buildPhysicianSummaryInput,
  sliceHistoryByPlan,
  type TrackingPlan,
} from '@/lib/progressTracker';
import { loadLocalStudents } from '@/lib/specialistCaseload';

const PLANS: TrackingPlan[] = ['single', 'half_year', 'annual'];

function applyPlan(
  data: PhysicianSummaryData,
  plan: TrackingPlan
): PhysicianSummaryData {
  return {
    ...data,
    trackingPlan: plan,
    assessmentsHistory: sliceHistoryByPlan(data.assessmentsHistory, plan),
  };
}

function DoctorSummaryInner() {
  const params = useParams();
  const search = useSearchParams();
  const childId = String(params?.childId || '');
  const urlCode = search.get('code');

  const [unlocked, setUnlocked] = useState(false);
  const [codeInput, setCodeInput] = useState(urlCode || '');
  const [gateMsg, setGateMsg] = useState('');
  const [plan, setPlan] = useState<TrackingPlan>('annual');
  const [sourceData, setSourceData] = useState<PhysicianSummaryData>(
    DEMO_PHYSICIAN_SUMMARY
  );
  const [usingDemo, setUsingDemo] = useState(true);

  useEffect(() => {
    if (isValidDoctorReferral(childId, urlCode)) {
      setUnlocked(true);
      setCodeInput(urlCode || '');
    }
  }, [childId, urlCode]);

  useEffect(() => {
    if (!unlocked || !childId) return;
    try {
      const student = loadLocalStudents().find((s) => s.id === childId);
      const built = buildPhysicianSummaryInput({
        childName: student?.name || '',
        age: student?.age,
        dob: student?.dob,
        doctorName: 'عيادة النمو والسلوك',
        studentId: childId,
        goals: loadGoalsLocal(childId),
      });
      if (built.assessmentsHistory.length > 0 && student?.name) {
        setSourceData({
          ...built,
          childName: student.name,
          doctorName: built.doctorName || 'عيادة النمو والسلوك',
        });
        setPlan(built.trackingPlan);
        setUsingDemo(false);
        return;
      }
    } catch {
      /* fallback to demo */
    }
    setSourceData({
      ...DEMO_PHYSICIAN_SUMMARY,
      childName:
        loadLocalStudents().find((s) => s.id === childId)?.name ||
        DEMO_PHYSICIAN_SUMMARY.childName,
    });
    setPlan('annual');
    setUsingDemo(true);
  }, [unlocked, childId]);

  const viewData = useMemo(() => applyPlan(sourceData, plan), [sourceData, plan]);

  const unlock = (e: FormEvent) => {
    e.preventDefault();
    if (!isValidDoctorReferral(childId, codeInput)) {
      setGateMsg('كود الإحالة غير مطابق لهذه الحالة.');
      return;
    }
    setGateMsg('');
    setUnlocked(true);
  };

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-bold text-[#2E7D8E]">بوابة الطبيب والعيادات</p>
        <h1 className="mt-2 text-2xl font-bold text-[#1F2A37]">
          أدخل كود الإحالة
        </h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          هذا الملخص موجّه للطبيب عبر رابط الحالة أو كود الإحالة الصادر من تآلف.
          لا يُعد تشخيصاً طبياً.
        </p>
        <form onSubmit={unlock} className="mt-6 space-y-3">
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="مثال: TFL-XXXX أو TAALUF-CLINIC"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            dir="ltr"
          />
          {gateMsg ? (
            <p className="text-sm font-medium text-rose-700">{gateMsg}</p>
          ) : (
            <p className="text-xs text-slate-400">
              للتجربة يمكن استخدام {DOCTOR_DEMO_CODE}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-[#2E7D8E] py-2.5 text-sm font-bold text-white"
          >
            فتح الملخص السريري
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="rounded-3xl border border-slate-200 bg-white px-6 py-5">
        <p className="text-xs font-bold text-[#2E7D8E]">
          بوابة الطبيب والعيادات
        </p>
        <h1 className="mt-1 text-xl font-bold text-[#1F2A37]">
          الملخص التراكمي للحالة
        </h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          بدّل بين فترات الرصد حسب حاجة الكشف. الكود المعتمد لهذه الحالة:{' '}
          <span className="font-mono text-[#2E7D8E]" dir="ltr">
            {doctorReferralCode(childId)}
          </span>
        </p>
        {usingDemo ? (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            يُعرض سجل توضيحي لأن التقييمات المحفوظة لهذه الحالة غير متاحة على هذا
            الجهاز.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {PLANS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlan(p)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                plan === p
                  ? 'bg-[#2E7D8E] text-white'
                  : 'border border-[#2E7D8E]/30 bg-[#FAF7F1] text-[#2E7D8E]'
              }`}
            >
              {TRACKING_PLAN_LABEL[p]}
            </button>
          ))}
        </div>
      </header>
      <PhysicianClinicalSummary data={viewData} />
    </div>
  );
}

export default function DoctorSummaryViewPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F1] px-4 py-8 font-sans" dir="rtl">
      <Suspense
        fallback={
          <p className="py-16 text-center text-sm text-slate-500">
            جاري فتح بوابة الطبيب…
          </p>
        }
      >
        <DoctorSummaryInner />
      </Suspense>
    </div>
  );
}

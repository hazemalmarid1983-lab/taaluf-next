'use client';

import { useEffect, useState } from 'react';
import type { TrackedGoal } from '@/lib/goalsEngine';
import { fetchIoaReview } from '@/lib/clinicalRecordClient';
import { IOA_METHOD_LABELS_AR, type IoaSummary } from '@/lib/ioa';
import type { IoaRecord } from '@/types/clinical';

/** مراجعة المشرف: متوسط الاتفاق، التغطية مقابل الهدف، والسجلات دون الحد المقبول */
export default function IoaReviewPanel({
  childId,
  goals,
  refreshKey,
}: {
  childId: string;
  goals: TrackedGoal[];
  refreshKey: number;
}) {
  const [summary, setSummary] = useState<IoaSummary | null>(null);
  const [records, setRecords] = useState<IoaRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchIoaReview(childId).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setSummary(res.summary);
        setRecords(res.records);
        setError(null);
      } else {
        setError(res.status === 403 ? null : 'تعذّر تحميل مراجعة اتفاق الملاحظين');
        setSummary(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [childId, refreshKey]);

  if (error) return <p className="text-xs text-red-700">{error}</p>;
  if (!summary) return null;

  const title = (goalId: string) => goals.find((g) => g.id === goalId)?.title ?? goalId;
  const coverageOk = summary.coveragePct >= summary.coverageTargetPct;
  const meanOk = summary.meanAgreementPct !== null && summary.meanAgreementPct >= summary.acceptablePct;

  return (
    <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4" dir="rtl">
      <div>
        <h2 className="text-base font-bold">مراجعة اتفاق الملاحظين (IOA)</h2>
        <p className="text-xs text-slate-500">
          الحد المقبول {summary.acceptablePct}% · هدف التغطية {summary.coverageTargetPct}% من الجلسات (مسودة بانتظار
          الاعتماد العلمي)
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-2xl bg-slate-50 p-2">
          <p className="text-slate-500">عدد المراجعات</p>
          <p className="text-lg font-bold">{summary.records}</p>
        </div>
        <div className={`rounded-2xl p-2 ${meanOk ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          <p className="text-slate-500">متوسط الاتفاق</p>
          <p className="text-lg font-bold">
            {summary.meanAgreementPct === null ? '—' : `${summary.meanAgreementPct}%`}
          </p>
        </div>
        <div className={`rounded-2xl p-2 ${coverageOk ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          <p className="text-slate-500">التغطية</p>
          <p className="text-lg font-bold">{summary.coveragePct}%</p>
        </div>
      </div>
      {summary.byGoal.length > 0 ? (
        <ul className="space-y-1 text-xs">
          {summary.byGoal.map((g) => (
            <li key={g.goalId} className="flex justify-between gap-2">
              <span className="truncate">{title(g.goalId)}</span>
              <span className="shrink-0 text-slate-600">
                {g.ioaSessions}/{g.sessions} جلسة · {g.meanAgreementPct === null ? '—' : `${g.meanAgreementPct}%`}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {summary.belowStandard.length > 0 ? (
        <div className="rounded-2xl bg-red-50 p-3 text-xs text-red-900">
          <p className="mb-1 font-semibold">سجلات دون الحد المقبول — تحتاج إعادة تدريب أو مراجعة التعريف الإجرائي</p>
          <ul className="space-y-1">
            {summary.belowStandard.map((r) => (
              <li key={r.ioa_id}>
                {title(r.goal_id)} · {new Date(r.session_at).toLocaleDateString('ar')} ·{' '}
                {IOA_METHOD_LABELS_AR[r.method]} · <strong>{r.agreement_pct}%</strong> (
                {r.primary.observer_name ?? r.primary.observer_id} ↔ {r.secondary.observer_name ?? r.secondary.observer_id})
              </li>
            ))}
          </ul>
        </div>
      ) : records.length > 0 ? (
        <p className="text-xs text-emerald-800">كل سجلات الاتفاق ضمن الحد المقبول.</p>
      ) : (
        <p className="text-xs text-slate-500">لم يُسجّل اتفاق ملاحظين بعد.</p>
      )}
    </section>
  );
}

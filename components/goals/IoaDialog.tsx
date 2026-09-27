'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { TrackedGoal } from '@/lib/goalsEngine';
import { IOA_ERRORS_AR, IOA_METHOD_LABELS_AR, ioaSessionOptions, type IoaError, type IoaInput } from '@/lib/ioa';
import type { ClinicalPromptLevel } from '@/lib/skillMastery';
import TrialScoreInput from '@/components/goals/TrialScoreInput';

const inputClass = 'w-full rounded-xl border px-3 py-2 text-sm';

/**
 * ملاحظ ثانٍ يسجّل بيانات موازية لجلسة محفوظة.
 * لا تُعرض بيانات الملاحظ الأساسي حتى لا تتأثر الملاحظة المستقلة.
 */
export default function IoaDialog({
  goal,
  defaultObserverName,
  onSubmit,
  onCancel,
}: {
  goal: TrackedGoal;
  defaultObserverName?: string;
  onSubmit: (input: IoaInput) => Promise<string[] | null>;
  onCancel: () => void;
}) {
  const options = ioaSessionOptions(goal);
  const [sessionAt, setSessionAt] = useState(options[0]?.at ?? '');
  const [observerName, setObserverName] = useState(defaultObserverName ?? '');
  const [trialScores, setTrialScores] = useState<ClinicalPromptLevel[]>([]);
  const [total, setTotal] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const selected = options.find((o) => o.at === sessionAt);

  const submit = async () => {
    if (!selected) return;
    const input: IoaInput = { goalId: goal.id, sessionAt, observerName, notes };
    if (selected.method === 'trial_by_trial') input.trialScores = trialScores;
    else if (selected.method === 'total_count') input.totalCount = total;
    else input.totalDurationMinutes = total;
    setSaving(true);
    const result = await onSubmit(input);
    setSaving(false);
    if (result) setErrors(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-3xl bg-white p-6">
        <div>
          <h3 className="text-lg font-bold">اتفاق الملاحظين (IOA)</h3>
          <p className="mt-1 text-xs text-slate-500">
            {goal.title} · سجّل ما لاحظته أنت بشكل مستقل، دون الرجوع لتسجيل المدرّب.
          </p>
        </div>

        {options.length === 0 ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            لا توجد جلسات قابلة للمقارنة. يلزم تسجيل عدد/مدة السلوك، أو مستوى المساعدة لكل محاولة.
          </p>
        ) : (
          <>
            <label className="block text-sm font-semibold">
              الجلسة
              <select
                className={`${inputClass} mt-1`}
                value={sessionAt}
                onChange={(e) => {
                  setSessionAt(e.target.value);
                  setTrialScores([]);
                  setTotal('');
                }}
              >
                {options.map((o) => (
                  <option key={o.at} value={o.at}>
                    {new Date(o.at).toLocaleString('ar')} · {IOA_METHOD_LABELS_AR[o.method]}
                    {o.trials ? ` · ${o.trials} محاولة` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              اسم الملاحظ الثاني
              <input
                className={`${inputClass} mt-1`}
                value={observerName}
                onChange={(e) => setObserverName(e.target.value)}
              />
            </label>
            {selected?.method === 'trial_by_trial' ? (
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="mb-2 text-sm font-semibold">مستوى المساعدة لكل محاولة كما لاحظته</p>
                <TrialScoreInput value={trialScores} onChange={setTrialScores} expectedCount={selected.trials} />
              </div>
            ) : (
              <label className="block text-sm font-semibold">
                {selected?.method === 'total_count' ? 'عدد مرات السلوك كما لاحظته' : 'مدة السلوك كما لاحظتها (دقائق)'}
                <input
                  className={`${inputClass} mt-1`}
                  inputMode="decimal"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                />
              </label>
            )}
            <textarea
              className={inputClass}
              rows={2}
              placeholder="ملاحظات (اختياري)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </>
        )}

        {errors.length ? (
          <ul className="list-disc space-y-1 pr-5 text-xs text-red-700">
            {errors.map((e) => (
              <li key={e}>{IOA_ERRORS_AR[e as IoaError] ?? e}</li>
            ))}
          </ul>
        ) : null}

        <div className="flex gap-2">
          <Button onClick={submit} disabled={saving || !selected}>
            احسب الاتفاق
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}

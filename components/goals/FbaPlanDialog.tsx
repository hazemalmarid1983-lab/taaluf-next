'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { TrackedGoal } from '@/lib/goalsEngine';
import {
  BEHAVIOR_FUNCTIONS,
  BEHAVIOR_FUNCTION_LABELS_AR,
  FBA_ANTECEDENT_LABELS_AR,
  FBA_CONSEQUENCE_LABELS_AR,
  FBA_PLAN_ERRORS_AR,
  buildFbaPlan,
  summarizeFba,
  type FbaPlanError,
  type FbaPlanInput,
} from '@/lib/fba';
import type { BehaviorFunction } from '@/types/clinical';

const inputClass = 'w-full rounded-xl border px-3 py-2 text-sm';

/** خطة التقييم الوظيفي للسلوك: التعريف الإجرائي، الوظيفة المفترضة، السلوك البديل */
export default function FbaPlanDialog({
  goal,
  onSave,
  onCancel,
}: {
  goal: TrackedGoal;
  onSave: (input: FbaPlanInput) => Promise<FbaPlanError[] | null> | FbaPlanError[] | null;
  onCancel: () => void;
}) {
  const summary = summarizeFba(goal);
  const [targetBehavior, setTargetBehavior] = useState(goal.fbaPlan?.target_behavior ?? '');
  const [replacementBehavior, setReplacementBehavior] = useState(goal.fbaPlan?.replacement_behavior ?? '');
  const [fn, setFn] = useState<BehaviorFunction | ''>(
    goal.fbaPlan?.hypothesized_function ?? summary.suggestedFunction ?? ''
  );
  const [errors, setErrors] = useState<FbaPlanError[]>([]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const input: FbaPlanInput = { targetBehavior, replacementBehavior, hypothesizedFunction: fn || undefined };
    const local = buildFbaPlan(input, undefined);
    if (!local.ok) {
      setErrors(local.errors);
      return;
    }
    setSaving(true);
    const serverErrors = await onSave(input);
    setSaving(false);
    if (serverErrors) setErrors(serverErrors);
  };

  const topAntecedent = summary.antecedents[0];
  const topConsequence = summary.consequences[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-3xl bg-white p-6">
        <div>
          <h3 className="text-lg font-bold">التقييم الوظيفي للسلوك (FBA)</h3>
          <p className="mt-1 text-xs text-slate-500">{goal.title}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 text-xs leading-6 text-slate-700">
          <p>
            حوادث ABC المسجّلة: <strong>{summary.incidents}</strong> في {summary.sessionsWithAbc} جلسة
          </p>
          {topAntecedent ? (
            <p>
              أكثر مثير قبلي: {FBA_ANTECEDENT_LABELS_AR[topAntecedent.key]} ({topAntecedent.count})
            </p>
          ) : null}
          {topConsequence ? (
            <p>
              أكثر مثير بعدي: {FBA_CONSEQUENCE_LABELS_AR[topConsequence.key]} ({topConsequence.count})
            </p>
          ) : null}
          <p>
            {summary.suggestedFunction
              ? `الوظيفة المرجّحة وصفياً: ${BEHAVIOR_FUNCTION_LABELS_AR[summary.suggestedFunction]} (${Math.round(
                  summary.suggestedShare * 100
                )}% من المؤشرات)`
              : 'لا توجد وظيفة مرجّحة بعد (يلزم 5 حوادث على الأقل ونمط غالب).'}
          </p>
          <p className="text-slate-500">
            الترجيح وصفي من بيانات ABC وليس تحليلاً وظيفياً تجريبياً — القرار للأخصائي.
          </p>
        </div>

        <label className="block text-sm font-semibold">
          التعريف الإجرائي للسلوك المستهدف *
          <textarea
            className={`${inputClass} mt-1`}
            rows={2}
            placeholder="مثال: يرمي أدوات الطاولة على الأرض بيده"
            value={targetBehavior}
            onChange={(e) => setTargetBehavior(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold">
          الوظيفة المفترضة
          <select
            className={`${inputClass} mt-1`}
            value={fn}
            onChange={(e) => setFn(e.target.value as BehaviorFunction | '')}
          >
            <option value="">غير محددة بعد</option>
            {BEHAVIOR_FUNCTIONS.map((f) => (
              <option key={f} value={f}>
                {BEHAVIOR_FUNCTION_LABELS_AR[f]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          السلوك البديل التكيفي *
          <textarea
            className={`${inputClass} mt-1`}
            rows={2}
            placeholder="مثال: يطلب استراحة ببطاقة «استراحة»"
            value={replacementBehavior}
            onChange={(e) => setReplacementBehavior(e.target.value)}
          />
        </label>

        {errors.length ? (
          <ul className="list-disc space-y-1 pr-5 text-xs text-red-700">
            {errors.map((e) => (
              <li key={e}>{FBA_PLAN_ERRORS_AR[e]}</li>
            ))}
          </ul>
        ) : null}

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            حفظ الخطة
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}

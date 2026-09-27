'use client';

import {
  FBA_ANTECEDENTS,
  FBA_ANTECEDENT_LABELS_AR,
  FBA_CONSEQUENCES,
  FBA_CONSEQUENCE_LABELS_AR,
} from '@/lib/fba';
import type { FbaAntecedent, FbaConsequence } from '@/types/clinical';

export type AbcDraft = {
  antecedent: FbaAntecedent | '';
  consequence: FbaConsequence | '';
  behavior_note: string;
  duration_minutes: string;
  replacement_behavior_used: boolean;
};

export const emptyAbcDraft = (): AbcDraft => ({
  antecedent: '',
  consequence: '',
  behavior_note: '',
  duration_minutes: '',
  replacement_behavior_used: false,
});

/** يحوّل المسودات إلى مدخل الجلسة — الحقول الفارغة تُترك للتحقق على الخادم */
export function abcDraftsToInput(drafts: AbcDraft[]): unknown[] {
  return drafts.map((d) => ({
    antecedent: d.antecedent,
    consequence: d.consequence,
    behavior_note: d.behavior_note,
    replacement_behavior_used: d.replacement_behavior_used,
    ...(d.duration_minutes.trim() ? { duration_minutes: Number(d.duration_minutes) } : {}),
  }));
}

const selectClass = 'w-full rounded-xl border px-2 py-1.5 text-xs';

export default function AbcIncidentLogger({
  drafts,
  onChange,
  showDuration,
  replacementBehavior,
}: {
  drafts: AbcDraft[];
  onChange: (next: AbcDraft[]) => void;
  showDuration: boolean;
  replacementBehavior?: string;
}) {
  const update = (i: number, patch: Partial<AbcDraft>) =>
    onChange(drafts.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  return (
    <div className="space-y-2">
      {drafts.map((d, i) => (
        <div key={i} className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>حادثة {i + 1}</span>
            <button type="button" className="text-red-700" onClick={() => onChange(drafts.filter((_, j) => j !== i))}>
              حذف
            </button>
          </div>
          <label className="block text-xs">
            المثير القبلي (ماذا حدث قبل السلوك؟)
            <select
              className={selectClass}
              value={d.antecedent}
              onChange={(e) => update(i, { antecedent: e.target.value as FbaAntecedent })}
            >
              <option value="">—</option>
              {FBA_ANTECEDENTS.map((a) => (
                <option key={a} value={a}>
                  {FBA_ANTECEDENT_LABELS_AR[a]}
                </option>
              ))}
            </select>
          </label>
          <input
            className={selectClass}
            placeholder="وصف السلوك كما حدث (اختياري)"
            value={d.behavior_note}
            onChange={(e) => update(i, { behavior_note: e.target.value })}
          />
          <label className="block text-xs">
            المثير البعدي (ماذا حدث بعده مباشرة؟)
            <select
              className={selectClass}
              value={d.consequence}
              onChange={(e) => update(i, { consequence: e.target.value as FbaConsequence })}
            >
              <option value="">—</option>
              {FBA_CONSEQUENCES.map((c) => (
                <option key={c} value={c}>
                  {FBA_CONSEQUENCE_LABELS_AR[c]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {showDuration ? (
              <input
                className="w-24 rounded-xl border px-2 py-1.5"
                inputMode="decimal"
                placeholder="المدة (دقيقة)"
                value={d.duration_minutes}
                onChange={(e) => update(i, { duration_minutes: e.target.value })}
              />
            ) : null}
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={d.replacement_behavior_used}
                onChange={(e) => update(i, { replacement_behavior_used: e.target.checked })}
              />
              استخدم السلوك البديل{replacementBehavior ? ` (${replacementBehavior})` : ''}
            </label>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...drafts, emptyAbcDraft()])}
        className="rounded-xl border border-dashed px-3 py-1.5 text-xs font-semibold text-slate-700"
      >
        + أضف حادثة ABC
      </button>
    </div>
  );
}

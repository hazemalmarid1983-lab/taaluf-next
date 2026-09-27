'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { GeneralizationDimension, GeneralizationProbe } from '@/lib/generalizationIndex';
import {
  GENERALIZATION_PROBE_ERRORS_AR,
  PROBE_DIMENSION_LABELS_AR,
  PROBE_PERSON_LABELS_AR,
  PROBE_PROMPT_LABELS_AR,
  buildGeneralizationProbe,
  saveGeneralizationProbe,
  type GeneralizationProbeError,
  type GeneralizationProbeInput,
} from '@/lib/generalizationProbeStore';
import { SESSION_SETTING_LABELS_AR, type SessionSetting } from '@/lib/skillMastery';

const inputClass = 'w-full rounded-xl border px-3 py-2 text-sm';
const DIMENSIONS = Object.keys(PROBE_DIMENSION_LABELS_AR) as GeneralizationDimension[];
const PERSONS = Object.keys(PROBE_PERSON_LABELS_AR) as Array<
  NonNullable<GeneralizationProbe['details']['person_type']>
>;
const PROMPTS = Object.keys(PROBE_PROMPT_LABELS_AR) as GeneralizationProbe['prompt_level'][];
const SETTINGS = Object.keys(SESSION_SETTING_LABELS_AR) as SessionSetting[];

export default function GeneralizationProbeDialog({
  goalId,
  goalTitle,
  reportedBy,
  onSaved,
  onCancel,
}: {
  goalId: string;
  goalTitle: string;
  reportedBy: GeneralizationProbe['reported_by'];
  onSaved: (probes: GeneralizationProbe[], countsTowardIndex: boolean) => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState<GeneralizationProbeInput>({
    dimension: '',
    personType: reportedBy === 'parent_report' ? 'parent' : '',
    setting: '',
    promptLevel: '',
    isFirstTrialColdProbe: true,
  });
  const [errors, setErrors] = useState<GeneralizationProbeError[]>([]);
  const set = (patch: Partial<GeneralizationProbeInput>) =>
    setInput((prev) => ({ ...prev, ...patch }));

  const save = () => {
    const result = buildGeneralizationProbe(input, { goalId, reportedBy });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSaved(saveGeneralizationProbe(result.probe), result.countsTowardIndex);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-3xl bg-white p-6">
        <div>
          <h3 className="text-lg font-bold">قياس تعميم</h3>
          <p className="mt-1 text-xs text-slate-500">
            {goalTitle} · اختبر المهارة في ظرف واحد جديد لم يُدرَّب عليه الطفل
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {DIMENSIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => set({ dimension: d })}
              className={`rounded-xl border px-3 py-1.5 text-sm ${
                input.dimension === d ? 'border-[#2D8B5A] bg-emerald-50 font-bold' : ''
              }`}
            >
              {PROBE_DIMENSION_LABELS_AR[d]}
            </button>
          ))}
        </div>

        {input.dimension === 'person' ? (
          <div className="grid grid-cols-2 gap-2">
            <select
              className={inputClass}
              value={input.personType}
              onChange={(e) => set({ personType: e.target.value as GeneralizationProbeInput['personType'] })}
            >
              <option value="">من نفّذ القياس؟</option>
              {PERSONS.map((p) => (
                <option key={p} value={p}>
                  {PROBE_PERSON_LABELS_AR[p]}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              placeholder="الاسم (اختياري)"
              value={input.personName ?? ''}
              onChange={(e) => set({ personName: e.target.value })}
            />
          </div>
        ) : null}

        {input.dimension === 'place' ? (
          <select
            className={inputClass}
            value={input.setting}
            onChange={(e) => set({ setting: e.target.value as GeneralizationProbeInput['setting'] })}
          >
            <option value="">أين أُجري القياس؟</option>
            {SETTINGS.map((s) => (
              <option key={s} value={s}>
                {SESSION_SETTING_LABELS_AR[s]}
              </option>
            ))}
          </select>
        ) : null}

        {input.dimension === 'material_stimulus' ? (
          <div className="space-y-2">
            <input
              className={inputClass}
              placeholder="المادة أو المثير المستخدم (مثلاً: صورة حقيقية بدل البطاقة)"
              value={input.materialUsed ?? ''}
              onChange={(e) => set({ materialUsed: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={input.isNovelMaterial === true}
                onChange={(e) => set({ isNovelMaterial: e.target.checked })}
              />
              مادة جديدة لم تُستخدم في التدريب
            </label>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-semibold">
            الاستقلالية (%)
            <input
              className={`${inputClass} mt-1`}
              inputMode="numeric"
              value={String(input.independencePct ?? '')}
              onChange={(e) => set({ independencePct: e.target.value })}
            />
          </label>
          <label className="block text-sm font-semibold">
            مستوى المساعدة
            <select
              className={`${inputClass} mt-1`}
              value={input.promptLevel}
              onChange={(e) => set({ promptLevel: e.target.value as GeneralizationProbeInput['promptLevel'] })}
            >
              <option value="">—</option>
              {PROMPTS.map((p) => (
                <option key={p} value={p}>
                  {PROBE_PROMPT_LABELS_AR[p]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={input.isFirstTrialColdProbe === true}
            onChange={(e) => set({ isFirstTrialColdProbe: e.target.checked })}
          />
          أول محاولة دون تدريب مسبق في هذا الظرف
        </label>
        <textarea
          className={inputClass}
          rows={2}
          placeholder="ملاحظات"
          value={input.notes ?? ''}
          onChange={(e) => set({ notes: e.target.value })}
        />

        {errors.length ? (
          <ul className="list-disc space-y-1 pr-5 text-xs text-red-700">
            {errors.map((e) => (
              <li key={e}>{GENERALIZATION_PROBE_ERRORS_AR[e]}</li>
            ))}
          </ul>
        ) : null}

        <div className="flex gap-2">
          <Button onClick={save}>حفظ القياس</Button>
          <Button variant="ghost" onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}

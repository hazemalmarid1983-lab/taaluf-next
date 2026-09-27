'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { TrackedGoal } from '@/lib/goalsEngine';
import {
  MAINTENANCE_PASS_PCT,
  MAINTENANCE_PROBE_ERRORS_AR,
  recordMaintenanceProbe,
  type MaintenanceProbeError,
  type MaintenanceProbeResult,
} from '@/lib/maintenanceSchedule';
import { SESSION_SETTING_LABELS_AR, type SessionSetting } from '@/lib/skillMastery';

const SETTINGS = Object.keys(SESSION_SETTING_LABELS_AR) as SessionSetting[];
const inputClass = 'w-full rounded-xl border px-3 py-2 text-sm';

export default function MaintenanceProbeDialog({
  goal,
  defaultTrainerName,
  onSaved,
  onCancel,
}: {
  goal: TrackedGoal;
  defaultTrainerName?: string;
  onSaved: (result: Extract<MaintenanceProbeResult, { ok: true }>) => void;
  onCancel: () => void;
}) {
  const [independencePct, setIndependencePct] = useState('');
  const [trainerName, setTrainerName] = useState(defaultTrainerName ?? '');
  const [setting, setSetting] = useState<SessionSetting | ''>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<MaintenanceProbeError[]>([]);

  const save = () => {
    const result = recordMaintenanceProbe(goal, { independencePct, trainerName, setting, notes });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSaved(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="w-full max-w-md space-y-3 rounded-3xl bg-white p-6">
        <div>
          <h3 className="text-lg font-bold">مجس صيانة</h3>
          <p className="mt-1 text-xs text-slate-500">
            {goal.title} · قِس المهارة دون تدريب مسبق في الجلسة. النجاح عند {MAINTENANCE_PASS_PCT}% فأكثر.
          </p>
        </div>
        <label className="block text-sm font-semibold">
          نسبة المحاولات المستقلة (%)
          <input
            className={`${inputClass} mt-1`}
            inputMode="numeric"
            value={independencePct}
            onChange={(e) => setIndependencePct(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-semibold">
            من نفّذ المجس
            <input
              className={`${inputClass} mt-1`}
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold">
            البيئة
            <select
              className={`${inputClass} mt-1`}
              value={setting}
              onChange={(e) => setSetting(e.target.value as SessionSetting | '')}
            >
              <option value="">—</option>
              {SETTINGS.map((s) => (
                <option key={s} value={s}>
                  {SESSION_SETTING_LABELS_AR[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <textarea
          className={inputClass}
          rows={2}
          placeholder="ملاحظات"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {errors.length ? (
          <ul className="list-disc space-y-1 pr-5 text-xs text-red-700">
            {errors.map((e) => (
              <li key={e}>{MAINTENANCE_PROBE_ERRORS_AR[e]}</li>
            ))}
          </ul>
        ) : null}
        <div className="flex gap-2">
          <Button onClick={save}>حفظ</Button>
          <Button variant="ghost" onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}

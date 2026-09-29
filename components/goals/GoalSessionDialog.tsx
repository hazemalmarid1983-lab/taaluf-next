'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { FrequencyTarget, TrackedGoal } from '@/lib/goalsEngine';
import {
  GOAL_SESSION_FORM_ERRORS_AR,
  buildGoalSessionFromForm,
  goalSessionFormFields,
  type GoalSessionFormError,
  type GoalSessionFormInput,
} from '@/lib/goalSessionForm';
import {
  CLINICAL_PROMPT_LABELS_AR,
  CLINICAL_PROMPT_LEVELS,
  SESSION_SETTING_LABELS_AR,
  digitalStimulusSupportLabelAr,
  type ClinicalPromptLevel,
  type DigitalAssistanceCue,
  type SessionSetting,
} from '@/lib/skillMastery';
import { DIGITAL_ASSISTANCE_CUES, DIGITAL_STIMULUS_SUPPORT } from '@/types/clinical';
import AbcIncidentLogger, { abcDraftsToInput, type AbcDraft } from '@/components/goals/AbcIncidentLogger';
import TrialScoreInput from '@/components/goals/TrialScoreInput';

const MOODS = ['😊', '😐', '😟', '😢'] as const;
const SETTINGS = Object.keys(SESSION_SETTING_LABELS_AR) as SessionSetting[];

const inputClass = 'w-full rounded-xl border px-3 py-2 text-sm';

export default function GoalSessionDialog({
  goal,
  defaultTrainerName,
  onSaved,
  onCancel,
}: {
  goal: TrackedGoal;
  defaultTrainerName?: string;
  onSaved: (updated: TrackedGoal, input: GoalSessionFormInput) => void;
  onCancel: () => void;
}) {
  const fields = goalSessionFormFields(goal);
  const [mood, setMood] = useState<string>('😊');
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [independencePct, setIndependencePct] = useState('');
  const [firstTrialIndependent, setFirstTrialIndependent] = useState(false);
  const [naturalCueOnly, setNaturalCueOnly] = useState(false);
  const [promptLevel, setPromptLevel] = useState<ClinicalPromptLevel | ''>('');
  const [stimulusSupport, setStimulusSupport] = useState<DigitalAssistanceCue | ''>('');
  const [trainerName, setTrainerName] = useState(defaultTrainerName ?? '');
  const [setting, setSetting] = useState<SessionSetting | ''>('');
  const [behaviorValue, setBehaviorValue] = useState('');
  const [measure, setMeasure] = useState<FrequencyTarget['measure']>(
    goal.frequencyTarget?.measure ?? 'count'
  );
  const [direction, setDirection] = useState<FrequencyTarget['direction']>(
    goal.frequencyTarget?.direction ?? 'decrease'
  );
  const [target, setTarget] = useState(
    goal.frequencyTarget ? String(goal.frequencyTarget.target) : ''
  );
  const [abcDrafts, setAbcDrafts] = useState<AbcDraft[]>([]);
  const [replacementCount, setReplacementCount] = useState('');
  const [scoreEachTrial, setScoreEachTrial] = useState(false);
  const [trialScores, setTrialScores] = useState<ClinicalPromptLevel[]>([]);
  const [errors, setErrors] = useState<GoalSessionFormError[]>([]);
  const usingTrialScores = scoreEachTrial && trialScores.length > 0;
  const derivedPct = usingTrialScores
    ? Math.round((trialScores.filter((l) => l === 'Independent').length / trialScores.length) * 100)
    : undefined;

  const save = () => {
    const progress = Math.min(100, goal.current + (mood === '😊' ? 5 : mood === '😐' ? 2 : 0));
    const input: GoalSessionFormInput = {
      mood,
      activity,
      notes,
      progress,
      independencePct: usingTrialScores ? '' : independencePct,
      firstTrialIndependent,
      naturalCueOnly,
      promptLevel: usingTrialScores ? '' : promptLevel,
      stimulusSupport: usingTrialScores ? '' : stimulusSupport,
      trainerName,
      setting,
      behaviorValue,
      frequencyTarget: { measure, direction, target },
      ...(fields.frequencyMode
        ? { abcIncidents: abcDraftsToInput(abcDrafts), replacementBehaviorCount: replacementCount }
        : usingTrialScores
          ? { trialScores }
          : {}),
    };
    const result = buildGoalSessionFromForm(goal, input);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSaved({ ...result.goal, current: progress }, input);
  };

  const unit = measure === 'count' ? 'مرة' : 'دقيقة';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-3xl bg-white p-6">
        <div>
          <h3 className="text-lg font-bold">سجّل جلسة</h3>
          <p className="mt-1 text-xs text-slate-500">
            {goal.title} · {fields.config.label_ar}
          </p>
        </div>

        {fields.frequencyMode ? (
          <fieldset className="space-y-2 rounded-2xl bg-slate-50 p-3">
            <legend className="text-sm font-semibold">معيار الهدف</legend>
            <div className="grid grid-cols-2 gap-2">
              <select
                className={inputClass}
                value={measure}
                onChange={(e) => setMeasure(e.target.value as FrequencyTarget['measure'])}
              >
                <option value="count">عدد المرات</option>
                <option value="duration_minutes">المدة بالدقائق</option>
              </select>
              <select
                className={inputClass}
                value={direction}
                onChange={(e) => setDirection(e.target.value as FrequencyTarget['direction'])}
              >
                <option value="decrease">لا يزيد عن</option>
                <option value="increase">لا يقل عن</option>
              </select>
            </div>
            <input
              className={inputClass}
              inputMode="numeric"
              placeholder={`القيمة المستهدفة (${unit})`}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <label className="block text-sm font-semibold">
              {measure === 'count' ? 'عدد مرات السلوك في هذه الجلسة' : 'مدة السلوك في هذه الجلسة (دقائق)'}
              <input
                className={`${inputClass} mt-1`}
                inputMode="numeric"
                value={behaviorValue}
                onChange={(e) => setBehaviorValue(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              عدد مرات السلوك البديل التكيفي
              {goal.fbaPlan ? (
                <span className="font-normal text-slate-500"> ({goal.fbaPlan.replacement_behavior})</span>
              ) : null}
              <input
                className={`${inputClass} mt-1`}
                inputMode="numeric"
                placeholder="اختياري"
                value={replacementCount}
                onChange={(e) => setReplacementCount(e.target.value)}
              />
            </label>
            <div className="space-y-1 border-t pt-2">
              <p className="text-sm font-semibold">تحليل ABC (المثير القبلي ← السلوك ← المثير البعدي)</p>
              <p className="text-xs text-slate-500">
                كل حادثة تُحتسب من {measure === 'count' ? 'عدد المرات' : 'المدة'} المسجّل أعلاه ولا يجوز أن تتجاوزه.
              </p>
              <AbcIncidentLogger
                drafts={abcDrafts}
                onChange={setAbcDrafts}
                showDuration={measure === 'duration_minutes'}
                replacementBehavior={goal.fbaPlan?.replacement_behavior}
              />
            </div>
          </fieldset>
        ) : (
          <fieldset className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={scoreEachTrial}
                onChange={(e) => {
                  setScoreEachTrial(e.target.checked);
                  setTrialScores([]);
                }}
              />
              سجّل مستوى المساعدة لكل محاولة (يتيح اتفاق الملاحظين محاولةً بمحاولة)
            </label>
            {scoreEachTrial ? (
              <div className="rounded-2xl bg-slate-50 p-3">
                <TrialScoreInput value={trialScores} onChange={setTrialScores} />
                {derivedPct !== undefined ? (
                  <p className="mt-1 text-xs text-slate-700">
                    الاستقلالية المحسوبة: <strong>{derivedPct}%</strong>
                  </p>
                ) : null}
              </div>
            ) : null}
            {usingTrialScores ? null : (
              <label className="block text-sm font-semibold">
                نسبة المحاولات المستقلة (%)
                <input
                  className={`${inputClass} mt-1`}
                  inputMode="numeric"
                  placeholder="مثلاً 80"
                  value={independencePct}
                  onChange={(e) => setIndependencePct(e.target.value)}
                />
              </label>
            )}
            {usingTrialScores ? (
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                تسجيل كل محاولة يفترض مصفوفة مثيرات كاملة غير معدّلة. إذا عُدّلت المصفوفة رقمياً في أي محاولة
                فأدخل النسبة وأعلى دعم للمثير بدلاً من ذلك.
              </p>
            ) : (
              <>
                <label className="block text-sm font-semibold">
                  تلقين الاستجابة — أعلى تلقين بشري
                  <select
                    className={`${inputClass} mt-1`}
                    value={promptLevel}
                    onChange={(e) => setPromptLevel(e.target.value as ClinicalPromptLevel | '')}
                  >
                    <option value="">—</option>
                    {CLINICAL_PROMPT_LEVELS.map((p) => (
                      <option key={p} value={p}>
                        {CLINICAL_PROMPT_LABELS_AR[p]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold">
                    دعم مصفوفة المثيرات — أعلى تعديل رقمي
                    <select
                      className={`${inputClass} mt-1`}
                      value={stimulusSupport}
                      onChange={(e) => setStimulusSupport(e.target.value as DigitalAssistanceCue | '')}
                    >
                      <option value="">مصفوفة كاملة غير معدّلة</option>
                      {DIGITAL_ASSISTANCE_CUES.map((cue) => (
                        <option key={cue} value={cue}>
                          {digitalStimulusSupportLabelAr(cue)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="rounded-xl bg-blue-50/70 px-3 py-2 text-xs leading-5 text-slate-700">
                    {stimulusSupport ? `${DIGITAL_STIMULUS_SUPPORT[stimulusSupport].on_screen_ar}. ` : null}
                    بُعد مستقل عن تلقين الاستجابة: محاولات المصفوفة المخفّضة أو المُبرزة لا تُحتسب مستقلة للإتقان.
                  </p>
                </div>
              </>
            )}
            {fields.askFirstTrial && !usingTrialScores ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={firstTrialIndependent}
                  onChange={(e) => setFirstTrialIndependent(e.target.checked)}
                />
                المحاولة الأولى أُدّيت باستقلال وعلى مصفوفة كاملة غير معدّلة (دون تلقين أو دعم للمثير)
              </label>
            ) : null}
            {fields.askNaturalCue ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={naturalCueOnly}
                  onChange={(e) => setNaturalCueOnly(e.target.checked)}
                />
                استجاب للموقف الطبيعي دون توجيه من المدرّب
              </label>
            ) : null}
          </fieldset>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-semibold">
            من نفّذ الجلسة{fields.trainerRequired ? ' *' : ''}
            <input
              className={`${inputClass} mt-1`}
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold">
            البيئة{fields.settingRequired ? ' *' : ''}
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

        <div className="flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              className={
                mood === m
                  ? 'rounded-xl bg-emerald-50 px-3 py-2 text-xl ring-2 ring-[#2D8B5A]'
                  : 'rounded-xl px-3 py-2 text-xl'
              }
            >
              {m}
            </button>
          ))}
        </div>
        <input
          className={inputClass}
          placeholder="النشاط"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
        />
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
              <li key={e}>{GOAL_SESSION_FORM_ERRORS_AR[e]}</li>
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

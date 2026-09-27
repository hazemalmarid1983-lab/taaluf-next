/**
 * نموذج تسجيل جلسة هدف: يجمع ما تحتاجه شروط الإتقان حسب نوع المهارة
 * (نسبة الاستقلالية، المحاولة الأولى، المدرّب، البيئة، التكرار/المدة).
 */

import type { FrequencyTarget, GoalSession, TrackedGoal } from '@/lib/goalsEngine';
import {
  skillConfigForGoal,
  type SessionSetting,
  type SkillTypeConfig,
} from '@/lib/skillMastery';

export type GoalSessionFormInput = {
  mood?: string;
  activity?: string;
  notes?: string;
  progress?: number;
  independencePct?: number | string;
  firstTrialIndependent?: boolean;
  naturalCueOnly?: boolean;
  trainerName?: string;
  setting?: SessionSetting | '';
  behaviorValue?: number | string;
  frequencyTarget?: Partial<Omit<FrequencyTarget, 'target'>> & { target?: number | string };
};

export type GoalSessionFormError =
  | 'INDEPENDENCE_REQUIRED'
  | 'TRAINER_REQUIRED'
  | 'SETTING_REQUIRED'
  | 'FREQUENCY_TARGET_REQUIRED'
  | 'BEHAVIOR_VALUE_REQUIRED';

export const GOAL_SESSION_FORM_ERRORS_AR: Record<GoalSessionFormError, string> = {
  INDEPENDENCE_REQUIRED: 'أدخل نسبة الاستقلالية بين 0 و100',
  TRAINER_REQUIRED: 'أدخل اسم من نفّذ الجلسة — يلزم تنوّع المدرّبين لإتقان هذا الهدف',
  SETTING_REQUIRED: 'اختر بيئة الجلسة — يلزم تنوّع البيئات لإتقان هذا الهدف',
  FREQUENCY_TARGET_REQUIRED: 'حدّد معيار الهدف (المقياس والاتجاه والقيمة) مرة واحدة',
  BEHAVIOR_VALUE_REQUIRED: 'أدخل عدد مرات السلوك أو مدته في هذه الجلسة',
};

export type GoalSessionFormFields = {
  config: SkillTypeConfig;
  frequencyMode: boolean;
  askFirstTrial: boolean;
  askNaturalCue: boolean;
  trainerRequired: boolean;
  settingRequired: boolean;
};

/** الحقول التي يعرضها النموذج لهذا الهدف */
export function goalSessionFormFields(
  goal: Pick<TrackedGoal, 'criterionId' | 'developmentalDomain'>
): GoalSessionFormFields {
  const config = skillConfigForGoal(goal);
  return {
    config,
    frequencyMode: config.measurement_mode === 'frequency_duration',
    askFirstTrial: config.require_cold_probe_first_trial,
    askNaturalCue: Boolean(config.allow_natural_cue_as_independent),
    trainerRequired: config.require_multiple_trainers,
    settingRequired: config.require_multiple_settings,
  };
}

/** معرّف ثابت للمدرّب من الاسم المُدخل (يُطابق «أ. سارة» و«أ.  سارة ») */
export function normalizeTrainerId(name: string | undefined): string | undefined {
  const id = (name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  return id || undefined;
}

function toNumber(value: number | string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : undefined;
}

export function meetsFrequencyTarget(target: FrequencyTarget, value: number): boolean {
  return target.direction === 'decrease' ? value <= target.target : value >= target.target;
}

function resolveFrequencyTarget(
  existing: FrequencyTarget | undefined,
  input: GoalSessionFormInput['frequencyTarget']
): FrequencyTarget | undefined {
  const target = toNumber(input?.target);
  if (input?.measure && input.direction && target !== undefined && target >= 0) {
    return { measure: input.measure, direction: input.direction, target };
  }
  return existing;
}

export type GoalSessionFormResult =
  | { ok: true; session: GoalSession; goal: TrackedGoal }
  | { ok: false; errors: GoalSessionFormError[] };

export function buildGoalSessionFromForm(
  goal: TrackedGoal,
  input: GoalSessionFormInput,
  now: Date = new Date()
): GoalSessionFormResult {
  const fields = goalSessionFormFields(goal);
  const errors: GoalSessionFormError[] = [];

  const trainerId = normalizeTrainerId(input.trainerName);
  const setting = input.setting || undefined;
  if (fields.trainerRequired && !trainerId) errors.push('TRAINER_REQUIRED');
  if (fields.settingRequired && !setting) errors.push('SETTING_REQUIRED');

  const base: GoalSession = {
    at: now.toISOString(),
    mood: input.mood,
    activity: input.activity?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    progress: input.progress,
    trainerId,
    setting,
  };

  let session: GoalSession;
  let frequencyTarget = goal.frequencyTarget;

  if (fields.frequencyMode) {
    frequencyTarget = resolveFrequencyTarget(goal.frequencyTarget, input.frequencyTarget);
    const value = toNumber(input.behaviorValue);
    if (!frequencyTarget) errors.push('FREQUENCY_TARGET_REQUIRED');
    if (value === undefined || value < 0) errors.push('BEHAVIOR_VALUE_REQUIRED');
    if (errors.length) return { ok: false, errors };
    session = {
      ...base,
      metFrequencyCriterion: meetsFrequencyTarget(frequencyTarget!, value!),
      ...(frequencyTarget!.measure === 'count'
        ? { behaviorCount: value }
        : { behaviorDurationMinutes: value }),
    };
  } else {
    const pct = toNumber(input.independencePct);
    if (pct === undefined || pct < 0 || pct > 100) errors.push('INDEPENDENCE_REQUIRED');
    if (errors.length) return { ok: false, errors };
    session = {
      ...base,
      independencePct: Math.round(pct!),
      fullyIndependent: pct === 100,
      firstTrialIndependent: fields.askFirstTrial ? input.firstTrialIndependent === true : undefined,
      naturalCueOnly: fields.askNaturalCue ? input.naturalCueOnly === true : undefined,
    };
  }

  return {
    ok: true,
    session,
    goal: {
      ...goal,
      frequencyTarget,
      lastUpdate: session.at,
      sessions: [...(goal.sessions || []), session],
    },
  };
}

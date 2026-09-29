/**
 * نموذج تسجيل جلسة هدف: يجمع ما تحتاجه شروط الإتقان حسب نوع المهارة
 * (نسبة الاستقلالية، المحاولة الأولى، المدرّب، البيئة، التكرار/المدة).
 */

import type { FrequencyTarget, GoalSession, TrackedGoal } from '@/lib/goalsEngine';
import {
  isDigitalAssistanceCue,
  isValidIndependentTrial,
  mostIntrusivePromptLevel,
  mostIntrusiveStimulusSupport,
  skillConfigForGoal,
  toClinicalPromptLevel,
  type ClinicalPromptLevel,
  type DigitalAssistanceCue,
  type SessionSetting,
  type SkillTypeConfig,
} from '@/lib/skillMastery';
import { FBA_PLAN_ERRORS_AR, validateAbcIncidents, type AbcValidationError } from '@/lib/fba';

export type GoalSessionFormInput = {
  mood?: string;
  activity?: string;
  notes?: string;
  progress?: number;
  independencePct?: number | string;
  firstTrialIndependent?: boolean;
  naturalCueOnly?: boolean;
  /** بُعد الاستجابة: أعلى تلقين بشري */
  promptLevel?: ClinicalPromptLevel | '';
  /** بُعد المثير: أكثر تعديل رقمي للمصفوفة — مستقل عن promptLevel */
  stimulusSupport?: DigitalAssistanceCue | '';
  trainerName?: string;
  setting?: SessionSetting | '';
  behaviorValue?: number | string;
  frequencyTarget?: Partial<Omit<FrequencyTarget, 'target'>> & { target?: number | string };
  /** حوادث ABC — أهداف التكرار/المدة فقط */
  abcIncidents?: unknown[];
  replacementBehaviorCount?: number | string;
  /** بُعد الاستجابة لكل محاولة (اختياري) — يتيح اتفاق الملاحظين محاولةً بمحاولة */
  trialScores?: unknown[];
  /** بُعد المثير لكل محاولة بطول trialScores: مساعدة رقمية أو null للمصفوفة الكاملة */
  trialStimulus?: unknown[];
};

export type GoalSessionFormError =
  | 'INDEPENDENCE_REQUIRED'
  | 'TRAINER_REQUIRED'
  | 'SETTING_REQUIRED'
  | 'FREQUENCY_TARGET_REQUIRED'
  | 'BEHAVIOR_VALUE_REQUIRED'
  | 'PROMPT_LEVEL_CONFLICT'
  | 'STIMULUS_SUPPORT_NOT_A_RESPONSE_PROMPT'
  | 'STIMULUS_SUPPORT_CONFLICT'
  | AbcValidationError
  | 'INVALID_TRIAL_SCORES'
  | 'INVALID_TRIAL_STIMULUS'
  | 'TRIAL_SCORES_MISMATCH';

export const MAX_TRIAL_SCORES = 100;

/** مستويات الاستجابة للمحاولات بالترتيب — null إذا كان أي مستوى غير معروف أو مساعدة رقمية */
export function parseTrialScores(raw: unknown): ClinicalPromptLevel[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_TRIAL_SCORES) return null;
  const levels = raw.map((v) => toClinicalPromptLevel(typeof v === 'string' ? v : undefined));
  return levels.every(Boolean) ? (levels as ClinicalPromptLevel[]) : null;
}

/** دعم المثير لكل محاولة بطول expectedLength — null إذا كانت قيمة غير معروفة أو الطول مختلفاً */
export function parseTrialStimulus(
  raw: unknown,
  expectedLength: number
): Array<DigitalAssistanceCue | null> | null {
  if (!Array.isArray(raw) || raw.length !== expectedLength) return null;
  const out: Array<DigitalAssistanceCue | null> = [];
  for (const v of raw) {
    if (v === null || v === undefined || v === '' || v === 'full_array') out.push(null);
    else if (isDigitalAssistanceCue(v)) out.push(v);
    else return null;
  }
  return out;
}

export const GOAL_SESSION_FORM_ERRORS_AR: Record<GoalSessionFormError, string> = {
  INDEPENDENCE_REQUIRED: 'أدخل نسبة الاستقلالية بين 0 و100',
  TRAINER_REQUIRED: 'أدخل اسم من نفّذ الجلسة — يلزم تنوّع المدرّبين لإتقان هذا الهدف',
  SETTING_REQUIRED: 'اختر بيئة الجلسة — يلزم تنوّع البيئات لإتقان هذا الهدف',
  FREQUENCY_TARGET_REQUIRED: 'حدّد معيار الهدف (المقياس والاتجاه والقيمة) مرة واحدة',
  BEHAVIOR_VALUE_REQUIRED: 'أدخل عدد مرات السلوك أو مدته في هذه الجلسة',
  PROMPT_LEVEL_CONFLICT:
    'مستوى التلقين لا يطابق النسبة: 100% تعني «مستقل» على مصفوفة كاملة، و«مستقل» على مصفوفة كاملة يعني 100%',
  STIMULUS_SUPPORT_NOT_A_RESPONSE_PROMPT:
    'المساعدة الرقمية (إبراز أو تقليل الخيارات) تُسجَّل في «دعم مصفوفة المثيرات» لا كمستوى تلقين استجابة',
  STIMULUS_SUPPORT_CONFLICT:
    'لا تكون الاستقلالية 100% مع مصفوفة مخفّضة أو مُبرزة — محاولات دعم المثير لا تُحتسب مستقلة للإتقان',
  INVALID_ABC_INCIDENT: FBA_PLAN_ERRORS_AR.INVALID_ABC_INCIDENT,
  ABC_EXCEEDS_BEHAVIOR_COUNT: FBA_PLAN_ERRORS_AR.ABC_EXCEEDS_BEHAVIOR_COUNT,
  ABC_EXCEEDS_DURATION: FBA_PLAN_ERRORS_AR.ABC_EXCEEDS_DURATION,
  INVALID_TRIAL_SCORES: 'سجل المحاولات يحتوي مستوى تلقين غير معروف',
  INVALID_TRIAL_STIMULUS: 'سجل دعم المثير يجب أن يغطي كل المحاولات بقيم معروفة',
  TRIAL_SCORES_MISMATCH:
    'النسبة أو أعلى تلقين أو أعلى دعم للمثير لا يطابق سجل المحاولات (المستقلة على مصفوفة كاملة ÷ عدد المحاولات)',
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
    const measure =
      frequencyTarget!.measure === 'count' ? { behaviorCount: value } : { behaviorDurationMinutes: value };
    const abc = validateAbcIncidents(input.abcIncidents, measure);
    if (!abc.ok) return { ok: false, errors: [abc.error] };
    const replacement = toNumber(input.replacementBehaviorCount);
    session = {
      ...base,
      metFrequencyCriterion: meetsFrequencyTarget(frequencyTarget!, value!),
      ...measure,
      abcIncidents: abc.incidents.length ? abc.incidents : undefined,
      replacementBehaviorCount: replacement !== undefined && replacement >= 0 ? Math.round(replacement) : undefined,
    };
  } else {
    if (isDigitalAssistanceCue(input.promptLevel)) {
      return { ok: false, errors: ['STIMULUS_SUPPORT_NOT_A_RESPONSE_PROMPT'] };
    }
    let trialScores: ClinicalPromptLevel[] | undefined;
    let trialStimulus: Array<DigitalAssistanceCue | null> | undefined;
    if (Array.isArray(input.trialScores) && input.trialScores.length) {
      const parsed = parseTrialScores(input.trialScores);
      if (!parsed) {
        return {
          ok: false,
          errors: [
            input.trialScores.some(isDigitalAssistanceCue)
              ? 'STIMULUS_SUPPORT_NOT_A_RESPONSE_PROMPT'
              : 'INVALID_TRIAL_SCORES',
          ],
        };
      }
      trialScores = parsed;
      if (Array.isArray(input.trialStimulus)) {
        const stimulus = parseTrialStimulus(input.trialStimulus, parsed.length);
        if (!stimulus) return { ok: false, errors: ['INVALID_TRIAL_STIMULUS'] };
        trialStimulus = stimulus.some(Boolean) ? stimulus : undefined;
      }
    } else if (Array.isArray(input.trialStimulus) && input.trialStimulus.length) {
      return { ok: false, errors: ['INVALID_TRIAL_STIMULUS'] };
    }
    const derivedPct = trialScores
      ? Math.round(
          (trialScores.filter((l, i) => isValidIndependentTrial(l, trialStimulus?.[i])).length /
            trialScores.length) *
            100
        )
      : undefined;
    const pct = toNumber(input.independencePct) ?? derivedPct;
    if (pct === undefined || pct < 0 || pct > 100) errors.push('INDEPENDENCE_REQUIRED');
    const enteredLevel = toClinicalPromptLevel(input.promptLevel || undefined);
    const enteredStimulus = isDigitalAssistanceCue(input.stimulusSupport) ? input.stimulusSupport : undefined;
    const trialsLevel = trialScores ? mostIntrusivePromptLevel(trialScores) : undefined;
    const trialsStimulus = trialStimulus ? mostIntrusiveStimulusSupport(trialStimulus) : undefined;
    if (
      trialScores &&
      ((pct !== undefined && Math.round(pct) !== derivedPct) ||
        (enteredLevel !== undefined && enteredLevel !== trialsLevel) ||
        (enteredStimulus !== undefined && enteredStimulus !== trialsStimulus))
    ) {
      errors.push('TRIAL_SCORES_MISMATCH');
    }
    const stimulusSupport = enteredStimulus ?? trialsStimulus;
    const promptLevel = enteredLevel ?? trialsLevel ?? (pct === 100 ? 'Independent' : undefined);
    if (pct === 100 && stimulusSupport) {
      errors.push('STIMULUS_SUPPORT_CONFLICT');
    } else if (
      pct !== undefined &&
      promptLevel &&
      isValidIndependentTrial(promptLevel, stimulusSupport) !== (pct === 100)
    ) {
      errors.push('PROMPT_LEVEL_CONFLICT');
    }
    if (errors.length) return { ok: false, errors };
    session = {
      ...base,
      independencePct: Math.round(pct!),
      fullyIndependent: pct === 100,
      promptLevel,
      stimulusSupport,
      firstTrialIndependent: fields.askFirstTrial
        ? trialScores
          ? isValidIndependentTrial(trialScores[0], trialStimulus?.[0])
          : input.firstTrialIndependent === true
        : undefined,
      naturalCueOnly: fields.askNaturalCue ? input.naturalCueOnly === true : undefined,
      trialScores,
      trialStimulus,
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

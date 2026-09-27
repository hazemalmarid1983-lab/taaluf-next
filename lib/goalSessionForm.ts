/**
 * نموذج تسجيل جلسة هدف: يجمع ما تحتاجه شروط الإتقان حسب نوع المهارة
 * (نسبة الاستقلالية، المحاولة الأولى، المدرّب، البيئة، التكرار/المدة).
 */

import type { FrequencyTarget, GoalSession, TrackedGoal } from '@/lib/goalsEngine';
import {
  isDigitalAssistanceCue,
  mostIntrusivePromptLevel,
  skillConfigForGoal,
  toClinicalPromptLevel,
  type ClinicalPromptLevel,
  type DigitalAssistanceCue,
  type SessionSetting,
  type SkillTypeConfig,
} from '@/lib/skillMastery';
import { FBA_PLAN_ERRORS_AR, validateAbcIncidents, type AbcValidationError } from '@/lib/fba';
import { DIGITAL_PROMPT_MAPPING } from '@/types/clinical';

export type GoalSessionFormInput = {
  mood?: string;
  activity?: string;
  notes?: string;
  progress?: number;
  independencePct?: number | string;
  firstTrialIndependent?: boolean;
  naturalCueOnly?: boolean;
  promptLevel?: ClinicalPromptLevel | '';
  /** أعلى مساعدة جاءت من أداة/لعبة رقمية — يُشتق منها promptLevel */
  digitalPromptCue?: DigitalAssistanceCue | '';
  trainerName?: string;
  setting?: SessionSetting | '';
  behaviorValue?: number | string;
  frequencyTarget?: Partial<Omit<FrequencyTarget, 'target'>> & { target?: number | string };
  /** حوادث ABC — أهداف التكرار/المدة فقط */
  abcIncidents?: unknown[];
  replacementBehaviorCount?: number | string;
  /** مستوى المساعدة لكل محاولة (اختياري) — يتيح اتفاق الملاحظين محاولةً بمحاولة */
  trialScores?: unknown[];
};

export type GoalSessionFormError =
  | 'INDEPENDENCE_REQUIRED'
  | 'TRAINER_REQUIRED'
  | 'SETTING_REQUIRED'
  | 'FREQUENCY_TARGET_REQUIRED'
  | 'BEHAVIOR_VALUE_REQUIRED'
  | 'PROMPT_LEVEL_CONFLICT'
  | 'DIGITAL_PROMPT_MAPPING_CONFLICT'
  | AbcValidationError
  | 'INVALID_TRIAL_SCORES'
  | 'TRIAL_SCORES_MISMATCH';

export const MAX_TRIAL_SCORES = 100;

/** مستويات المحاولات بالترتيب — null إذا كان أي مستوى غير معروف */
export function parseTrialScores(raw: unknown): ClinicalPromptLevel[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_TRIAL_SCORES) return null;
  const levels = raw.map((v) => toClinicalPromptLevel(typeof v === 'string' ? v : undefined));
  return levels.every(Boolean) ? (levels as ClinicalPromptLevel[]) : null;
}

export const GOAL_SESSION_FORM_ERRORS_AR: Record<GoalSessionFormError, string> = {
  INDEPENDENCE_REQUIRED: 'أدخل نسبة الاستقلالية بين 0 و100',
  TRAINER_REQUIRED: 'أدخل اسم من نفّذ الجلسة — يلزم تنوّع المدرّبين لإتقان هذا الهدف',
  SETTING_REQUIRED: 'اختر بيئة الجلسة — يلزم تنوّع البيئات لإتقان هذا الهدف',
  FREQUENCY_TARGET_REQUIRED: 'حدّد معيار الهدف (المقياس والاتجاه والقيمة) مرة واحدة',
  BEHAVIOR_VALUE_REQUIRED: 'أدخل عدد مرات السلوك أو مدته في هذه الجلسة',
  PROMPT_LEVEL_CONFLICT: 'مستوى المساعدة لا يطابق النسبة: «مستقل» يعني 100% والعكس',
  DIGITAL_PROMPT_MAPPING_CONFLICT:
    'المساعدة الرقمية تحدد المستوى تلقائياً: التلميح البصري وتقليل الخيارات = إشارة، والمساعدة البصرية المباشرة = نموذج',
  INVALID_ABC_INCIDENT: FBA_PLAN_ERRORS_AR.INVALID_ABC_INCIDENT,
  ABC_EXCEEDS_BEHAVIOR_COUNT: FBA_PLAN_ERRORS_AR.ABC_EXCEEDS_BEHAVIOR_COUNT,
  ABC_EXCEEDS_DURATION: FBA_PLAN_ERRORS_AR.ABC_EXCEEDS_DURATION,
  INVALID_TRIAL_SCORES: 'سجل المحاولات يحتوي مستوى مساعدة غير معروف',
  TRIAL_SCORES_MISMATCH:
    'نسبة الاستقلالية أو أعلى مستوى مساعدة لا يطابق سجل المحاولات (المستقلة ÷ عدد المحاولات، وأعلى مساعدة بين المحاولات)',
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
    let trialScores: ClinicalPromptLevel[] | undefined;
    if (Array.isArray(input.trialScores) && input.trialScores.length) {
      const parsed = parseTrialScores(input.trialScores);
      if (!parsed) return { ok: false, errors: ['INVALID_TRIAL_SCORES'] };
      trialScores = parsed;
    }
    const derivedPct = trialScores
      ? Math.round((trialScores.filter((l) => l === 'Independent').length / trialScores.length) * 100)
      : undefined;
    const pct = toNumber(input.independencePct) ?? derivedPct;
    if (pct === undefined || pct < 0 || pct > 100) errors.push('INDEPENDENCE_REQUIRED');
    const digitalPromptCue = isDigitalAssistanceCue(input.digitalPromptCue) ? input.digitalPromptCue : undefined;
    const enteredLevel = toClinicalPromptLevel(input.promptLevel || undefined);
    const mappedLevel = digitalPromptCue ? DIGITAL_PROMPT_MAPPING[digitalPromptCue].clinical_level : undefined;
    if (mappedLevel && enteredLevel && enteredLevel !== mappedLevel) {
      errors.push('DIGITAL_PROMPT_MAPPING_CONFLICT');
    }
    const trialsLevel = trialScores ? mostIntrusivePromptLevel(trialScores) : undefined;
    if (
      trialScores &&
      ((pct !== undefined && Math.round(pct) !== derivedPct) ||
        ((mappedLevel ?? enteredLevel) !== undefined && (mappedLevel ?? enteredLevel) !== trialsLevel))
    ) {
      errors.push('TRIAL_SCORES_MISMATCH');
    }
    const promptLevel = mappedLevel ?? enteredLevel ?? trialsLevel ?? (pct === 100 ? 'Independent' : undefined);
    if (pct !== undefined && promptLevel && (promptLevel === 'Independent') !== (pct === 100)) {
      errors.push('PROMPT_LEVEL_CONFLICT');
    }
    if (errors.length) return { ok: false, errors };
    const promptSource: GoalSession['promptSource'] = digitalPromptCue
      ? 'digital_assistance'
      : enteredLevel && enteredLevel !== 'Independent' && enteredLevel !== 'No Response'
        ? 'human'
        : undefined;
    session = {
      ...base,
      independencePct: Math.round(pct!),
      fullyIndependent: pct === 100,
      promptLevel,
      promptSource,
      digitalPromptCue,
      firstTrialIndependent: fields.askFirstTrial
        ? trialScores
          ? trialScores[0] === 'Independent'
          : input.firstTrialIndependent === true
        : undefined,
      naturalCueOnly: fields.askNaturalCue ? input.naturalCueOnly === true : undefined,
      trialScores,
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

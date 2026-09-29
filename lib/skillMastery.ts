/**
 * إتقان الأهداف حسب نوع المهارة (CLINICAL_RULES).
 * لكل نوع عتبة وعدد جلسات متتالية وشروط تعميم خاصة به.
 * القيم الافتراضية أدناه مقترح تربوي — تحتاج مراجعة علمية قبل الاعتماد النهائي.
 */

import type { GoalSession, TrackedGoal } from '@/lib/goalsEngine';
import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';
import {
  DIGITAL_ASSISTANCE_CUES,
  DIGITAL_STIMULUS_SUPPORT,
  STIMULUS_ARRAY_LABELS_AR,
  type ClinicalPromptLevel,
  type DigitalAssistanceCue,
  type SkillCategoryId,
  type SkillTypeConfig,
  type StimulusArrayLevel,
} from '@/types/clinical';
import { getCriterionById, type DevelopmentalDomainId } from '@/types/taalof';

export type { ClinicalPromptLevel, DigitalAssistanceCue, SkillCategoryId, SkillTypeConfig, StimulusArrayLevel };

export type SessionPromptLevel = ClinicalPromptLevel;

/** من الأقل إلى الأكثر تدخلاً — نفس ترتيب PROMPT_HIERARCHY_ORDER */
export const CLINICAL_PROMPT_LEVELS: readonly ClinicalPromptLevel[] = [
  'Independent',
  'Partial Verbal',
  'Verbal',
  'Gestural',
  'Model',
  'Partial Physical',
  'Full Physical',
  'No Response',
];

export const CLINICAL_PROMPT_BY_HIERARCHY: Record<PromptHierarchyLevel, ClinicalPromptLevel> = {
  independent: 'Independent',
  verbal_partial: 'Partial Verbal',
  verbal: 'Verbal',
  gestural: 'Gestural',
  model: 'Model',
  partial_physical: 'Partial Physical',
  full_physical: 'Full Physical',
  no_response: 'No Response',
};

export const CLINICAL_PROMPT_LABELS_AR: Record<ClinicalPromptLevel, string> = {
  Independent: 'مستقل',
  'Partial Verbal': 'تلقين لفظي جزئي',
  Verbal: 'تلقين لفظي',
  Gestural: 'تلقين بالإشارة',
  Model: 'نموذج',
  'Partial Physical': 'مساعدة جسدية جزئية',
  'Full Physical': 'مساعدة جسدية كاملة',
  'No Response': 'لا استجابة',
};

/** مستويات الجلسات القديمة */
const LEGACY_PROMPT_ALIASES: Record<string, ClinicalPromptLevel> = {
  verbal_gestural: 'Gestural',
  physical_prompt: 'Full Physical',
};

export function isDigitalAssistanceCue(value: unknown): value is DigitalAssistanceCue {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(DIGITAL_STIMULUS_SUPPORT, value);
}

/**
 * يطابق مستوى تلقين بشري أو قديم مع المقياس الموحّد.
 * المساعدات الرقمية ليست تلقين استجابة فتُعاد undefined — استخدم trialResponsePromptLevel للمحاولة.
 */
export function toClinicalPromptLevel(level: string | undefined | null): ClinicalPromptLevel | undefined {
  if (!level || isDigitalAssistanceCue(level)) return undefined;
  if ((CLINICAL_PROMPT_LEVELS as readonly string[]).includes(level)) {
    return level as ClinicalPromptLevel;
  }
  return CLINICAL_PROMPT_BY_HIERARCHY[level as PromptHierarchyLevel] ?? LEGACY_PROMPT_ALIASES[level];
}

/** بُعد الاستجابة لمحاولة مسجّلة: المساعدة الرقمية وحدها لا تمثّل تلقيناً بشرياً ← «مستقل» */
export function trialResponsePromptLevel(level: string | undefined | null): ClinicalPromptLevel | undefined {
  return isDigitalAssistanceCue(level) ? 'Independent' : toClinicalPromptLevel(level);
}

/** بُعد المثير لمحاولة مسجّلة: المساعدة الرقمية التي عدّلت المصفوفة، أو undefined للمصفوفة الكاملة غير المعدّلة */
export function trialStimulusSupport(level: string | undefined | null): DigitalAssistanceCue | undefined {
  return isDigitalAssistanceCue(level) ? level : undefined;
}

export function stimulusArrayLevelOf(cue: DigitalAssistanceCue | undefined | null): StimulusArrayLevel {
  return cue ? DIGITAL_STIMULUS_SUPPORT[cue].array_level : 'full_array';
}

/** أكثر تعديل للمصفوفة تدخلاً بين المحاولات */
export function mostIntrusiveStimulusSupport(
  cues: ReadonlyArray<string | undefined | null>
): DigitalAssistanceCue | undefined {
  let worst = -1;
  for (const cue of cues) {
    if (isDigitalAssistanceCue(cue)) worst = Math.max(worst, DIGITAL_ASSISTANCE_CUES.indexOf(cue));
  }
  return worst >= 0 ? DIGITAL_ASSISTANCE_CUES[worst] : undefined;
}

/** المحاولة صالحة للإتقان: استجابة مستقلة ومصفوفة كاملة غير معدّلة */
export function isValidIndependentTrial(
  responseLevel: ClinicalPromptLevel | undefined,
  stimulusSupport: DigitalAssistanceCue | undefined | null
): boolean {
  return responseLevel === 'Independent' && !stimulusSupport;
}

export type SessionPromptEvidence = {
  /** بُعد الاستجابة: أعلى تلقين بشري */
  promptLevel?: ClinicalPromptLevel;
  /** بُعد المثير: أكثر تعديل رقمي للمصفوفة — غائب = مصفوفة كاملة غير معدّلة */
  stimulusSupport?: DigitalAssistanceCue;
};

/** مستوى الجلسة على البُعدين من محاولاتها المسجّلة */
export function resolveSessionPromptEvidence(levels: ReadonlyArray<string | undefined>): SessionPromptEvidence {
  const promptLevel = mostIntrusivePromptLevel(levels.map((l) => trialResponsePromptLevel(l)));
  const stimulusSupport = mostIntrusiveStimulusSupport(levels);
  return stimulusSupport ? { promptLevel, stimulusSupport } : { promptLevel };
}

/** «مصفوفة المثيرات: مخفّضة جزئياً» مع الإبراز إن وُجد */
export function stimulusSupportLabelAr(cue: DigitalAssistanceCue | undefined | null): string {
  const level = stimulusArrayLevelOf(cue);
  const highlighted = cue ? DIGITAL_STIMULUS_SUPPORT[cue].target_highlighted : false;
  return `مصفوفة المثيرات: ${STIMULUS_ARRAY_LABELS_AR[level]}${highlighted ? ' مع إبراز الهدف' : ''}`;
}

/** «تقليل الخيارات (رقمي) ← مصفوفة المثيرات: مخفّضة جزئياً» */
export function digitalStimulusSupportLabelAr(cue: DigitalAssistanceCue): string {
  return `${DIGITAL_STIMULUS_SUPPORT[cue].cue_label_ar} (رقمي) ← ${stimulusSupportLabelAr(cue)}`;
}

/** تصنيف كل المساعدات الرقمية على بُعد المثير */
export const DIGITAL_STIMULUS_SUPPORT_SUMMARY_AR = DIGITAL_ASSISTANCE_CUES.map(digitalStimulusSupportLabelAr).join(' · ');

/** مستوى الجلسة على البُعدين: «مستقل · مصفوفة المثيرات: مخفّضة جزئياً (تقليل الخيارات)» */
export function sessionPromptLabelAr(evidence: SessionPromptEvidence): string | undefined {
  if (!evidence.promptLevel && !evidence.stimulusSupport) return undefined;
  const parts: string[] = [];
  if (evidence.promptLevel) parts.push(CLINICAL_PROMPT_LABELS_AR[evidence.promptLevel]);
  if (evidence.stimulusSupport) {
    parts.push(
      `${stimulusSupportLabelAr(evidence.stimulusSupport)} (${DIGITAL_STIMULUS_SUPPORT[evidence.stimulusSupport].cue_label_ar})`
    );
  }
  return parts.join(' · ');
}

/** أعلى مستوى مساعدة في مجموعة محاولات (الأكثر تدخلاً) */
export function mostIntrusivePromptLevel(
  levels: ReadonlyArray<string | undefined>
): ClinicalPromptLevel | undefined {
  let worst = -1;
  for (const raw of levels) {
    const level = toClinicalPromptLevel(raw);
    if (level) worst = Math.max(worst, CLINICAL_PROMPT_LEVELS.indexOf(level));
  }
  return worst >= 0 ? CLINICAL_PROMPT_LEVELS[worst] : undefined;
}

export type SessionSetting = 'clinic' | 'home' | 'school' | 'public_place';

/** جلسة واحدة على هدف — مدخل حكم الإتقان */
export interface MasterySessionRecord {
  session_id: string;
  goal_id: string;
  date: string;
  /** نسبة المحاولات المستقلة الصالحة (استجابة مستقلة + مصفوفة كاملة غير معدّلة) */
  independence_pct: number;
  /** بُعد الاستجابة: أعلى تلقين بشري */
  prompt_level: SessionPromptLevel;
  /** بُعد المثير: أكثر تعديل رقمي للمصفوفة في الجلسة — غائب = مصفوفة كاملة غير معدّلة */
  stimulus_support?: DigitalAssistanceCue;
  /** المحاولة الأولى في الجلسة (Cold probe) أُدّيت باستقلال وعلى مصفوفة كاملة غير معدّلة */
  first_trial_independent?: boolean;
  /** الاستجابة جاءت على المثير الطبيعي في البيئة دون تلقين من المدرّب */
  natural_cue_only?: boolean;
  trainer_id?: string;
  setting?: SessionSetting;
  /** وضع التكرار/المدة: تحقق معيار الهدف السلوكي في هذه الجلسة */
  met_frequency_criterion?: boolean;
}

/** الإعدادات المركزية لأنواع المهارات */
export const DEFAULT_SKILL_TYPE_CONFIGS: Record<SkillCategoryId, SkillTypeConfig> = {
  closed_cognitive: {
    skill_type_id: 'closed_cognitive',
    label_ar: 'مهارات معرفية/أكاديمية مغلقة',
    domains: ['المطابقة', 'التصنيف', 'ما قبل الأكاديمية'],
    mastery_threshold_pct: 100,
    consecutive_sessions_required: 3,
    min_interval_between_sessions_hours: 0,
    require_cold_probe_first_trial: true,
    require_multiple_trainers: false,
    require_multiple_settings: false,
  },
  social: {
    skill_type_id: 'social',
    label_ar: 'المهارات الاجتماعية',
    domains: ['التواصل البصري التلقائي', 'المبادرة', 'اللعب التبادلي'],
    mastery_threshold_pct: 80,
    consecutive_sessions_required: 4,
    min_interval_between_sessions_hours: 24,
    require_cold_probe_first_trial: true,
    require_multiple_trainers: true,
    min_distinct_trainers: 2,
    require_multiple_settings: false,
  },
  adaptive_self_help: {
    skill_type_id: 'adaptive_self_help',
    label_ar: 'الاستقلالية الذاتية (ADL)',
    domains: ['ارتداء الملابس', 'الأكل', 'النظافة الشخصية'],
    mastery_threshold_pct: 90,
    allow_natural_cue_as_independent: true,
    consecutive_sessions_required: 3,
    min_interval_between_sessions_hours: 24,
    require_cold_probe_first_trial: true,
    require_multiple_trainers: false,
    require_multiple_settings: true,
    min_distinct_settings: 2,
  },
  self_regulation: {
    skill_type_id: 'self_regulation',
    label_ar: 'التنظيم الذاتي/السلوك',
    domains: [],
    measurement_mode: 'frequency_duration',
    mastery_threshold_pct: null,
    consecutive_sessions_required: 5,
    min_interval_between_sessions_hours: 24,
    require_cold_probe_first_trial: false,
    require_multiple_trainers: true,
    min_distinct_trainers: 2,
    require_multiple_settings: false,
  },
};

export const SKILL_TYPE_CONFIGS = DEFAULT_SKILL_TYPE_CONFIGS;

/** توجيه المجالات التنموية التسعة إلى نوع المهارة */
export const SKILL_CATEGORY_BY_DEVELOPMENTAL_DOMAIN: Record<DevelopmentalDomainId, SkillCategoryId> = {
  receptive_language: 'closed_cognitive',
  expressive_language: 'closed_cognitive',
  cognitive_pre_academic: 'closed_cognitive',
  gross_motor: 'closed_cognitive',
  fine_motor: 'closed_cognitive',
  social_skills: 'social',
  self_help: 'adaptive_self_help',
  adaptive_behavior: 'self_regulation',
  sensory_integration: 'self_regulation',
};

/** النوع الافتراضي عند غياب المجال: أكثر الأنواع صرامة */
export const DEFAULT_SKILL_CATEGORY: SkillCategoryId = 'closed_cognitive';

export function skillCategoryForDomain(
  domain: DevelopmentalDomainId | string | undefined
): SkillCategoryId {
  if (!domain) return DEFAULT_SKILL_CATEGORY;
  return (
    SKILL_CATEGORY_BY_DEVELOPMENTAL_DOMAIN[domain as DevelopmentalDomainId] ??
    DEFAULT_SKILL_CATEGORY
  );
}

export function skillConfigForDomain(
  domain: DevelopmentalDomainId | string | undefined
): SkillTypeConfig {
  return SKILL_TYPE_CONFIGS[skillCategoryForDomain(domain)];
}

export type SkillMasteryBlocker =
  | 'insufficient_consecutive_sessions'
  | 'insufficient_distinct_trainers'
  | 'insufficient_distinct_settings'
  | 'mastery_withdrawn_maintenance';

export const SKILL_MASTERY_BLOCKER_LABELS_AR: Record<SkillMasteryBlocker, string> = {
  insufficient_consecutive_sessions: 'جلسات مؤهلة متتالية غير كافية',
  insufficient_distinct_trainers: 'يلزم تنفيذ الجلسات مع مدرّبين مختلفين',
  insufficient_distinct_settings: 'يلزم تنفيذ الجلسات في بيئات مختلفة',
  mastery_withdrawn_maintenance: 'سُحب الإتقان: مجسّا صيانة متتاليان دون 80% — إعادة اكتساب',
};

export const SESSION_SETTING_LABELS_AR: Record<SessionSetting, string> = {
  clinic: 'العيادة / المركز',
  home: 'المنزل',
  school: 'المدرسة',
  public_place: 'مكان عام',
};

export interface SkillMasteryResult {
  skill_type_id: SkillCategoryId;
  mastered: boolean;
  qualifying_streak: number;
  consecutive_sessions_required: number;
  distinct_trainers: number;
  distinct_settings: number;
  blockers: SkillMasteryBlocker[];
  /** تاريخ الجلسة التي اكتمل بها الإتقان (للأهداف فقط) */
  mastered_at?: string;
}

/** الاستقلال يتطلب البُعدين معاً: لا تلقين بشري، ومصفوفة كاملة غير معدّلة */
function effectivelyIndependent(
  config: SkillTypeConfig,
  session: MasterySessionRecord
): boolean {
  if (isValidIndependentTrial(session.prompt_level, session.stimulus_support)) return true;
  return Boolean(
    !session.stimulus_support && config.allow_natural_cue_as_independent && session.natural_cue_only
  );
}

/** هل تُحتسب الجلسة ضمن سلسلة الإتقان لهذا النوع؟ */
export function sessionQualifies(
  config: SkillTypeConfig,
  session: MasterySessionRecord
): boolean {
  if (config.measurement_mode === 'frequency_duration') {
    return session.met_frequency_criterion === true;
  }
  const threshold = config.mastery_threshold_pct ?? 100;
  if (!(Number(session.independence_pct) >= threshold)) return false;
  if (threshold >= 100 && !effectivelyIndependent(config, session)) return false;
  if (threshold >= 100 && session.stimulus_support) return false;
  if (config.require_cold_probe_first_trial && session.first_trial_independent !== true) {
    return false;
  }
  return true;
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * سلسلة الجلسات المؤهلة المتتالية حتى آخر جلسة.
 * جلسة غير مؤهلة تكسر السلسلة؛ جلسة مؤهلة أقرب من الفاصل الأدنى لا تُحتسب ولا تكسرها.
 */
export function qualifyingRun(
  config: SkillTypeConfig,
  sessions: ReadonlyArray<MasterySessionRecord>
): MasterySessionRecord[] {
  const ordered = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const minGap = Math.max(0, config.min_interval_between_sessions_hours) * HOUR_MS;
  let run: MasterySessionRecord[] = [];
  for (const session of ordered) {
    if (!sessionQualifies(config, session)) {
      run = [];
      continue;
    }
    const last = run[run.length - 1];
    if (last && Date.parse(session.date) - Date.parse(last.date) < minGap) continue;
    run.push(session);
  }
  return run;
}

function distinctCount(values: Array<string | undefined>): number {
  return new Set(values.filter((v): v is string => Boolean(v))).size;
}

export function goalSessionToMasteryRecord(
  goalId: string,
  session: GoalSession,
  index: number
): MasterySessionRecord {
  const fully = session.fullyIndependent === true && !session.stimulusSupport;
  return {
    session_id: `${goalId}#${index}`,
    goal_id: goalId,
    date: session.at,
    independence_pct: session.independencePct ?? (fully ? 100 : 0),
    prompt_level: session.promptLevel ?? (fully ? 'Independent' : 'Verbal'),
    stimulus_support: session.stimulusSupport,
    first_trial_independent: session.firstTrialIndependent ?? fully,
    natural_cue_only: session.naturalCueOnly,
    trainer_id: session.trainerId,
    setting: session.setting,
    met_frequency_criterion: session.metFrequencyCriterion,
  };
}

export function skillConfigForGoal(
  goal: Pick<TrackedGoal, 'criterionId' | 'developmentalDomain'>
): SkillTypeConfig {
  return skillConfigForDomain(
    goal.developmentalDomain ?? getCriterionById(goal.criterionId)?.developmentalDomain
  );
}

export type MasteryGoalInput = Pick<
  TrackedGoal,
  'id' | 'criterionId' | 'developmentalDomain' | 'sessions' | 'masteryWithdrawals'
>;

/** آخر سحب للإتقان — الجلسات قبله لا تُحتسب في إعادة الاكتساب */
export function lastMasteryWithdrawalAt(goal: Pick<TrackedGoal, 'masteryWithdrawals'>): string | undefined {
  const dates = (goal.masteryWithdrawals || []).map((w) => w.at).sort();
  return dates[dates.length - 1];
}

/**
 * الإتقان ثابت بعد تحققه: يُسجَّل تاريخ أول لحظة اكتمل فيها، ولا يُلغى
 * إلا بسحب الإتقان من مجسات الصيانة (lib/maintenanceSchedule.ts).
 */
export function evaluateGoalMastery(goal: MasteryGoalInput): SkillMasteryResult {
  const config = skillConfigForGoal(goal);
  const since = lastMasteryWithdrawalAt(goal);
  const records = (goal.sessions || [])
    .map((s, i) => goalSessionToMasteryRecord(goal.id, s, i))
    .filter((r) => !since || r.date > since)
    .sort((a, b) => a.date.localeCompare(b.date));

  for (let i = 0; i < records.length; i++) {
    const result = evaluateSkillMastery(config, records.slice(0, i + 1));
    if (result.mastered) return { ...result, mastered_at: records[i].date };
  }
  const result = evaluateSkillMastery(config, records);
  return since
    ? { ...result, blockers: ['mastery_withdrawn_maintenance', ...result.blockers] }
    : result;
}

export function evaluateSkillMastery(
  config: SkillTypeConfig,
  sessions: ReadonlyArray<MasterySessionRecord>
): SkillMasteryResult {
  const run = qualifyingRun(config, sessions);
  const window = run.slice(-Math.max(config.consecutive_sessions_required, 1));
  const distinctTrainers = distinctCount(window.map((s) => s.trainer_id));
  const distinctSettings = distinctCount(window.map((s) => s.setting));

  const blockers: SkillMasteryBlocker[] = [];
  if (run.length < config.consecutive_sessions_required) {
    blockers.push('insufficient_consecutive_sessions');
  }
  if (
    config.require_multiple_trainers &&
    distinctTrainers < (config.min_distinct_trainers ?? 2)
  ) {
    blockers.push('insufficient_distinct_trainers');
  }
  if (
    config.require_multiple_settings &&
    distinctSettings < (config.min_distinct_settings ?? 2)
  ) {
    blockers.push('insufficient_distinct_settings');
  }

  return {
    skill_type_id: config.skill_type_id,
    mastered: blockers.length === 0,
    qualifying_streak: run.length,
    consecutive_sessions_required: config.consecutive_sessions_required,
    distinct_trainers: distinctTrainers,
    distinct_settings: distinctSettings,
    blockers,
  };
}

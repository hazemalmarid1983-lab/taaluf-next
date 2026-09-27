/**
 * إتقان الأهداف حسب نوع المهارة (CLINICAL_RULES).
 * لكل نوع عتبة وعدد جلسات متتالية وشروط تعميم خاصة به.
 * القيم الافتراضية أدناه مقترح تربوي — تحتاج مراجعة علمية قبل الاعتماد النهائي.
 */

import type { GoalSession, TrackedGoal } from '@/lib/goalsEngine';
import type { SkillCategoryId, SkillTypeConfig } from '@/types/clinical';
import { getCriterionById, type DevelopmentalDomainId } from '@/types/taalof';

export type { SkillCategoryId, SkillTypeConfig };

export type SessionPromptLevel =
  | 'Independent'
  | 'Verbal'
  | 'Gestural'
  | 'Partial Physical'
  | 'Full Physical';

export type SessionSetting = 'clinic' | 'home' | 'school' | 'public_place';

/** جلسة واحدة على هدف — مدخل حكم الإتقان */
export interface MasterySessionRecord {
  session_id: string;
  goal_id: string;
  date: string;
  independence_pct: number;
  prompt_level: SessionPromptLevel;
  /** المحاولة الأولى في الجلسة (Cold probe) أُدّيت باستقلال */
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
  | 'insufficient_distinct_settings';

export const SKILL_MASTERY_BLOCKER_LABELS_AR: Record<SkillMasteryBlocker, string> = {
  insufficient_consecutive_sessions: 'جلسات مؤهلة متتالية غير كافية',
  insufficient_distinct_trainers: 'يلزم تنفيذ الجلسات مع مدرّبين مختلفين',
  insufficient_distinct_settings: 'يلزم تنفيذ الجلسات في بيئات مختلفة',
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
}

function effectivelyIndependent(
  config: SkillTypeConfig,
  session: MasterySessionRecord
): boolean {
  if (session.prompt_level === 'Independent') return true;
  return Boolean(config.allow_natural_cue_as_independent && session.natural_cue_only);
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
  const fully = session.fullyIndependent === true;
  return {
    session_id: `${goalId}#${index}`,
    goal_id: goalId,
    date: session.at,
    independence_pct: session.independencePct ?? (fully ? 100 : 0),
    prompt_level: fully ? 'Independent' : 'Verbal',
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

export function evaluateGoalMastery(
  goal: Pick<TrackedGoal, 'id' | 'criterionId' | 'developmentalDomain' | 'sessions'>
): SkillMasteryResult {
  const records = (goal.sessions || []).map((s, i) =>
    goalSessionToMasteryRecord(goal.id, s, i)
  );
  return evaluateSkillMastery(skillConfigForGoal(goal), records);
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

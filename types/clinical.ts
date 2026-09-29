/**
 * أنواع الإتقان حسب نوع المهارة ومؤشر التعميم.
 */

export type SkillCategoryId =
  | 'closed_cognitive'
  | 'social'
  | 'adaptive_self_help'
  | 'self_regulation';

/**
 * البُعد الأول — مستوى تلقين الاستجابة (بشري/سلوكي):
 * تسلسل المساعدة الموحّد (8 مستويات) من الأقل إلى الأكثر تدخلاً —
 * يطابق PromptHierarchyLevel في نماذج الجلسات. لا تُسجَّل فيه أي مساعدة رقمية.
 */
export type ClinicalPromptLevel =
  | 'Independent'
  | 'Partial Verbal'
  | 'Verbal'
  | 'Gestural'
  | 'Model'
  | 'Partial Physical'
  | 'Full Physical'
  | 'No Response';

/**
 * مساعدات المحرك الرقمي كما تظهر على الشاشة، من الأقل إلى الأكثر تدخلاً.
 * تُسجَّل في TrainingTrial.promptLevel لكنها تعديلات على مصفوفة المثيرات (Stimulus prompts)
 * لا تلقين استجابة — تُقرأ عبر DIGITAL_STIMULUS_SUPPORT ولا تُطابَق مع ClinicalPromptLevel.
 */
export type DigitalAssistanceCue = 'visual_hint' | 'reduced_choices' | 'direct_visual_assistance';

/** البُعد الثاني — مستوى دعم مصفوفة المثيرات (رقمي/بيئي) */
export type StimulusArrayLevel = 'full_array' | 'partially_reduced' | 'highly_reduced';

export const STIMULUS_ARRAY_LEVELS: readonly StimulusArrayLevel[] = [
  'full_array',
  'partially_reduced',
  'highly_reduced',
];

export const STIMULUS_ARRAY_LABELS_AR: Readonly<Record<StimulusArrayLevel, string>> = {
  full_array: 'كاملة',
  partially_reduced: 'مخفّضة جزئياً',
  highly_reduced: 'مخفّضة بشدة',
};

export const STIMULUS_ARRAY_LABELS_EN: Readonly<Record<StimulusArrayLevel, string>> = {
  full_array: 'Full array',
  partially_reduced: 'Partially reduced',
  highly_reduced: 'Highly reduced',
};

export type StimulusSupportStatus = 'pending_scientific_signoff' | 'approved';

export interface DigitalStimulusSupportRule {
  cue: DigitalAssistanceCue;
  array_level: StimulusArrayLevel;
  /** الهدف مُبرز بصرياً داخل المصفوفة */
  target_highlighted: boolean;
  cue_label_ar: string;
  cue_label_en: string;
  /** ما يراه الطفل على الشاشة */
  on_screen_ar: string;
  /** سبب التصنيف على بُعد دعم المثير */
  rationale_ar: string;
}

/**
 * فصل تعديل مصفوفة المثيرات عن تلقين الاستجابة (بُعدان مستقلان):
 *
 * 1. مستوى تلقين الاستجابة (ClinicalPromptLevel) بشري فقط: مستقل، إشارة، نموذج، جسدي…
 *    لا تُطابَق أي مساعدة رقمية (مصفوفة مخفّضة أو إبراز بصري) مع «إشارة» أو «نموذج».
 * 2. دعم مصفوفة المثيرات (StimulusArrayLevel) رقمي/بيئي: كاملة، مخفّضة جزئياً، مخفّضة بشدة،
 *    مع علامة إبراز الهدف. المحاولة التي تلقّت دعماً رقمياً فقط تُسجَّل «مستقل» على بُعد الاستجابة
 *    و«مدعومة» على بُعد المثير.
 * 3. المحاولة المستقلة الصالحة للإتقان = استجابة مستقلة + مصفوفة كاملة غير معدّلة (بلا تقليل ولا إبراز).
 *    محاولات المصفوفة المخفّضة تُسجَّل تحت دعم المثير ولا تُحتسب في نسبة الاستقلالية.
 * 4. إتقان المجس البارد (100%): استقلالية استجابة 100% ومصفوفة كاملة غير معدّلة في كل جلسة
 *    من الجلسات المتتالية المطلوبة.
 * 5. مستوى الجلسة على كل بُعد = الأكثر تدخلاً بين محاولاتها. الزمن وحده لا يحدد المستوى —
 *    يُسجَّل أقوى دعم ظهر فعلاً قبل الاستجابة.
 *
 * الحالة: الفصل مطبّق بطلب المدقق السريري؛ تصنيف كل مساعدة على مستويات المصفوفة بانتظار الاعتماد.
 */
export const STIMULUS_SUPPORT_STATUS: StimulusSupportStatus = 'pending_scientific_signoff';

export const DIGITAL_ASSISTANCE_CUES: readonly DigitalAssistanceCue[] = [
  'visual_hint',
  'reduced_choices',
  'direct_visual_assistance',
];

export const DIGITAL_STIMULUS_SUPPORT: Readonly<Record<DigitalAssistanceCue, DigitalStimulusSupportRule>> = {
  visual_hint: {
    cue: 'visual_hint',
    array_level: 'full_array',
    target_highlighted: true,
    cue_label_ar: 'تلميح بصري',
    cue_label_en: 'Visual hint',
    on_screen_ar: 'إبراز منطقة الهدف مع بقاء كل الخيارات',
    rationale_ar: 'المصفوفة كاملة لكن الهدف مُبرز — تعديل داخل المثير (within-stimulus prompt) لا تلقين استجابة',
  },
  reduced_choices: {
    cue: 'reduced_choices',
    array_level: 'partially_reduced',
    target_highlighted: false,
    cue_label_ar: 'تقليل الخيارات',
    cue_label_en: 'Reduced choices',
    on_screen_ar: 'حذف المشتت الأبعد شبهاً مع بقاء الهدف والمشتتات الأقرب',
    rationale_ar: 'يقلّص عدد المشتتات في المصفوفة — تعديل للمثير (stimulus prompt) لا إشارة من المدرّب',
  },
  direct_visual_assistance: {
    cue: 'direct_visual_assistance',
    array_level: 'highly_reduced',
    target_highlighted: true,
    cue_label_ar: 'مساعدة بصرية مباشرة',
    cue_label_en: 'Direct visual guidance',
    on_screen_ar: 'الهدف مع مشتت واحد فقط، والهدف مُبرز ومُوجَّه إليه',
    rationale_ar: 'مصفوفة من خيارين مع إبراز الهدف — أقصى تعديل للمثير، ولا يُعدّ نمذجة للاستجابة',
  },
};

export interface SkillTypeConfig {
  skill_type_id: SkillCategoryId;
  label_ar: string;
  /** أمثلة المهارات الفرعية للعرض — التوجيه للمجالات التسعة في SKILL_CATEGORY_BY_DEVELOPMENTAL_DOMAIN */
  domains: string[];
  mastery_threshold_pct: number | null;
  consecutive_sessions_required: number;
  min_interval_between_sessions_hours: number;
  require_cold_probe_first_trial: boolean;
  require_multiple_trainers: boolean;
  min_distinct_trainers?: number;
  require_multiple_settings: boolean;
  min_distinct_settings?: number;
  allow_natural_cue_as_independent?: boolean;
  measurement_mode?: 'trial_based' | 'frequency_duration';
}

export interface GeneralizationProbe {
  probe_id: string;
  goal_id: string;
  date: string;
  dimension: 'person' | 'place' | 'material_stimulus';
  details: {
    person_type?: 'primary_specialist' | 'secondary_specialist' | 'parent' | 'teacher' | 'peer';
    person_id?: string;
    setting?: 'clinic' | 'home' | 'school' | 'public_place';
    material_used?: string;
    is_novel_material?: boolean;
  };
  independence_pct: number;
  prompt_level: ClinicalPromptLevel;
  is_first_trial_cold_probe: boolean;
  mood_state?: string;
  reported_by: 'professional' | 'parent_report';
  notes?: string;
}

export type GeneralizationStatus =
  | 'معمَّم بالكامل ✅'
  | 'تعميم جزئي ⚠️'
  | 'غير معمَّم بعد ❌ (مقتصر على بيئة التدريب)';

export type GeneralizationDimension = GeneralizationProbe['dimension'];

export interface GeneralizationIndexResult {
  generalization_index: number;
  gen_status: GeneralizationStatus;
  breakdown: {
    person_score: number;
    place_score: number;
    material_score: number;
  };
  weak_dimension: GeneralizationDimension;
}

/** مجس صيانة بعد الإتقان */
export interface MaintenanceProbe {
  probe_id: string;
  goal_id: string;
  date: string;
  independence_pct: number;
  trainer_id?: string;
  setting?: 'clinic' | 'home' | 'school' | 'public_place';
  notes?: string;
}

export type MasteryWithdrawalReason = 'consecutive_maintenance_probes_below_threshold';

/** سحب الإتقان — يعيد الهدف إلى إعادة الاكتساب */
export interface MasteryWithdrawal {
  at: string;
  reason: MasteryWithdrawalReason;
  probe_ids: string[];
}

/* ------------------------------------------------------------------ FBA */

/** المثير القبلي — ما حدث مباشرة قبل السلوك */
export type FbaAntecedent =
  | 'demand_placed'
  | 'denied_access'
  | 'transition'
  | 'attention_diverted'
  | 'waiting'
  | 'alone_unstructured'
  | 'sensory_environment'
  | 'other';

/** المثير البعدي — ما حدث مباشرة بعد السلوك */
export type FbaConsequence =
  | 'attention_given'
  | 'demand_removed'
  | 'item_given'
  | 'no_social_response'
  | 'planned_ignoring'
  | 'redirected_to_replacement'
  | 'blocked'
  | 'other';

/** الوظائف الأربع للسلوك في تحليل السلوك التطبيقي */
export type BehaviorFunction = 'escape' | 'attention' | 'tangible' | 'automatic';

/** حادثة سلوك واحدة بصيغة ABC — تُسجَّل داخل جلسة تكرار/مدة */
export interface AbcIncident {
  antecedent: FbaAntecedent;
  antecedent_note?: string;
  behavior_note?: string;
  consequence: FbaConsequence;
  consequence_note?: string;
  duration_minutes?: number;
  /** استخدم الطفل السلوك البديل بدل السلوك المستهدف أو بعده مباشرة */
  replacement_behavior_used: boolean;
}

/** خطة التقييم الوظيفي للهدف السلوكي */
export interface FbaPlan {
  /** التعريف الإجرائي القابل للملاحظة للسلوك المستهدف */
  target_behavior: string;
  /** السلوك البديل التكيفي الذي يؤدي الوظيفة نفسها */
  replacement_behavior: string;
  hypothesized_function?: BehaviorFunction;
  updated_at: string;
  updated_by?: string;
}

/**
 * ترجيح الوظيفة من المثيرات (تقييم وصفي ABC وليس تحليلاً وظيفياً تجريبياً):
 * المثير البعدي بوزن 2، والقبلي بوزن 1. null = لا يرجّح وظيفة.
 */
export const FBA_CONSEQUENCE_FUNCTION: Readonly<Record<FbaConsequence, BehaviorFunction | null>> = {
  attention_given: 'attention',
  demand_removed: 'escape',
  item_given: 'tangible',
  no_social_response: 'automatic',
  planned_ignoring: null,
  redirected_to_replacement: null,
  blocked: null,
  other: null,
};

export const FBA_ANTECEDENT_FUNCTION: Readonly<Record<FbaAntecedent, BehaviorFunction | null>> = {
  demand_placed: 'escape',
  denied_access: 'tangible',
  transition: 'escape',
  attention_diverted: 'attention',
  waiting: 'tangible',
  alone_unstructured: 'automatic',
  sensory_environment: 'automatic',
  other: null,
};

/** أقل عدد حوادث لترجيح وظيفة، وأقل حصة من الأصوات للوظيفة الراجحة */
export const FBA_MIN_INCIDENTS_FOR_HYPOTHESIS = 5;
export const FBA_MIN_FUNCTION_SHARE = 0.5;

/* ------------------------------------------------------------------ IOA */

/**
 * طرق اتفاق الملاحظين:
 * - trial_by_trial: عدد المحاولات المتطابقة (نفس مستوى المساعدة) ÷ عدد المحاولات × 100
 * - total_count: العدد الأصغر ÷ الأكبر × 100
 * - total_duration: المدة الأقصر ÷ الأطول × 100
 */
export type IoaMethod = 'trial_by_trial' | 'total_count' | 'total_duration';

/** الحد الأدنى المقبول للاتفاق، والنسبة المستهدفة من الجلسات الخاضعة للاتفاق — بانتظار الاعتماد */
export const IOA_ACCEPTABLE_PCT = 80;
export const IOA_COVERAGE_TARGET_PCT = 20;

export interface IoaObserverData {
  observer_id: string;
  observer_name?: string;
  observer_role?: string;
  trial_scores?: ClinicalPromptLevel[];
  total_count?: number;
  total_duration_minutes?: number;
}

/** سجل اتفاق: بيانات الملاحظ الأساسي (من الجلسة) مقابل ملاحظ ثانٍ مستقل */
export interface IoaRecord {
  ioa_id: string;
  goal_id: string;
  /** يطابق GoalSession.at للجلسة الأساسية */
  session_at: string;
  method: IoaMethod;
  primary: IoaObserverData;
  secondary: IoaObserverData;
  agreement_pct: number;
  /** trial_by_trial فقط: الاتفاق على «مستقل / غير مستقل» */
  independence_agreement_pct?: number;
  meets_standard: boolean;
  recorded_at: string;
  recorded_by: string;
  notes?: string;
}

export type GoalLifecyclePhase =
  | 'acquisition'
  | 'maintenance'
  | 'maintained'
  | 're_acquisition';

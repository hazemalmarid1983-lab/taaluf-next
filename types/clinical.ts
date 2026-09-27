/**
 * أنواع الإتقان حسب نوع المهارة ومؤشر التعميم.
 */

export type SkillCategoryId =
  | 'closed_cognitive'
  | 'social'
  | 'adaptive_self_help'
  | 'self_regulation';

/**
 * تسلسل المساعدة الموحّد (8 مستويات) من الأقل إلى الأكثر تدخلاً —
 * يطابق PromptHierarchyLevel في نماذج الجلسات.
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
 * تُسجَّل في TrainingTrial.promptLevel وتُطابَق مع ClinicalPromptLevel عبر DIGITAL_PROMPT_MAPPING.
 */
export type DigitalAssistanceCue = 'visual_hint' | 'reduced_choices' | 'direct_visual_assistance';

/** مصدر أعلى مساعدة في الجلسة: مدرّب بشري أو أداة/لعبة رقمية */
export type PromptSource = 'human' | 'digital_assistance';

export type DigitalPromptMappingStatus = 'pending_scientific_signoff' | 'approved';

/** المستويات السريرية المسموح أن تطابقها مساعدة رقمية — لا مساعدة رقمية جسدية أو لفظية */
export type DigitalMappedClinicalLevel = Extract<ClinicalPromptLevel, 'Gestural' | 'Model'>;

export interface DigitalPromptMappingRule {
  cue: DigitalAssistanceCue;
  clinical_level: DigitalMappedClinicalLevel;
  cue_label_ar: string;
  cue_label_en: string;
  /** ما يراه الطفل على الشاشة */
  on_screen_ar: string;
  /** سبب المطابقة مع المستوى السريري */
  rationale_ar: string;
}

/**
 * قاعدة مطابقة المساعدات الرقمية مع مقياس المساعدة الموحّد (8 مستويات):
 *
 * 1. كل محاولة تُطابَق منفردة: التلميح البصري وتقليل الخيارات = Gestural،
 *    والمساعدة البصرية المباشرة (عرض الهدف وتوجيهه) = Model.
 * 2. أي مساعدة رقمية تجعل المحاولة غير مستقلة؛ لا تُطابَق مساعدة رقمية مع Independent أبداً،
 *    ولا تتجاوز Model (لا توجد مساعدة رقمية لفظية أو جسدية).
 * 3. مستوى الجلسة = أكثر مستوى تدخلاً بين محاولاتها (بشرية أو رقمية).
 *    إذا بلغته مساعدة رقمية فقط يُسجَّل promptSource = 'digital_assistance' مع digitalPromptCue
 *    (عند التعادل تُختار المساعدة الرقمية الأعلى رتبة). إذا بلغه تلقين بشري يُسجَّل 'human'.
 * 4. الخادم يعيد اشتقاق promptLevel من digitalPromptCue ولا يقبل مستوى يخالف المطابقة.
 * 5. الزمن وحده لا يحدد المستوى — يُسجَّل أقوى مساعدة ظهرت فعلاً قبل الاستجابة.
 *
 * الحالة: اجتهاد برمجي بانتظار اعتماد الاستشاري السريري.
 */
export const DIGITAL_PROMPT_MAPPING_STATUS: DigitalPromptMappingStatus = 'pending_scientific_signoff';

export const DIGITAL_ASSISTANCE_CUES: readonly DigitalAssistanceCue[] = [
  'visual_hint',
  'reduced_choices',
  'direct_visual_assistance',
];

export const DIGITAL_PROMPT_MAPPING: Readonly<Record<DigitalAssistanceCue, DigitalPromptMappingRule>> = {
  visual_hint: {
    cue: 'visual_hint',
    clinical_level: 'Gestural',
    cue_label_ar: 'تلميح بصري',
    cue_label_en: 'Visual hint',
    on_screen_ar: 'إبراز منطقة الهدف مع بقاء كل الخيارات',
    rationale_ar: 'يوجّه الانتباه نحو الهدف دون أداء الاستجابة عن الطفل — يعادل الإشارة أو النظرة',
  },
  reduced_choices: {
    cue: 'reduced_choices',
    clinical_level: 'Gestural',
    cue_label_ar: 'تقليل الخيارات',
    cue_label_en: 'Reduced choices',
    on_screen_ar: 'حذف المشتت الأبعد شبهاً مع بقاء الهدف والمشتتات الأقرب',
    rationale_ar: 'يضيّق مجال الاختيار دون عرض الاستجابة الصحيحة — يعادل الإشارة نحو مجموعة الخيارات',
  },
  direct_visual_assistance: {
    cue: 'direct_visual_assistance',
    clinical_level: 'Model',
    cue_label_ar: 'مساعدة بصرية مباشرة',
    cue_label_en: 'Direct visual guidance',
    on_screen_ar: 'الهدف مع مشتت واحد فقط، والهدف مُبرز ومُوجَّه إليه',
    rationale_ar: 'تعرض الاستجابة الصحيحة نفسها أمام الطفل قبل أدائها — يعادل النمذجة (Demonstration)',
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

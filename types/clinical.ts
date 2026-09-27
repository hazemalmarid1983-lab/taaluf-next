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

export type GoalLifecyclePhase =
  | 'acquisition'
  | 'maintenance'
  | 'maintained'
  | 're_acquisition';

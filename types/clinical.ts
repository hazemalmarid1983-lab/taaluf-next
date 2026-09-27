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

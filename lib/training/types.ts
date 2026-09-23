/**
 * أنواع منظومة التدريب الرقمية — منصة تآلف
 * مسار: Assessment → Skills → Goals → Plan → Chapter → Media → Session → Trials → Progress
 */

/** الفئات العمرية المتوافقة مع معايير تآلف */
export type TrainingAgeBand = '3-4' | '5-6' | '7-9' | '10-12';

/** مستويات الصعوبة القابلة للتدرج */
export type TrainingDifficulty = 1 | 2 | 3;

/**
 * مستويات المساعدة المسجّلة في Trial — مستقلة عن homeClassroomEngine.
 *
 * المحركات الرقمية تستخدم: independent | visual_hint | reduced_choices |
 * direct_visual_assistance | no_response
 *
 * gestural / verbal / partial_physical / full_physical محفوظة للتسجيل البشري
 * المستقبلي — لا تُعيَّن تلقائياً من latency أو UI stage.
 */
export type TrainingPromptLevel =
  | 'independent'
  | 'visual_hint'
  | 'reduced_choices'
  | 'direct_visual_assistance'
  | 'no_response'
  | 'gestural'
  | 'verbal'
  | 'verbal_partial'
  | 'model'
  | 'partial_physical'
  | 'full_physical';

/** محاور التدريب النمائي */
export type TrainingDomainId =
  | 'cognitive'
  | 'communication'
  | 'social'
  | 'sensory_behavior';

export type TrainingDomain = {
  id: TrainingDomainId;
  titleAr: string;
  titleEn: string;
};

/** أنواع محركات الوسائل — قابلة للتوسع دون تغيير واجهة Media */
export const TRAINING_ENGINE_TYPES = [
  'visual_tracking',
  'matching',
  'visual_memory',
  'visual_search',
  'response_control',
  'expressive_choice',
  'receptive_choice',
  /** C15 — نموذج رقمي + تنفيذ جسدي + تسجيل مراقب (Hybrid) */
  'observer_imitation',
] as const;

export type TrainingEngineType = (typeof TRAINING_ENGINE_TYPES)[number];

/** أنواع الأهداف التدريبية القابلة للربط بالوسائل والمعايير */
export const TRAINING_GOAL_TYPES = [
  'joint_attention',
  'attention_sustain',
  'visual_tracking',
  'identical_matching',
  'visual_memory',
  'visual_search',
  'response_inhibition',
  'waiting',
  'task_completion',
  'functional_request',
  'symbol_request',
  'receptive_instruction',
  'communicative_point',
  'name_orienting',
  'gross_motor_imitation',
  'fine_motor_imitation',
  'social_expression_imitation',
  'imitation_after_model_replay',
  'imitation_with_assistance_fading',
] as const;

export type TrainingGoalType = (typeof TRAINING_GOAL_TYPES)[number];

/** مهارة تدريبية — قابلة لإعادة الاستخدام عبر فصول وأهداف متعددة */
export type TrainingSkill = {
  skillId: string;
  domainId: TrainingDomainId;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  criterionIds: string[];
};

/** ربط الوسيلة بهدف تدريبي و/أو معيار تقييم */
export type TrainingGoalLink = {
  goalType: TrainingGoalType;
  labelAr: string;
  labelEn: string;
  criterionIds?: string[];
  skillIds?: string[];
};

/**
 * إعدادات الوسيلة — قابلة للتوسع عبر حقول إضافية دون تعديل المحرك.
 * unknown وليس any: يسمح بحقول مستقبلية مع الحفاظ على type safety للحقول المعروفة.
 */
export type TrainingMediaConfigBase = {
  trialCount?: number;
  choices?: number;
  difficulty?: TrainingDifficulty;
  prompting?: boolean;
  reinforcement?: boolean;
  distractorCount?: number;
  displayDurationMs?: number;
  hideDurationMs?: number;
  waitDurationMs?: number;
  movementSpeed?: number;
  promptLevel?: TrainingPromptLevel;
  reinforcementType?: string;
  prematureResponseAllowed?: boolean;
  /** نافذة الاستجابة قبل no_response (ms) — matching وغيرها */
  responseWindowMs?: number;
  /** مستوى مطابقة تعليمي 1–6 — مستقل عن difficulty الجلسة عند التعريف */
  matchLevel?: number;
  /** محتوى قابل للتخصيص (رموز، ألوان، عناصر…) */
  content?: Record<string, unknown>;
};

export type TrainingMediaConfig = TrainingMediaConfigBase & {
  [key: string]: unknown;
};

/** وسيلة تدريبية — مرتبطة بالمهارات والأهداف، وليس بالفصل فقط */
export type TrainingMedia = {
  mediaId: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  engineType: TrainingEngineType;
  skillIds: string[];
  goalLinks: TrainingGoalLink[];
  criterionIds: string[];
  ageBands: TrainingAgeBand[];
  difficultyLevels: TrainingDifficulty[];
  config: TrainingMediaConfig;
};

/** فصل تدريبي — يجمّع وسائل مرتّبة ومهارات ومعايير */
export type TrainingChapter = {
  chapterId: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn?: string;
  domain: TrainingDomainId;
  skillIds: string[];
  criterionIds: string[];
  ageBands: TrainingAgeBand[];
  difficultyLevels: TrainingDifficulty[];
  orderedMedia: string[];
};

/** مستند JSON كامل للفصل — مهارات + وسائل + بيانات الفصل */
export type TrainingChapterDocument = {
  version: string;
  platform: string;
  chapter: TrainingChapter;
  skills: TrainingSkill[];
  media: TrainingMedia[];
};

/** tap-to-request — Data Contract v1 */
export type TapToRequestResponseMode = 'child_tap' | 'observer_no_response';

export const TAP_TO_REQUEST_PROTOCOL_REVISION = 'tap-to-request-v1';

export const OBSERVER_IMITATION_PROTOCOL_REVISION = 'observer-imitation-v1';

export type ObserverImitationMovementCategory = 'gross' | 'fine' | 'social';

export type ObserverImitationModelType =
  | 'illustration'
  | 'animated'
  | 'video';

/** محاولة واحدة داخل جلسة تدريب */
export type TrainingTrial = {
  trialNumber: number;
  correct: boolean;
  promptLevel: TrainingPromptLevel;
  responseTimeMs?: number;
  recordedAt: string;
  /** tap-to-request v1 — اختياري للتوافق مع جلسات قديمة */
  targetId?: string;
  responseChoiceId?: string | null;
  responseMode?: TapToRequestResponseMode;
  /** observer-imitation v1 — اختياري */
  movementId?: string;
  movementCategory?: ObserverImitationMovementCategory;
  /** عدد مرات إعادة النموذج — لا يُشتق منه promptLevel */
  modelReplays?: number;
};

/** جلسة تدريب — للاستخدام في مراحل لاحقة */
export type TrainingSession = {
  id: string;
  childId: string;
  chapterId: string;
  mediaId: string;
  planId?: string;
  /** مراجع TrackedGoal.id من assignment الخطة — اختياري للتوافق مع جلسات قديمة */
  goalIds?: string[];
  difficulty: TrainingDifficulty;
  startedAt: string;
  endedAt?: string;
  trials: TrainingTrial[];
  independenceRate?: number;
  metrics?: Record<string, number>;
  /** tap-to-request v1 — اختياري */
  protocolRevision?: string;
  /** مهارات مخططة للجلسة — من assignment.skillIds عند الإطلاق من خطة */
  skillIds?: string[];
};

/** تقدم الطفل في وسيلة/فصل — للاستخدام في مراحل لاحقة */
export type TrainingProgress = {
  childId: string;
  chapterId: string;
  mediaId: string;
  completedSessions: number;
  lastDifficulty: TrainingDifficulty;
  independenceRate?: number;
  lastSessionAt?: string;
  masteryLevel?: 'not_started' | 'emerging' | 'developing' | 'mastered';
};

/** محتوى خطة تدريب — وسيلة واحدة بترتيب وصعوبة محددة */
export type TrainingPlanAssignment = {
  mediaId: string;
  difficulty: TrainingDifficulty;
  order: number;
  /** مراجع TrackedGoal.id المرتبطة بهذه المهمة — اختياري للخطط القديمة */
  goalIds?: string[];
  /**
   * مهارات target مختارة ضمن الوسيلة (ماذا يُدرَّب؟) — اختياري.
   * C15 observer-imitation: S1–S3 فقط للخطط الجديدة؛ S4/S5 أبعاد تقدم وليست target skills.
   */
  skillIds?: string[];
};

/** مؤشر التقدم داخل الخطة — nextOrder يطابق TrainingPlanAssignment.order */
export type TrainingPlanCursor = {
  nextOrder: number;
};

/** خطة تدريب — طبقة التنفيذ بين الطفل والأنشطة */
export type TrainingPlan = {
  id: string;
  childId: string;
  chapterId: string;
  goalIds?: string[];
  /** اختياري — مراجع إلى TrackedGoal.id (ليست TrainingGoalLink) */
  assignments: TrainingPlanAssignment[];
  cursor: TrainingPlanCursor;
  startDate: string;
  targetDate?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
};

export type TrainingValidationResult = {
  valid: boolean;
  errors: string[];
};

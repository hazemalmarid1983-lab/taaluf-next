/**
 * مفاتيح تخزين مستقلة لمسار صعوبات التعلم — منفصلة عن المسار النمائي
 */

export const LD_STORAGE = {
  /** ملف الطالب النشط في مسار صعوبات التعلم */
  activeStudent: 'taaluf.ld.activeStudent',
  /** فرز صعوبات التعلم الأولي */
  screening: 'taaluf.ld.screening.v1',
  screeningAlias: 'taaluf_ld_screening_answers',
  /** إجابات التقييم الشامل */
  assessmentAnswers: 'taaluf.ld.assessment.answers',
  /** تقرير التقييم الشامل */
  assessmentReport: 'taaluf.ld.assessment.report',
  /** الخطة التربوية الفردية (IEP) */
  iep: 'taaluf.ld.iep.v1',
  /** جلسات غرفة المصادر */
  resourceRoomSessions: 'taaluf.ld.resourceRoom.sessions',
  /** جدول غرفة المصادر */
  resourceRoomSchedule: 'taaluf.ld.resourceRoom.schedule',
  /** ملفات الطلاب في مسار LD */
  studentProfiles: 'taaluf.ld.studentProfiles.v1',
  /** المسار النشط للجلسة الحالية */
  activeTrack: 'taaluf.activeTrack',
} as const;

/** مفاتيح المسار النمائي — للمرجع والعزل */
export const DEV_STORAGE = {
  screening: 'taaluf.screening.v1',
  goals: 'taaluf.goals.v1',
  activeStudent: 'taaluf.activeStudent',
} as const;

/** مفاتيح منظومة التدريب الرقمية — مسار نمائي */
export const TRAINING_STORAGE = {
  /** خطط التدريب المرتبطة بالأهداف والفصول */
  plans: 'taaluf.training.plans.v1',
  /** جلسات الوسائل التدريبية */
  sessions: 'taaluf.training.sessions.v1',
  /** تقدم الطفل عبر الفصول والوسائل */
  progress: 'taaluf.training.progress.v1',
  /** مسودة المحاولات أثناء الجلسة الحية — تُحذف عند اكتمال الحفظ */
  liveSessions: 'taaluf.training.liveSessions.v1',
} as const;

/** مفاتيح أكاديمية قديمة — تُحوَّل تلقائياً عند القراءة */
export const LEGACY_ACADEMIC_KEYS = {
  screening: 'taaluf.learningScreening.v1',
  screeningAlias: 'taaluf_learning_screening_answers',
  assessmentAnswers: 'taaluf_comprehensive_academic_answers',
  assessmentReport: 'taaluf_comprehensive_academic_report',
} as const;

/**
 * غرف المصادر — جدولة وجلسات مسار صعوبات التعلم
 */

export type ResourceRoomSessionType =
  | 'reading_intervention'
  | 'writing_support'
  | 'math_remediation'
  | 'cognitive_skills'
  | 'study_skills'
  | 'exam_prep';

export type ResourceRoomSessionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type ResourceRoomSlot = {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4; // Sun–Thu (Oman school week)
  startTime: string; // HH:mm
  endTime: string;
  roomName: string;
  specialistName?: string;
  maxStudents: number;
  sessionType: ResourceRoomSessionType;
};

export type ResourceRoomSession = {
  id: string;
  childId: string;
  childName: string;
  slotId?: string;
  scheduledDate: string; // ISO date
  startTime: string;
  endTime: string;
  sessionType: ResourceRoomSessionType;
  status: ResourceRoomSessionStatus;
  /** محور أكاديمي مستهدف */
  targetDomain: string;
  /** هدف الجلسة من IEP */
  iepGoalId?: string;
  /** تدخلات قائمة على الأدلة */
  interventions: string[];
  /** ملاحظات ما قبل الجلسة */
  preNotes?: string;
  /** ملاحظات ما بعد الجلسة */
  postNotes?: string;
  /** مستوى الإنجاز 0–100 */
  achievementPercent?: number;
  /** تسهيلات مطبّقة */
  accommodationsUsed?: string[];
  /** مواد/أدوات */
  materials?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type ResourceRoomWeeklySchedule = {
  childId: string;
  slots: Array<{
    slotId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    sessionType: ResourceRoomSessionType;
    roomName: string;
  }>;
  effectiveFrom: string;
  notes?: string;
};

export const SESSION_TYPE_LABELS: Record<
  ResourceRoomSessionType,
  { ar: string; en: string }
> = {
  reading_intervention: {
    ar: 'تدخل قرائي',
    en: 'Reading Intervention',
  },
  writing_support: {
    ar: 'دعم كتابة',
    en: 'Writing Support',
  },
  math_remediation: {
    ar: 'علاج حسابي',
    en: 'Math Remediation',
  },
  cognitive_skills: {
    ar: 'مهارات إدراكية',
    en: 'Cognitive Skills',
  },
  study_skills: {
    ar: 'مهارات دراسية',
    en: 'Study Skills',
  },
  exam_prep: {
    ar: 'استعداد للاختبارات',
    en: 'Exam Preparation',
  },
};

export const DEFAULT_RESOURCE_ROOM_SLOTS: ResourceRoomSlot[] = [
  {
    id: 'rr_sun_1',
    dayOfWeek: 0,
    startTime: '08:00',
    endTime: '08:45',
    roomName: 'غرفة المصادر 1',
    maxStudents: 4,
    sessionType: 'reading_intervention',
  },
  {
    id: 'rr_sun_2',
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '09:45',
    roomName: 'غرفة المصادر 1',
    maxStudents: 4,
    sessionType: 'math_remediation',
  },
  {
    id: 'rr_mon_1',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '08:45',
    roomName: 'غرفة المصادر 2',
    maxStudents: 4,
    sessionType: 'writing_support',
  },
  {
    id: 'rr_tue_1',
    dayOfWeek: 2,
    startTime: '10:00',
    endTime: '10:45',
    roomName: 'غرفة المصادر 1',
    maxStudents: 3,
    sessionType: 'cognitive_skills',
  },
  {
    id: 'rr_wed_1',
    dayOfWeek: 3,
    startTime: '08:00',
    endTime: '08:45',
    roomName: 'غرفة المصادر 2',
    maxStudents: 4,
    sessionType: 'study_skills',
  },
  {
    id: 'rr_thu_1',
    dayOfWeek: 4,
    startTime: '09:00',
    endTime: '09:45',
    roomName: 'غرفة المصادر 1',
    maxStudents: 4,
    sessionType: 'exam_prep',
  },
];

/**
 * مسارات تربوية مستقلة — وزارة التربية والتعليم vs وزارة التنمية الاجتماعية
 */

/** المسار النمائي: التوحد والإعاقات النمائية (وزارة التنمية الاجتماعية) */
export type DevelopmentalTrack = 'developmental';

/** مسار صعوبات التعلم: قراءة · كتابة · حساب · وظائف تنفيذية (وزارة التربية والتعليم) */
export type LearningDisabilitiesTrack = 'learning_disabilities';

export type EducationalTrack = DevelopmentalTrack | LearningDisabilitiesTrack;

export type RegulatoryBody = 'moe' | 'msd';

export type TrackDefinition = {
  id: EducationalTrack;
  labelAr: string;
  labelEn: string;
  regulatoryBody: RegulatoryBody;
  regulatoryLabelAr: string;
  regulatoryLabelEn: string;
  hubHref: string;
  screeningHref: string;
  assessmentHref: string;
  iepHref: string;
  resourceRoomHref: string;
  reportsHref: string;
};

export const TRACK_DEFINITIONS: Record<EducationalTrack, TrackDefinition> = {
  developmental: {
    id: 'developmental',
    labelAr: 'التوحد والإعاقات النمائية',
    labelEn: 'Autism & Developmental Disabilities',
    regulatoryBody: 'msd',
    regulatoryLabelAr: 'وزارة التنمية الاجتماعية',
    regulatoryLabelEn: 'Ministry of Social Development',
    hubHref: '/dashboard',
    screeningHref: '/dashboard/screening',
    assessmentHref: '/dashboard/assessments/new',
    iepHref: '/dashboard/goals',
    resourceRoomHref: '/dashboard/home-classroom',
    reportsHref: '/dashboard/students',
  },
  learning_disabilities: {
    id: 'learning_disabilities',
    labelAr: 'صعوبات التعلم',
    labelEn: 'Learning Disabilities',
    regulatoryBody: 'moe',
    regulatoryLabelAr: 'وزارة التربية والتعليم',
    regulatoryLabelEn: 'Ministry of Education',
    hubHref: '/dashboard/ld',
    screeningHref: '/dashboard/ld/screening',
    assessmentHref: '/dashboard/ld/assessment',
    iepHref: '/dashboard/ld/iep',
    resourceRoomHref: '/dashboard/ld/resource-room',
    reportsHref: '/dashboard/ld/reports',
  },
};

export function getTrackDefinition(track: EducationalTrack): TrackDefinition {
  return TRACK_DEFINITIONS[track];
}

export function isLearningDisabilitiesTrack(
  track: EducationalTrack | string | undefined | null
): track is LearningDisabilitiesTrack {
  return track === 'learning_disabilities';
}

export function isDevelopmentalTrack(
  track: EducationalTrack | string | undefined | null
): track is DevelopmentalTrack {
  return track === 'developmental' || !track;
}

/** مجالات تقييم صعوبات التعلم — أكاديمية لا حسية/سلوكية */
export type LdAcademicDomain =
  | 'dyslexia'
  | 'dysgraphia'
  | 'dyscalculia'
  | 'cognitive_processing'
  | 'executive_functions';

export const LD_ACADEMIC_DOMAINS: Array<{
  id: LdAcademicDomain;
  labelAr: string;
  labelEn: string;
}> = [
  { id: 'dyslexia', labelAr: 'عسر القراءة', labelEn: 'Dyslexia' },
  { id: 'dysgraphia', labelAr: 'عسر الكتابة', labelEn: 'Dysgraphia' },
  { id: 'dyscalculia', labelAr: 'عسر الحساب', labelEn: 'Dyscalculia' },
  {
    id: 'cognitive_processing',
    labelAr: 'المعالجة الإدراكية',
    labelEn: 'Cognitive Processing',
  },
  {
    id: 'executive_functions',
    labelAr: 'الوظائف التنفيذية',
    labelEn: 'Executive Functions',
  },
];

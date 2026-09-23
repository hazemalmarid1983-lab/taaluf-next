/**
 * الخطة التربوية الفردية (IEP) — مسار صعوبات التعلم
 * وزارة التربية والتعليم — أهداف أكاديمية وتسهيلات وتدخلات قائمة على الأدلة
 */

import type { LdAcademicDomain } from '@/lib/tracks/types';

export type LdIepGoalStatus = 'active' | 'achieved' | 'modified' | 'discontinued';

export type LdIepAccommodation = {
  id: string;
  category: 'testing' | 'classroom' | 'materials' | 'environment' | 'timing';
  descriptionAr: string;
  descriptionEn: string;
  approved: boolean;
};

export type LdIepIntervention = {
  id: string;
  nameAr: string;
  nameEn: string;
  evidenceBase: string;
  frequency: string;
  duration: string;
  responsibleRole: 'ld_specialist' | 'class_teacher' | 'parent' | 'resource_room';
};

export type LdIepGoal = {
  id: string;
  childId: string;
  domain: LdAcademicDomain;
  titleAr: string;
  titleEn: string;
  /** نص SMART كامل */
  smartTextAr: string;
  smartTextEn: string;
  baseline: number;
  target: number;
  current: number;
  measurementMethod: string;
  startDate: string;
  reviewDate: string;
  status: LdIepGoalStatus;
  interventions: LdIepIntervention[];
  progressNotes: Array<{
    at: string;
    note: string;
    score?: number;
    recordedBy?: string;
  }>;
};

export type LdIndividualEducationPlan = {
  id: string;
  childId: string;
  childName: string;
  schoolYear: string;
  term: string;
  createdAt: string;
  updatedAt: string;
  reviewDate: string;
  /** محاور الأولوية */
  priorityDomains: LdAcademicDomain[];
  goals: LdIepGoal[];
  accommodations: LdIepAccommodation[];
  /** متطلبات الدمج المدرسي */
  schoolIntegration: {
    placement: 'regular_class_with_support' | 'resource_room' | 'hybrid';
    hoursPerWeek: number;
    mainClassSubjects: string[];
    supportSubjects: string[];
  };
  /** توقيعات */
  signatures: {
    parentSigned?: boolean;
    specialistSigned?: boolean;
    schoolSigned?: boolean;
    signedAt?: string;
  };
  status: 'draft' | 'active' | 'under_review' | 'archived';
};

export const DEFAULT_ACCOMMODATIONS: LdIepAccommodation[] = [
  {
    id: 'acc_time',
    category: 'timing',
    descriptionAr: 'منح وقت إضافي 25% في الاختبارات التحريرية',
    descriptionEn: '25% extended time on written exams',
    approved: false,
  },
  {
    id: 'acc_reader',
    category: 'testing',
    descriptionAr: 'إتاحة قارئ بشري أو مسموع لأسئلة الاختبار',
    descriptionEn: 'Human or audio reader for exam questions',
    approved: false,
  },
  {
    id: 'acc_seating',
    category: 'environment',
    descriptionAr: 'جلوس في المقاعد الأمامية بعيداً عن مصادر التشتت',
    descriptionEn: 'Front-row seating away from distractions',
    approved: false,
  },
  {
    id: 'acc_notes',
    category: 'materials',
    descriptionAr: 'توفير ملخصات مكتوبة أو بطاقات مرجعية',
    descriptionEn: 'Written summaries or reference cards',
    approved: false,
  },
  {
    id: 'acc_breaks',
    category: 'timing',
    descriptionAr: 'استراحات قصيرة منظمة أثناء المهام الطويلة',
    descriptionEn: 'Scheduled short breaks during long tasks',
    approved: false,
  },
];

export const EVIDENCE_BASED_INTERVENTIONS: Record<
  LdAcademicDomain,
  LdIepIntervention[]
> = {
  dyslexia: [
    {
      id: 'int_phonics',
      nameAr: 'برنامج الوعي الصوتي المنهجي',
      nameEn: 'Systematic Phonics Program',
      evidenceBase: 'Orton-Gillingham / Structured Literacy',
      frequency: '3 جلسات أسبوعياً',
      duration: '30 دقيقة',
      responsibleRole: 'resource_room',
    },
    {
      id: 'int_fluency',
      nameAr: 'تدريب الطلاقة المتكرر',
      nameEn: 'Repeated Reading Fluency',
      evidenceBase: 'National Reading Panel',
      frequency: 'يومياً',
      duration: '15 دقيقة',
      responsibleRole: 'ld_specialist',
    },
  ],
  dysgraphia: [
    {
      id: 'int_handwriting',
      nameAr: 'تدريب الكتابة متعدد الحواس',
      nameEn: 'Multisensory Handwriting',
      evidenceBase: 'Handwriting Without Tears',
      frequency: '3 جلسات أسبوعياً',
      duration: '20 دقيقة',
      responsibleRole: 'resource_room',
    },
  ],
  dyscalculia: [
    {
      id: 'int_concrete',
      nameAr: 'تعليم رياضيات محسوس (CRA)',
      nameEn: 'Concrete-Representational-Abstract',
      evidenceBase: 'CRA Instruction Model',
      frequency: '3 جلسات أسبوعياً',
      duration: '30 دقيقة',
      responsibleRole: 'resource_room',
    },
  ],
  cognitive_processing: [
    {
      id: 'int_working_mem',
      nameAr: 'تدريب الذاكرة العاملة',
      nameEn: 'Working Memory Training',
      evidenceBase: 'Cognitive Load Theory',
      frequency: '2 جلسات أسبوعياً',
      duration: '25 دقيقة',
      responsibleRole: 'ld_specialist',
    },
  ],
  executive_functions: [
    {
      id: 'int_planner',
      nameAr: 'استخدام مخطط بصري للمهام',
      nameEn: 'Visual Task Planner',
      evidenceBase: 'Executive Function Coaching',
      frequency: 'يومياً',
      duration: '10 دقائق',
      responsibleRole: 'class_teacher',
    },
  ],
};

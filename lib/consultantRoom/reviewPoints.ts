import { CONSULTANT_REVIEW_PATH } from '@/lib/consultantRoom/access';
import type { ScientificReviewPoint } from '@/lib/consultantRoom/types';

/**
 * نقاط مراجعة علمية — أسئلة للنقاش مع المستشار.
 * لا تتضمن قرارات علمية — فقط استفسارات مفتوحة.
 */
export const SCIENTIFIC_REVIEW_POINTS: readonly ScientificReviewPoint[] = [
  {
    id: 'screening-thresholds',
    domainAr: 'الفرز',
    questionAr:
      'هل منطق عتبات الفرز (متوازن / متوسط / مرتفع) وتوزيع الأسئلة على الأبعاد الأربعة يتوافق مع الممارسة التربوية المعترف بها؟',
    relatedSectionId: 'assessment-system',
    relatedHref: '/dashboard/screening',
  },
  {
    id: 'canon-validity',
    domainAr: 'التقييم الشامل',
    questionAr:
      'هل صياغة المعايير في المصدر القانوني JSON (C1–C40) ومستوياتها (٠–٣)، ضمن نطاق المراجعة المنهجية الحالية (C1–C34)، تعكس بدقة الممارسات التربوية–التأهيلية المعتمدة؟',
    relatedSectionId: 'assessment-system',
    relatedHref: '/dashboard/assessments/new',
  },
  {
    id: 'c35-c40-review-scope',
    domainAr: 'التقييم الشامل',
    questionAr:
      'هل تُدرج C35–C40 كاملة في بنك مراجعة المستشار، أم تُراجع أولاً كحزمة متخصصة ضمن السلوك والتكيف والحياة اليومية قبل بناء منهجيتها التفصيلية؟',
    relatedSectionId: 'scientific-review-form',
    relatedHref: CONSULTANT_REVIEW_PATH,
  },
  {
    id: 'fusion-weights',
    domainAr: 'دمج المصادر',
    questionAr:
      'هل أوزان دمج درجات المختص والأهل والألعاب (٢ : ١ : ١.٥) منطقية منهجياً؟',
    relatedSectionId: 'assessment-system',
    relatedHref: '/dashboard/parent-assessment',
  },
  {
    id: 'goal-generation',
    domainAr: 'الأهداف',
    questionAr:
      'هل منطق توليد أهداف SMART من البنود ≥٢ وصياغتها التربوية مناسبان للمتابعة الأسبوعية؟',
    relatedSectionId: 'goals-system',
    relatedHref: '/dashboard/goals',
  },
  {
    id: 'training-activities',
    domainAr: 'التدريب',
    questionAr:
      'هل أنشطة الانتباه والتركيز وربطها بخطط التدريب يتوافق مع المنهجية العلاجية المتوقعة؟',
    relatedSectionId: 'training-system',
    relatedHref: '/dashboard/training',
  },
  {
    id: 'sensory-metrics',
    domainAr: 'الغرف الحسية',
    questionAr:
      'ما المقاييس العلمية المناسبة لتسجيل استجابة الطفل في الغرف الحسية التجريبية؟',
    relatedSectionId: 'measurement-progress',
    relatedHref: '/sensory-rooms',
  },
  {
    id: 'disclaimer-language',
    domainAr: 'الإطار القانوني',
    questionAr:
      'هل لغة «ملامح» و«مؤشرات» و«استراتيجيات» — بدلاً من «تشخيص» — كافية وواضحة في كل التقارير؟',
    relatedSectionId: 'overview',
    relatedHref: '/legal',
  },
  {
    id: 'merhid-boundaries',
    domainAr: 'الذكاء الاصطناعي',
    questionAr:
      'ما الحدود العلمية والأخلاقية المناسبة لدور مرشد تآلف (Merhid) في دعم المستشار والمختص؟',
    relatedSectionId: 'ai-role',
    relatedHref: '/hub',
  },
  {
    id: 'gas-scale',
    domainAr: 'القياس والتقدم',
    questionAr:
      'هل مقياس GAS المستخدم لمقارنة التقدم بين الجلسات مناسب للسياق التربوي لمنصة تآلف؟',
    relatedSectionId: 'measurement-progress',
    relatedHref: '/dashboard/goals',
  },
  {
    id: 'iep-approval',
    domainAr: 'خطط IEP',
    questionAr:
      'ما معايير الاعتماد العلمي المقترحة لخطط IEP قبل اعتبارها جاهزة للاستخدام الميداني؟',
    relatedSectionId: 'goals-system',
    relatedHref: '/dashboard/goals',
  },
];

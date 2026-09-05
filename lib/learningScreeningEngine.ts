import {
  LEARNING_SCREENING_QUESTIONS,
  type LearningScreeningDomain,
} from '@/lib/learningScreeningQuestions';

export type AcademicDomain = LearningScreeningDomain;
export type LearningNeedLevel = 'low' | 'moderate' | 'high';

export type DomainResult = {
  domain: AcademicDomain;
  label: string;
  score: number;
  maxScore: number;
  level: LearningNeedLevel;
  levelText: string;
  description: string;
  initialRecommendations: string[];
};

export type LearningScreeningResult = {
  totalScore: number;
  maxTotalScore: number;
  overallRiskLevel: LearningNeedLevel;
  overallRiskText: string;
  domainResults: Record<AcademicDomain, DomainResult>;
  classroomAccommodations: string[];
  recommendFullAssessment: boolean;
  completedAt: string;
  screeningType: 'academic_sld';
};

export const LEARNING_DOMAIN_MAX = 6;
export const LEARNING_TOTAL_MAX = 24;
export const LEARNING_SCREENING_THRESHOLDS = {
  domainModerate: 2,
  domainHigh: 4,
  overallModerate: 7,
  overallHigh: 14,
} as const;

const DOMAIN_ORDER: AcademicDomain[] = [
  'dyslexia',
  'dysgraphia',
  'dyscalculia',
  'executive_adhd',
];

const DOMAIN_METADATA: Record<
  AcademicDomain,
  {
    label: string;
    lowDesc: string;
    modDesc: string;
    highDesc: string;
    recommendations: Record<LearningNeedLevel, string[]>;
    accommodations: Record<Exclude<LearningNeedLevel, 'low'>, string[]>;
  }
> = {
  dyslexia: {
    label: 'القراءة وفك الرموز',
    lowDesc: 'الأداء القرائي وفك الرموز ضمن المعدل المتوقع لعمره الصفي.',
    modDesc:
      'يواجه تعثراً متوسطاً في الطلاقة أو فك الكلمات غير المألوفة يحتاج لمساندة صفية.',
    highDesc:
      'مؤشرات مرتفعة لصعوبة القراءة وفك الرموز تستدعي خطة دعم قرائي موجّهة.',
    recommendations: {
      low: ['الاستمرار في القراءة الإثرائية اليومية لمدة 15 دقيقة.'],
      moderate: [
        'استخدام مساطر القراءة لتظليل الأسطر.',
        'التركيز على تفكيك الكلمات إلى مقاطع صوتية قبل القراءة المسترسلة.',
      ],
      high: [
        'خطة تدخل فردية للوعي الصوتي والفونيمي.',
        'إتاحة خيار القراءة المسموعة لأسئلة الاختبارات التحريرية.',
        'منح وقت إضافي (25%) في المهام القرائية.',
      ],
    },
    accommodations: {
      moderate: [
        'مساطر تظليل الأسطر ونصوص بخط أوضح.',
        'تفكيك الكلمات إلى مقاطع قبل القراءة المسترسلة.',
      ],
      high: [
        'قراءة مسموعة لأسئلة الاختبارات التحريرية.',
        'وقت إضافي بنسبة 25% في المهام القرائية.',
      ],
    },
  },
  dysgraphia: {
    label: 'الكتابة والتعبير الكتابي',
    lowDesc: 'التآزر البصري الحركي والرسم الكتابي متناسق ومقروء.',
    modDesc: 'إجهاد سريع عند الكتابة مع تفاوت في حجم الحروف وأخطاء إملائية متكررة.',
    highDesc:
      'صعوبة واضحة في السيطرة على رسم الحروف والالتزام بالسطر والتعبير التحريري.',
    recommendations: {
      low: ['تشجيع الكتابة الحرة والتنظيم الدفتري.'],
      moderate: [
        'استخدام مقابض أقلام مثلثة لتقليل إجهاد الأصابع.',
        'توفير دفاتر بأسطر متباعدة ومحددة الحواف.',
      ],
      high: [
        'تقليل كمية النقل من السبورة والاعتماد على أوراق عمل جاهزة.',
        'قبول الإجابات الشفوية لتقييم الفهم دون الخصم على سوء الخط.',
        'تمارين تآزر بصري حركي وتعديل مسكة القلم.',
      ],
    },
    accommodations: {
      moderate: [
        'مقابض أقلام مثلثة ودفاتر بأسطر متباعدة.',
      ],
      high: [
        'أوراق عمل جاهزة بدلاً من النقل الطويل من السبورة.',
        'قبول الإجابة الشفوية عند تقييم الفهم دون الخصم على الخط.',
      ],
    },
  },
  dyscalculia: {
    label: 'الحساب والمفاهيم الرقمية',
    lowDesc: 'الإدراك العددي والحقائق الرياضية التلقائية مستقرة ومناسبة لمستواه.',
    modDesc: 'بطء في استحضار العمليات البسيطة مع اعتماد متزايد على العد الحسي المباشر.',
    highDesc:
      'صعوبة واضحة في فهم القيمة المنزلية والرموز الرياضية وتسلسل خطوات المسائل.',
    recommendations: {
      low: ['ألعاب رقمية تعزز السرعة الحسابية الذهنية.'],
      moderate: [
        'استخدام الوسائل المحسوسة (مثل المكعبات والخرز) لتثبيت المفاهيم.',
        'توفير جدول الضرب أو خط الأعداد كمرجع بصري مرئي.',
      ],
      high: [
        'تفكيك المسائل الرياضية اللفظية إلى خطوات بصرية ملونة.',
        'السماح باستخدام الآلات الحاسبة أو الوسائل المساعدة في المسائل المعقدة.',
        'تدريب مكثف على الإدراك العددي والربط بين الرمز والمقدار.',
      ],
    },
    accommodations: {
      moderate: [
        'وسائل محسوسة وخط أعداد أو جدول ضرب كمرجع بصري.',
      ],
      high: [
        'تفكيك المسألة اللفظية إلى خطوات بصرية.',
        'السماح بوسيلة مساعدة في المسائل متعددة الخطوات.',
      ],
    },
  },
  executive_adhd: {
    label: 'الانتباه والتنظيم الصفي',
    lowDesc: 'القدرة على الاستمرارية وإكمال المهام وضبط الحركة جيدة ومستقرة.',
    modDesc: 'تشتت وانشغال بالمشتتات البيئية مع تململ حركي يحتاج لتذكير وتوجيه.',
    highDesc:
      'مؤشرات واضحة لصعوبة التركيز وإكمال المهام والتنظيم داخل الصف.',
    recommendations: {
      low: ['الحفاظ على بيئة دراسية هادئة ومنظمة.'],
      moderate: [
        'تقسيم الواجبات الطويلة إلى فترات عمل قصيرة (20 دقيقة) يتخللها فواصل حركة.',
        'الجلوس في المقاعد الأمامية بعيداً عن النوافذ والأبواب.',
      ],
      high: [
        'استخدام الجداول البصرية لتنظيم الأدوات والواجبات اليومية.',
        'إعطاء تعليمات فردية قصيرة ومباشرة خطوة بخطوة.',
        'استراتيجيات تفريغ الطاقة الحركية (مثل كرات الضغط أو مهام الحركة المنظمة).',
      ],
    },
    accommodations: {
      moderate: [
        'مقعد أمامي بعيد عن النوافذ، وواجبات مقسّمة لفترات قصيرة.',
      ],
      high: [
        'تعليمات قصيرة خطوة بخطوة مع جدول بصري للأدوات والواجبات.',
        'فرص حركة منظمة أو أداة تهدئة أثناء العمل الطويل.',
      ],
    },
  },
};

function clampScore(raw: number): number {
  return Math.min(2, Math.max(0, Number(raw) || 0));
}

export function learningLevelFromScore(score: number): {
  level: LearningNeedLevel;
  levelText: string;
} {
  if (score >= LEARNING_SCREENING_THRESHOLDS.domainHigh) {
    return { level: 'high', levelText: 'احتياج مرتفع / مؤشر صعوبة واضح' };
  }
  if (score >= LEARNING_SCREENING_THRESHOLDS.domainModerate) {
    return { level: 'moderate', levelText: 'احتياج متوسط / يتطلب متابعة' };
  }
  return { level: 'low', levelText: 'مستقر' };
}

function collectClassroomAccommodations(
  domainResults: Record<AcademicDomain, DomainResult>
): string[] {
  const items: string[] = [];
  for (const domain of DOMAIN_ORDER) {
    const row = domainResults[domain];
    if (row.level === 'low') continue;
    const extra = DOMAIN_METADATA[domain].accommodations[row.level];
    for (const tip of extra) {
      if (!items.includes(tip)) items.push(tip);
    }
  }
  return items;
}

export function evaluateLearningScreening(
  answers: Record<string, number>
): LearningScreeningResult {
  const domainScores: Record<AcademicDomain, number> = {
    dyslexia: 0,
    dysgraphia: 0,
    dyscalculia: 0,
    executive_adhd: 0,
  };

  for (const question of LEARNING_SCREENING_QUESTIONS) {
    domainScores[question.domain] += clampScore(answers[question.id] ?? 0);
  }

  const domainResults = {} as Record<AcademicDomain, DomainResult>;

  for (const domain of DOMAIN_ORDER) {
    const score = domainScores[domain];
    const { level, levelText } = learningLevelFromScore(score);
    const meta = DOMAIN_METADATA[domain];
    const description =
      level === 'high'
        ? meta.highDesc
        : level === 'moderate'
          ? meta.modDesc
          : meta.lowDesc;

    domainResults[domain] = {
      domain,
      label: meta.label,
      score,
      maxScore: LEARNING_DOMAIN_MAX,
      level,
      levelText,
      description,
      initialRecommendations: meta.recommendations[level],
    };
  }

  const totalScore = DOMAIN_ORDER.reduce(
    (sum, domain) => sum + domainScores[domain],
    0
  );
  const hasHigh = DOMAIN_ORDER.some(
    (domain) => domainResults[domain].level === 'high'
  );
  const hasModerate = DOMAIN_ORDER.some(
    (domain) => domainResults[domain].level === 'moderate'
  );

  let overallRiskLevel: LearningNeedLevel = 'low';
  let overallRiskText = 'المؤشرات الأكاديمية العامة مستقرة حالياً';

  if (totalScore >= LEARNING_SCREENING_THRESHOLDS.overallHigh || hasHigh) {
    overallRiskLevel = 'high';
    overallRiskText =
      'مؤشرات دالة على حاجة دعم أكاديمي أوضح، ويُفضّل إكمال التقييم التربوي';
  } else if (
    totalScore >= LEARNING_SCREENING_THRESHOLDS.overallModerate ||
    hasModerate
  ) {
    overallRiskLevel = 'moderate';
    overallRiskText =
      'مؤشرات متوسطة تتطلب دعماً تعليمياً صفياً ومتابعة مستمرة';
  }

  return {
    totalScore,
    maxTotalScore: LEARNING_TOTAL_MAX,
    overallRiskLevel,
    overallRiskText,
    domainResults,
    classroomAccommodations: collectClassroomAccommodations(domainResults),
    recommendFullAssessment: overallRiskLevel === 'high',
    completedAt: new Date().toISOString(),
    screeningType: 'academic_sld',
  };
}

export function getLearningClassroomAccommodations(
  result: LearningScreeningResult
): string[] {
  return result.classroomAccommodations;
}

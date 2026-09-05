import {
  ACADEMIC_FULL_QUESTIONS,
  type AcademicFullDomain,
  type ComprehensiveQuestion,
} from './academicFullQuestions';

export type AcademicDomainKey = AcademicFullDomain;

export type ComprehensiveSeverity = 'normal' | 'mild' | 'moderate' | 'severe';

export type ComprehensiveDomainReport = {
  domain: AcademicDomainKey;
  label: string;
  labelEn: string;
  score: number;
  maxScore: number;
  percentage: number;
  severity: ComprehensiveSeverity;
  severityLabelAr: string;
  severityLabelEn: string;
  identifiedWeaknesses: string[];
  smartGoals: string[];
  classroomAccommodations: string[];
};

export type ComprehensiveAssessmentReport = {
  studentName?: string;
  assessmentDate: string;
  totalScore: number;
  maxTotalScore: number;
  overallPercentage: number;
  primaryDiagnosisAr: string;
  primaryDiagnosisEn: string;
  domains: Record<AcademicDomainKey, ComprehensiveDomainReport>;
  individualEducationPlan: {
    targetTerm: string;
    priorityDomain: string;
    smartGoalsList: string[];
    examAccommodations: string[];
  };
};

const DOMAIN_KEYS: AcademicDomainKey[] = [
  'dyslexia',
  'dysgraphia',
  'dyscalculia',
  'executive_adhd',
];

const DOMAIN_DATA: Record<
  AcademicDomainKey,
  {
    label: string;
    labelEn: string;
    goals: string[];
    accommodations: string[];
  }
> = {
  dyslexia: {
    label: 'القراءة والوعي الفونيمي',
    labelEn: 'Reading & Phonemic Awareness',
    goals: [
      'أن يفكك الطالب الكلمات الثلاثية والرباعية إلى مقاطع صوتية بنسبة دقة 85%.',
      'أن يقرأ الطالب نصاً مألوفاً من 50 كلمة بطلاقة وبمعدل لا يتجاوز خطأين.',
      'أن يستخرج الطالب الفكرة الرئيسة وإجابتين مباشرتين من فقرة مقروءة بنجاح.',
    ],
    accommodations: [
      'إتاحة قارئ بشري أو قارئ صوتي رقمي لنصوص الاختبارات.',
      'منح وقت إضافي قدره 25% في مهام القراءة والامتحانات التحريرية.',
      'استخدام مسطرة القراءة لتظليل الأسطر وتقليل التشتت البصري.',
    ],
  },
  dysgraphia: {
    label: 'الكتابة والتعبير التحريري',
    labelEn: 'Writing & Written Expression',
    goals: [
      'أن يكتب الطالب الحروف المتشابهة على السطر مع مراعاة الحجم والاتجاه بدقة 80%.',
      'أن يوظف المهارات الإملائية الأساسية (المدود والتنوين) في جمل قصيرة بإتقان 80%.',
      'أن يصوغ الطالب 3 جمل تامة المعنى ومترابطة للتعبير عن صورة محددة.',
    ],
    accommodations: [
      'تقليل متطلبات النسخ والنقل من السبورة والاعتماد على أوراق عمل مطبوعة.',
      'استخدام مقبض قلم مريح أو السماح بالكتابة على لوحة مفاتيح حاسوبية.',
      'عدم الخصم على أخطاء سوء الخط في اختبارات المواد العلمية.',
    ],
  },
  dyscalculia: {
    label: 'الحساب والمفاهيم الرياضية',
    labelEn: 'Numeracy & Mathematical Concepts',
    goals: [
      'أن يربط الطالب القيمة المكانية (آحاد/عشرات) للأعداد حتى 100 بنسبة نجاح 90%.',
      'أن يسترجع الطالب حقائق الجمع والطرح الأساسية ضمن الرقم 20 ذهنياً.',
      'أن يحل الطالب مسائل رياضية لفظية من خطوة واحدة باستخدام الوسائل المحسوسة.',
    ],
    accommodations: [
      'السماح باستخدام خط الأعداد وجدول الضرب كمرجع بصري أثناء الحل.',
      'توفير وسائل ملموسة (خرز، مكعبات دينز) لتجسيد المفاهيم الرياضية.',
      'تفكيك المسائل اللفظية الطويلة إلى خطوات بصرية ملونة.',
    ],
  },
  executive_adhd: {
    label: 'الانتباه والوظائف التنفيذية',
    labelEn: 'Attention & Executive Functions',
    goals: [
      'أن يستمر الطالب في أداء المهمة التعليمية لمدة 15 دقيقة متواصلة دون مقاطعة.',
      'أن يتبع الطالب تعليمات مركبة من خطوتين متتاليتين بالاعتماد على جدول بصري.',
      'أن ينتظر الطالب دوره في المناقشات الصفية برفع اليد في 4 من أصل 5 محاولات.',
    ],
    accommodations: [
      'إجلاس الطالب في المقاعد الأمامية بالقرب من المعلم وبعيداً عن الأبواب والنوافذ.',
      'تقسيم المهام الطويلة إلى أجزاء صغيرة تتخللها فترات حركة منظمة.',
      'استخدام جدول مهام بصري لتنظيم الأدوات والمواعيد المدرسية.',
    ],
  },
};

function clampScore(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(3, Math.round(n)));
}

function classifySeverity(score: number): {
  severity: ComprehensiveSeverity;
  severityLabelAr: string;
  severityLabelEn: string;
} {
  if (score >= 18) {
    return {
      severity: 'severe',
      severityLabelAr: 'احتياج تدخلي مكثف',
      severityLabelEn: 'Intensive Support Need',
    };
  }
  if (score >= 11) {
    return {
      severity: 'moderate',
      severityLabelAr: 'احتياج تدخلي متوسط',
      severityLabelEn: 'Moderate Support Need',
    };
  }
  if (score >= 6) {
    return {
      severity: 'mild',
      severityLabelAr: 'احتياج مساندة خفيفة ومتابعة',
      severityLabelEn: 'Mild Support Need',
    };
  }
  return {
    severity: 'normal',
    severityLabelAr: 'ضمن المعدل المتوقع',
    severityLabelEn: 'Within Expected Range',
  };
}

export function evaluateComprehensiveAssessment(
  answers: Record<string, number>,
  studentName = 'الطالب / الطالبة'
): ComprehensiveAssessmentReport {
  const domainScores: Record<AcademicDomainKey, number> = {
    dyslexia: 0,
    dysgraphia: 0,
    dyscalculia: 0,
    executive_adhd: 0,
  };

  const domainWeaknesses: Record<AcademicDomainKey, string[]> = {
    dyslexia: [],
    dysgraphia: [],
    dyscalculia: [],
    executive_adhd: [],
  };

  const domainCounts: Record<AcademicDomainKey, number> = {
    dyslexia: 0,
    dysgraphia: 0,
    dyscalculia: 0,
    executive_adhd: 0,
  };

  ACADEMIC_FULL_QUESTIONS.forEach((q: ComprehensiveQuestion) => {
    const score = clampScore(answers[q.id]);
    domainScores[q.domain] += score;
    domainCounts[q.domain] += 1;
    if (score >= 2) {
      domainWeaknesses[q.domain].push(q.skillName);
    }
  });

  const domainsReport = {} as Record<AcademicDomainKey, ComprehensiveDomainReport>;

  DOMAIN_KEYS.forEach((dKey) => {
    const score = domainScores[dKey];
    const maxScore = domainCounts[dKey] * 3;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const severityInfo = classifySeverity(score);

    domainsReport[dKey] = {
      domain: dKey,
      label: DOMAIN_DATA[dKey].label,
      labelEn: DOMAIN_DATA[dKey].labelEn,
      score,
      maxScore,
      percentage,
      ...severityInfo,
      identifiedWeaknesses: domainWeaknesses[dKey],
      smartGoals: DOMAIN_DATA[dKey].goals,
      classroomAccommodations: DOMAIN_DATA[dKey].accommodations,
    };
  });

  const totalScore = Object.values(domainScores).reduce((a, b) => a + b, 0);
  const maxTotalScore = ACADEMIC_FULL_QUESTIONS.length * 3;
  const overallPercentage =
    maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;

  const ranked = Object.values(domainsReport).sort((a, b) => b.score - a.score);
  const priorityDomainObj = ranked[0];
  const severeDomains = ranked.filter((d) => d.severity === 'severe');
  const moderateDomains = ranked.filter((d) => d.severity === 'moderate');

  let primaryDiagnosisAr = 'ملف نمائي وأكاديمي متوازن ومستقر';
  let primaryDiagnosisEn = 'Balanced Developmental & Academic Profile';

  if (severeDomains.length > 0 || moderateDomains.length >= 2) {
    primaryDiagnosisAr = `مؤشرات تربوية مرتفعة في محور ${priorityDomainObj.label} تستوجب خطة دعم فردية ومتابعة صفية`;
    primaryDiagnosisEn = `Elevated educational indicators in ${priorityDomainObj.labelEn} requiring an individual support plan`;
  } else if (moderateDomains.length === 1 || ranked.some((d) => d.severity === 'mild')) {
    primaryDiagnosisAr = `احتياج مساندة تربوية في محور ${priorityDomainObj.label} مع متابعة دورية`;
    primaryDiagnosisEn = `Educational support need in ${priorityDomainObj.labelEn} with ongoing monitoring`;
  }

  const allAccommodations = Object.values(domainsReport)
    .filter((d) => d.severity === 'severe' || d.severity === 'moderate')
    .flatMap((d) => d.classroomAccommodations);

  return {
    studentName,
    assessmentDate: new Date().toISOString(),
    totalScore,
    maxTotalScore,
    overallPercentage,
    primaryDiagnosisAr,
    primaryDiagnosisEn,
    domains: domainsReport,
    individualEducationPlan: {
      targetTerm: 'الفصل الدراسي القادم',
      priorityDomain: priorityDomainObj.label,
      smartGoalsList: priorityDomainObj.smartGoals,
      examAccommodations:
        allAccommodations.length > 0
          ? allAccommodations
          : ['تطبيق إجراءات الاختبار الصفية المعتادة.'],
    },
  };
}

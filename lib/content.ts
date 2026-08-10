/**
 * محتوى المنصة الرسمي — مُجمَّع من المصادر الأقوى فقط.
 * المصدر الأساسي: data/taalof_criteria.json + سياسة reportEngine التربوية.
 */

import {
  CLASSIFICATIONS,
  CRITERIA_LIST,
  DOMAINS,
  TAALOF_CRITERIA,
} from '@/types/taalof';

export const BRAND = {
  name: 'تآلف',
  nameEn: 'Taaluf',
  version: TAALOF_CRITERIA.version,
  primary: '#2D8B5A',
  criteriaCount: CRITERIA_LIST.length,
  domainCount: DOMAINS.length,
} as const;

/** إخلاء مسؤولية ثابت — من reportEngine (أقوى صياغة تربوية) */
export const DISCLAIMER_AR =
  'تآلف أداة توجيهية تربوية مبنية على مؤشرات سلوكية قابلة للملاحظة. لا تُعد تشخيصاً طبياً أو نفسياً، وتقدّم استراتيجيات قابلة للتطبيق في المنزل والمدرسة.';

export const CLOSING_NEXT_STEP_AR =
  'الخطوة التالية المقترحة: تطبيق استراتيجية تربوية تدريجية واحدة في المنزل والمدرسة لمدة أسبوعين، مع توثيق بسيط للتقدّم.';

export const HOME = {
  eyebrow: `${BRAND.criteriaCount} مؤشراً · ${BRAND.domainCount} مجالات · إصدار ${BRAND.version}`,
  headline: 'ملامح سلوكية واضحة… واستراتيجيات يمكن تطبيقها غداً',
  support:
    'منصة تقييم تربوي لأطفال التوحد وصعوبات التعلم — بدون تشخيص طبي، وبتوصيات منزلية ومدرسية دقيقة.',
  ctaPrimary: 'دخول المختص',
  ctaSecondary: 'استكشف اللوحة',
} as const;

export const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'تسجيل الطفل',
    body: 'اسم وتاريخ ميلاد لحساب العمر وربط التقييمات اللاحقة.',
  },
  {
    step: '02',
    title: 'تقييم 24 مؤشراً',
    body: 'ثمانية مجالات تخصصية بدرجة 0–3 لكل مؤشر، مع ملاحظات ودليل مرئي.',
  },
  {
    step: '03',
    title: 'نتيجة وتصنيف',
    body: 'نسبة مئوية وتصنيف (طبيعي → شديد جداً) مع رسم شعاعي للمجالات.',
  },
  {
    step: '04',
    title: 'تحليل وتقرير',
    body: 'تحليل تربوي بالذكاء الاصطناعي وتقرير PDF عربي جاهز للمتابعة.',
  },
] as const;

export const VALUE_POINTS = [
  {
    title: 'Rubric معتمد v2.0',
    body: '24 مؤشراً موزّعة على 8 مجالات مع مستويات وصفية وتوصية لكل بند.',
  },
  {
    title: 'لغة تربوية آمنة',
    body: 'ملامح واستراتيجيات — بلا تشخيص طبي أو إحالات نفسية مباشرة.',
  },
  {
    title: 'متابعة قابلة للقياس',
    body: 'مقارنة مع التقييم السابق، موعد قادم مقترح، وأهداف تطبيق أسبوعية.',
  },
] as const;

export const DASHBOARD = {
  title: 'لوحة المختص',
  subtitle: `مسار التقييم الرسمي لمنصة ${BRAND.name} — ${BRAND.criteriaCount} مؤشراً عبر ${BRAND.domainCount} مجالات`,
  actions: [
    {
      href: '/dashboard/students',
      title: 'قائمة الأطفال',
      body: 'عرض الطلاب، آخر تقييم، ومستوى الحاجة للدعم.',
      cta: 'افتح القائمة',
      tone: 'primary' as const,
    },
    {
      href: '/dashboard/assessments/new',
      title: 'تقييم تفاعلي',
      body: 'درجات المجالات، الرادار، التحليل التربوي، والتقرير العربي.',
      cta: 'ابدأ التقييم',
      tone: 'secondary' as const,
    },
    {
      href: '/dashboard/screening',
      title: 'الفرز الأولي',
      body: '12 بنداً عبر أربعة أبعاد قبل التقييم الكامل.',
      cta: 'ابدأ الفرز',
      tone: 'secondary' as const,
    },
    {
      href: '/dashboard/games',
      title: 'ألعاب التقييم',
      body: 'التقليد والتتبع البصري بتسجيل يدوي من الأخصائي.',
      cta: 'افتح الألعاب',
      tone: 'secondary' as const,
    },
  ],
} as const;

export const ASSESSMENT_UI = {
  title: 'التقييم التفاعلي',
  subtitle: 'قيّم كل مؤشر وفق الملاحظة المباشرة — 0 مستقر · 3 شديد جداً',
  scoreHelp: 'الدرجة الأعلى تعني حاجة دعم أعلى — وليس تشخيصاً.',
  actionsTitle: 'ملخص وإجراءات',
  resultTitle: 'النتيجة والتصنيف',
  radarTitle: 'متوسط المجالات',
  aiTitle: 'تحليل تربوي (ذكاء اصطناعي)',
} as const;

export const LOGIN_COPY = {
  title: `دخول ${BRAND.name}`,
  subtitle: 'مساحة المختصين التربويين — تقييم ومتابعة وتقارير',
  hint: 'حساب تجريبي: specialist@taaluf.local',
} as const;

export const STUDENT_COPY = {
  title: 'تسجيل طالب جديد',
  subtitle: 'الخطوة 1 — الاسم وتاريخ الميلاد إلزاميان لحساب العمر وربط التقييم',
  submit: 'حفظ والانتقال للتقييم',
} as const;

export const DOMAIN_META = DOMAINS.map((domain) => {
  const count = CRITERIA_LIST.filter((c) => c.domain === domain).length;
  return { domain, count };
});

export const CLASSIFICATION_BANDS = CLASSIFICATIONS.map((c) => ({
  label: c.label,
  range: `${c.min}–${c.max}%`,
  color: c.color,
}));

export const NAV: Array<{
  href: string;
  label: string;
  primary?: boolean;
}> = [
  { href: '/dashboard', label: 'الرئيسية' },
  { href: '/dashboard/students', label: 'الأطفال' },
  { href: '/dashboard/goals', label: 'الأهداف' },
  { href: '/dashboard/messages', label: 'الرسائل' },
  { href: '/dashboard/games', label: 'ألعاب' },
  { href: '/dashboard/assessments/new', label: 'تقييم جديد', primary: true },
];

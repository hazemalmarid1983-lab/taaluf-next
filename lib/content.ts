/**
 * محتوى المنصة الرسمي — مُجمَّع من المصادر الأقوى فقط.
 * المصدر الأساسي: data/taalof_criteria_v3.json + سياسة reportEngine التربوية.
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
  primary: '#2E7D8E',
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
    title: 'فرز ثم استبيان ثم ألعاب',
    body: 'مسار ولي الأمر بالترتيب: 12 سؤالاً، ثم ملاحظات يومية، ثم نشاطان تفاعليان.',
  },
  {
    step: '03',
    title: 'تقييم 40 مؤشراً',
    body: 'أربعة محاور كبرى بدرجة 0–3 لكل مؤشر، مع وصف إجرائي لكل خيار.',
  },
  {
    step: '04',
    title: 'تقرير وخطة',
    body: 'دمج المصادر وتحليل تربوي وتقرير PDF عربي جاهز للمتابعة.',
  },
] as const;

export const VALUE_POINTS = [
  {
    title: 'Rubric معتمد',
    body: '40 مؤشراً موزّعة بالتساوي على 4 محاور مع مستويات وصفية وهدف SMART لكل بند.',
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
      href: '/dashboard/pathways',
      title: 'الفرز الأولي',
      body: 'اختر المسار النمائي أو الأكاديمي، ثم أجب عن 12 بنداً لاستخراج خارطة أولية.',
      cta: 'ابدأ الفرز',
      tone: 'secondary' as const,
    },
    {
      href: '/dashboard/games',
      title: 'مركز الأنشطة',
      body: 'الغرفة الحسية التفاعلية، وسلسلة مطابقة الصور والتعريف الصوتي.',
      cta: 'افتح المركز',
      tone: 'secondary' as const,
    },
    {
      href: '/dashboard/assessments/new',
      title: 'التقييم التربوي',
      body: '40 مؤشراً، الدمج مع الأهل والألعاب، التحليل، والتقرير العربي.',
      cta: 'افتح التقييم',
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
  title: 'تسجيل حالة جديدة',
  subtitle: 'أدخل اسم الطفل وتاريخ الميلاد لفتح ملف الحالة وأهداف العمل',
  submit: 'حفظ الحالة',
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
  { href: '/dashboard', label: 'حالاتي' },
  { href: '/dashboard/students/new', label: 'حالة جديدة', primary: true },
  { href: '/dashboard/messages', label: 'الرسائل' },
];

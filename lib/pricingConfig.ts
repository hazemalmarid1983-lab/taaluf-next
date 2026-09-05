/**
 * المرجع التشغيلي الرسمي لأسعار تآلف — سلطنة عُمان.
 * المصدر الوحيد للعرض وبوابات الدفع.
 */

export type PricingTarget = 'parent' | 'specialist' | 'center' | 'clinic';
export type PricingPeriod =
  | 'one_time'
  | 'half_year'
  | 'annual'
  | 'monthly'
  | 'per_case';

export interface PricingPlan {
  id: string;
  name: string;
  target: PricingTarget;
  period: PricingPeriod;
  priceOMR: number;
  priceJOD: number;
  priceUSD: number;
  features: string[];
  recommended?: boolean;
}

export interface SpecialistBundle extends PricingPlan {
  casesCount: number;
  costPerCaseOMR: number;
}

export interface CenterPlan {
  id: string;
  name: string;
  target: 'center';
  capacity: string;
  priceMonthlyOMR: number;
  priceAnnualOMR: number;
  priceMonthlyUSD: number;
  priceAnnualUSD: number;
  features: string[];
  recommended?: boolean;
}

export interface ClinicLicense {
  monthlyOMR: number;
  annualOMR: number;
  monthlyUSD: number;
  annualUSD: number;
  affiliateSharePercent: number;
}

export const TAALUF_PRICING = {
  parents: [
    {
      id: 'parent_single',
      name: 'التقييم المنفرد (Canon 4.0)',
      target: 'parent' as const,
      period: 'one_time' as const,
      priceOMR: 25,
      priceJOD: 46,
      priceUSD: 65,
      features: [
        'تقرير التقييم التربوي الشامل (Canon 4.0)',
        'بطاقة التسهيلات والدعم الصفي للمعلم (A4)',
        'خطة أهداف SMART الأولية',
        'ملخص الإحالة الطبي السريري (نسخة منفردة)',
      ],
    },
    {
      id: 'parent_half_year',
      name: 'باقة المتابعة نصف السنوية',
      target: 'parent' as const,
      period: 'half_year' as const,
      priceOMR: 45,
      priceJOD: 83,
      priceUSD: 117,
      features: [
        '2 تقييم شامل (خط الأساس + مراجعة بعد 3-6 أشهر)',
        'لوحة تتبع إنجاز الأهداف (0% - 100%)',
        'مقارنة رادارية ثنائية لقياس التحسن',
        'وصول كامل لمجتمع تآلف والأنشطة الأسبوعية',
      ],
    },
    {
      id: 'parent_annual',
      name: 'باقة الرعاية السنوية الشاملة',
      target: 'parent' as const,
      period: 'annual' as const,
      priceOMR: 75,
      priceJOD: 138,
      priceUSD: 195,
      recommended: true,
      features: [
        '4 تقييمات دورية (ربع سنوية مع الفصول الدراسية)',
        'سجل نمائي تراكمي يربط الأهل والمدرسة والطبيب',
        'تحديث تلقائي لخطة الأهداف بعد كل دورة',
        '4 بطاقات دعم صفي محدثة للمعلم',
        'عضوية دائمة في دوائر المجتمع المنزلي',
      ],
    },
  ] satisfies PricingPlan[],

  specialistBundles: [
    {
      id: 'spec_1',
      name: 'رصيد حالة واحدة',
      target: 'specialist' as const,
      period: 'per_case' as const,
      priceOMR: 7,
      priceJOD: 13,
      priceUSD: 18,
      casesCount: 1,
      costPerCaseOMR: 7,
      features: ['تقييم حالة واحدة عبر Canon 4.0', 'تقرير وبطاقة صفية لهذه الحالة'],
    },
    {
      id: 'spec_5',
      name: 'باقة 5 حالات (Starter)',
      target: 'specialist' as const,
      period: 'per_case' as const,
      priceOMR: 30,
      priceJOD: 55,
      priceUSD: 78,
      casesCount: 5,
      costPerCaseOMR: 6,
      recommended: true,
      features: [
        'رصيد 5 حالات',
        'تكلفة الحالة 6 ر.ع.',
        'تقارير وبطاقات غير محدودة للرصيد',
      ],
    },
    {
      id: 'spec_10',
      name: 'باقة 10 حالات (Pro)',
      target: 'specialist' as const,
      period: 'per_case' as const,
      priceOMR: 50,
      priceJOD: 92,
      priceUSD: 130,
      casesCount: 10,
      costPerCaseOMR: 5,
      features: [
        'رصيد 10 حالات',
        'تكلفة الحالة 5 ر.ع.',
        'الأنسب للممارسة المستقلة النشطة',
      ],
    },
  ] satisfies SpecialistBundle[],

  centers: [
    {
      id: 'center_bronze',
      name: 'مركز برونزي (Micro)',
      target: 'center' as const,
      capacity: 'حتى 10 طلاب نشطين',
      priceMonthlyOMR: 35,
      priceAnnualOMR: 350,
      priceMonthlyUSD: 91,
      priceAnnualUSD: 910,
      features: [
        'حساب لـ 2 أخصائيين',
        'تقارير وبطاقات غير محدودة لـ 10 طلاب',
        'شعار المركز على التقارير',
      ],
    },
    {
      id: 'center_silver',
      name: 'مركز فضي (Growth)',
      target: 'center' as const,
      capacity: 'حتى 25 طالباً نشطاً',
      priceMonthlyOMR: 70,
      priceAnnualOMR: 700,
      priceMonthlyUSD: 182,
      priceAnnualUSD: 1820,
      recommended: true,
      features: [
        'حساب لـ 5 أخصائيين',
        'لوحة إشراف إدارية للمركز',
        'شعار المركز + دعم فني مخصص',
      ],
    },
    {
      id: 'center_gold',
      name: 'مركز ذهبي (Enterprise)',
      target: 'center' as const,
      capacity: 'حتى 60 طالباً نشطاً',
      priceMonthlyOMR: 140,
      priceAnnualOMR: 1400,
      priceMonthlyUSD: 364,
      priceAnnualUSD: 3640,
      features: [
        'حسابات أخصائيين غير محدودة',
        'تصدير تقارير الجودة والامتثال',
        'ربط مخصص وتدريب الكادر',
      ],
    },
  ] satisfies CenterPlan[],

  clinicLicense: {
    monthlyOMR: 25,
    annualOMR: 250,
    monthlyUSD: 65,
    annualUSD: 650,
    affiliateSharePercent: 20,
  } satisfies ClinicLicense,
};

export const PERIOD_LABEL_AR: Record<PricingPeriod, string> = {
  one_time: 'دفعة واحدة',
  half_year: 'كل 6 أشهر',
  annual: 'سنوياً',
  monthly: 'شهرياً',
  per_case: 'حسب الحالة',
};

const PLAN_ALIASES: Record<string, string> = {
  assessment: 'parent_single',
  monitoring: 'parent_half_year',
  specialist: 'spec_5',
  specialistAccess: 'spec_5',
};

export function resolvePricingPlanId(planId: string): string {
  return PLAN_ALIASES[planId] || planId;
}

export function listQuotedPlans(): PricingPlan[] {
  return [
    ...TAALUF_PRICING.parents,
    ...TAALUF_PRICING.specialistBundles,
  ];
}

export function findQuotedPlan(planId: string): PricingPlan | undefined {
  const id = resolvePricingPlanId(planId);
  return listQuotedPlans().find((p) => p.id === id);
}

export function getOfficialPrice(
  planId: string,
  currency: string
): number {
  if (planId === 'free') return 0;
  const plan = findQuotedPlan(planId);
  if (!plan) return 0;
  const c = currency.toUpperCase();
  if (c === 'OMR') return plan.priceOMR;
  if (c === 'JOD') return plan.priceJOD;
  if (c === 'USD') return plan.priceUSD;
  return 0;
}

export function getPlanDisplayName(planId: string): string {
  const plan = findQuotedPlan(planId);
  if (plan) return plan.name;
  if (planId === 'free') return 'الفرز الأولي';
  return 'باقة تآلف';
}

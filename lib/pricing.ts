/**
 * سياسة التسعير الموحد — الأساس بالدولار الأمريكي (الخيار 1).
 * التحويل للعملات المحلية للعرض/Tap.
 */

export const PRICING_TIERS = {
  free: {
    id: 'free',
    name_ar: 'الفرز الأولي',
    name_en: 'Initial Screening',
    priceUsd: 0,
    features_ar: [
      'فرز أولي (12 سؤالاً)',
      'نتائج فورية',
      'توصية بالخطوة التالية',
    ],
  },
  assessment: {
    id: 'assessment',
    name_ar: 'تقييم شامل',
    name_en: 'Comprehensive Assessment',
    priceUsd: 39,
    features_ar: [
      'استبيان أخصائي (36 معياراً)',
      'استبيان أهل (20 سؤالاً)',
      'ألعاب تفاعلية',
      'تقرير شامل + PDF',
      'خطة أهداف تربوية',
    ],
  },
  monitoring: {
    id: 'monitoring',
    name_ar: 'متابعة شهرية',
    name_en: 'Monthly Monitoring',
    priceUsd: 15,
    features_ar: [
      'تقييمات متابعة',
      'تتبع الأهداف',
      'ملاحظات الأخصائي',
      'تقارير شهرية',
      'رسائل مع الأخصائي',
    ],
  },
  specialist: {
    id: 'specialist',
    name_ar: 'بوابة الأخصائي',
    name_en: 'Specialist Portal',
    priceUsd: 49,
    features_ar: [
      'إدارة عدد غير محدود من الأطفال',
      'تقارير وتقييمات',
      'مكتبة المعايير',
      'جدولة الجلسات',
    ],
  },
} as const;

export type PricingTierId = keyof typeof PRICING_TIERS;

/** مضاعفات التحويل من الدولار الأمريكي */
export const CURRENCY_RATES_FROM_USD: Record<string, number> = {
  USD: 1,
  SAR: 3.75,
  AED: 3.67,
  EGP: 48,
};

export const SUPPORTED_CURRENCIES = ['USD', 'SAR', 'AED', 'EGP'] as const;

/** توافق مع الاستدعاءات القديمة */
export const CURRENCY_RATES = CURRENCY_RATES_FROM_USD;

export function getPrice(tierId: string, currency: string): number {
  const tier = PRICING_TIERS[tierId as PricingTierId];
  if (!tier) return 0;
  const rate = CURRENCY_RATES_FROM_USD[currency] || 1;
  return Math.round(tier.priceUsd * rate);
}

/** للتوافق مع كود قديم يقرأ tier.price */
export function getTierBaseUsd(tierId: string): number {
  const tier = PRICING_TIERS[tierId as PricingTierId];
  return tier?.priceUsd ?? 0;
}

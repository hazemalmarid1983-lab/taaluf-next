export const PRICING_TIERS = {
  free: {
    id: 'free',
    name_ar: 'الفرز الأولي',
    name_en: 'Initial Screening',
    price: 0,
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
    price: 149,
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
    price: 49,
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
    price: 199,
    features_ar: [
      'إدارة عدد غير محدود من الأطفال',
      'تقارير وتقييمات',
      'مكتبة المعايير',
      'جدولة الجلسات',
    ],
  },
} as const;

export type PricingTierId = keyof typeof PRICING_TIERS;

export const CURRENCY_RATES: Record<string, number> = {
  SAR: 1,
  AED: 0.98,
  EGP: 13.2,
  USD: 0.27,
};

export const SUPPORTED_CURRENCIES = ['SAR', 'AED', 'EGP', 'USD'] as const;

export function getPrice(tierId: string, currency: string): number {
  const tier = PRICING_TIERS[tierId as PricingTierId];
  if (!tier) return 0;
  const rate = CURRENCY_RATES[currency] || 1;
  return Math.round(tier.price * rate);
}

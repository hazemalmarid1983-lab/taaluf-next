/**
 * طبقة التوافق مع بوابات الدفع والشاشات.
 * الأسعار الرسمية من lib/pricingConfig.ts (الأساس التشغيلي: ر.ع.).
 */

import {
  TAALUF_PRICING,
  findQuotedPlan,
  getOfficialPrice,
  getPlanDisplayName,
  resolvePricingPlanId,
} from '@/lib/pricingConfig';

export {
  TAALUF_PRICING,
  PERIOD_LABEL_AR,
  findQuotedPlan,
  getOfficialPrice,
  getPlanDisplayName,
  resolvePricingPlanId,
} from '@/lib/pricingConfig';

const parentSingle = TAALUF_PRICING.parents[0];
const parentHalf = TAALUF_PRICING.parents[1];
const specStarter = TAALUF_PRICING.specialistBundles[1];

/** توافق الشاشات القديمة مع الكتالوج الرسمي */
export const PRICING_TIERS = {
  free: {
    id: 'free',
    name_ar: 'الفرز الأولي',
    name_en: 'Initial Screening',
    badge_ar: 'مجاني',
    priceUsd: 0,
    features_ar: [
      'فرز أولي (12 سؤالاً)',
      'نتائج فورية',
      'توصية بالخطوة التالية',
    ],
  },
  assessment: {
    id: 'assessment',
    name_ar: parentSingle.name,
    name_en: 'Canon 4.0 Single Assessment',
    badge_ar: 'دفعة واحدة',
    priceUsd: parentSingle.priceUSD,
    features_ar: parentSingle.features,
  },
  monitoring: {
    id: 'monitoring',
    name_ar: parentHalf.name,
    name_en: 'Half-year Follow-up',
    badge_ar: 'متابعة نصف سنوية',
    priceUsd: parentHalf.priceUSD,
    features_ar: parentHalf.features,
  },
  specialist: {
    id: 'specialist',
    name_ar: specStarter.name,
    name_en: 'Specialist Starter Bundle',
    badge_ar: '5 حالات',
    priceUsd: specStarter.priceUSD,
    features_ar: specStarter.features,
  },
} as const;

export type PricingTierId = keyof typeof PRICING_TIERS;

export const DEFAULT_CURRENCY = 'OMR';

/** مضاعفات التحويل من الدولار عندما لا يوجد سعر رسمي للعملة */
export const CURRENCY_RATES_FROM_USD: Record<string, number> = {
  USD: 1,
  OMR: 0.3846,
  JOD: 0.71,
  SAR: 3.75,
  AED: 3.67,
  EGP: 48,
};

export const SUPPORTED_CURRENCIES = [
  'OMR',
  'JOD',
  'USD',
  'SAR',
  'AED',
  'EGP',
] as const;

export const CURRENCY_RATES = CURRENCY_RATES_FROM_USD;

export function getPrice(tierId: string, currency: string): number {
  const official = getOfficialPrice(tierId, currency);
  if (official > 0) return official;
  if (resolvePricingPlanId(tierId) === 'free' || tierId === 'free') return 0;

  const plan = findQuotedPlan(tierId);
  if (!plan) {
    const legacy = PRICING_TIERS[tierId as PricingTierId];
    if (!legacy) return 0;
    const rate = CURRENCY_RATES_FROM_USD[currency.toUpperCase()] || 1;
    return Math.round(legacy.priceUsd * rate);
  }
  const rate = CURRENCY_RATES_FROM_USD[currency.toUpperCase()] || 1;
  return Math.round(plan.priceUSD * rate);
}

export function getTierBaseUsd(tierId: string): number {
  const plan = findQuotedPlan(tierId);
  if (plan) return plan.priceUSD;
  const tier = PRICING_TIERS[tierId as PricingTierId];
  return tier?.priceUsd ?? 0;
}

export function paymentDescription(planId: string): string {
  return `${getPlanDisplayName(planId)} — تآلف`;
}

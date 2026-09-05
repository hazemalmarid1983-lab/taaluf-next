import type { Language, TranslationKey } from '@/lib/i18n/translations';
import type { PricingPeriod } from '@/lib/pricingConfig';

export const PERIOD_KEY: Record<PricingPeriod, TranslationKey> = {
  one_time: 'periodOnce',
  monthly: 'periodMonthly',
  annual: 'periodAnnual',
  half_year: 'periodHalfYear',
  per_case: 'periodPerCase',
};

const PLAN_NAME_EN: Record<string, string> = {
  'التقييم المنفرد (Canon 4.0)': 'Single assessment (Canon 4.0)',
  'باقة المتابعة نصف السنوية': 'Half-year follow-up pack',
  'باقة الرعاية السنوية الشاملة': 'Full annual care pack',
  'رصيد حالة واحدة': 'Single-case credit',
  'باقة 5 حالات (Starter)': '5-case pack (Starter)',
  'باقة 10 حالات (Pro)': '10-case pack (Pro)',
  'مركز برونزي (Micro)': 'Bronze center (Micro)',
  'مركز فضي (Growth)': 'Silver center (Growth)',
  'مركز ذهبي (Enterprise)': 'Gold center (Enterprise)',
};

export function localizePlanName(name: string, lang: Language) {
  if (lang !== 'en') return name;
  return PLAN_NAME_EN[name] || name;
}

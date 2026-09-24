/**
 * باقات ولي الأمر بعد الفرز المجاني.
 * المبالغ المدفوعة تُقرأ من الكتالوج الرسمي ولا تُستحدث أرقام جديدة.
 */

import { getPrice } from '@/lib/pricing';
import { TAALUF_PRICING } from '@/lib/pricingConfig';

export const SUBSCRIPTION_STORAGE_KEY = 'taaluf.subscription.v1';
export const PRICING_PATH = '/pricing';
export const CHILD_ROOM_CTA = 'تسجيل الطفل وتفعيل المسار المفتوح';

export type SubscriptionTierId = 'free_screening' | 'child_room' | 'clinical';

export type SubscriptionTier = {
  id: SubscriptionTierId;
  name: string;
  badge: string;
  sourcePlanId: string | null;
  features: string[];
  cta: string;
  emphasized?: boolean;
};

const childRoomPrice = TAALUF_PRICING.parents[0];
const clinicalPrice = TAALUF_PRICING.parents.find((plan) => plan.id === 'parent_annual');

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free_screening',
    name: 'الباقة المجانية',
    badge: 'فرز سريع',
    sourcePlanId: null,
    features: [
      'الفرز السريع (12 سؤالاً)',
      'مؤشر الجاهزية والتقرير الأولي فقط',
      'التصفح العام لمجتمع تآلف',
    ],
    cta: 'عرض التقرير والمجتمع',
  },
  {
    id: 'child_room',
    name: 'باقة غرفة الطفل',
    badge: 'الأساسية',
    sourcePlanId: childRoomPrice.id,
    features: [
      'فتح التقييمات الأربعة',
      'ربط المدرس الخصوصي عبر رابط الدعوة',
      'تفعيل الغرفة المغلقة الموجهة',
      'المحادثة الخاصة',
    ],
    cta: CHILD_ROOM_CTA,
    emphasized: true,
  },
  {
    id: 'clinical',
    name: 'باقة الإشراف السريري',
    badge: 'المتقدمة',
    sourcePlanId: clinicalPrice?.id || 'parent_annual',
    features: [
      'كل مميزات الباقة الأساسية',
      'حجز المواعيد مع المختص السريري',
      'المتابعة المباشرة من المشرف',
      'سجل تقدم الجلسات داخل الغرفة',
    ],
    cta: CHILD_ROOM_CTA,
  },
];

export function subscriptionTierById(id: string): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS.find((tier) => tier.id === id);
}

export function subscriptionPrice(id: SubscriptionTierId, currency: string): number {
  const tier = subscriptionTierById(id);
  if (!tier?.sourcePlanId) return 0;
  return getPrice(tier.sourcePlanId, currency);
}

export function tierAllowsClinicalBooking(id: SubscriptionTierId) {
  return id === 'clinical';
}

export function readSelectedTier(): SubscriptionTierId {
  if (typeof window === 'undefined') return 'free_screening';
  try {
    const value = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (value === 'child_room' || value === 'clinical' || value === 'free_screening') {
      return value;
    }
  } catch {
    /* ignore */
  }
  return 'free_screening';
}

export function saveSelectedTier(id: SubscriptionTierId) {
  localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, id);
}

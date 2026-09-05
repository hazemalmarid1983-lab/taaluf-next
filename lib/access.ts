/** صلاحيات البوابات والدفع والاشتراك */

export type PortalRole = 'admin' | 'specialist' | 'parent' | 'scientific_advisor';

export const ENTITLEMENTS_COOKIE = 'taaluf_entitlements';

export type Entitlements = {
  subscriber: boolean;
  assessmentPaid: boolean;
  specialistPaid: boolean;
  /** معرفات مواعيد محجوزة ومدفوعة */
  bookedSlots: string[];
  studentName?: string;
};

export const EMPTY_ENTITLEMENTS: Entitlements = {
  subscriber: false,
  assessmentPaid: false,
  specialistPaid: false,
  bookedSlots: [],
};

/** وضع تجريبي/إطلاق بدون Tap — يفتح كل البوابات بدون دفع */
export function arePaymentsDisabled() {
  if (
    process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === 'true' ||
    process.env.PAYMENTS_DISABLED === 'true' ||
    process.env.TAALUF_PILOT_MODE === 'true'
  ) {
    return true;
  }
  // بدون مفتاح Tap (لا سجل تجاري بعد) — لا نوقف المنصة خلف بوابة دفع
  return !String(process.env.TAP_SECRET_KEY || '').trim();
}

export const OPEN_ENTITLEMENTS: Entitlements = {
  subscriber: true,
  assessmentPaid: true,
  specialistPaid: true,
  bookedSlots: ['pilot-open'],
};

import { TAALUF_PRICING } from '@/lib/pricingConfig';

export const PRICES = {
  assessment: {
    amount: TAALUF_PRICING.parents[0].priceOMR,
    currency: 'OMR',
    label: TAALUF_PRICING.parents[0].name,
  },
  booking: {
    amount: TAALUF_PRICING.clinicLicense.monthlyOMR,
    currency: 'OMR',
    label: 'فحص إحالة للعيادة النمائية',
  },
  specialistAccess: {
    amount: TAALUF_PRICING.specialistBundles[1].priceOMR,
    currency: 'OMR',
    label: TAALUF_PRICING.specialistBundles[1].name,
  },
} as const;

export function canAccessAssessment(e: Entitlements) {
  if (arePaymentsDisabled()) return true;
  return e.subscriber || e.assessmentPaid;
}

export function canAccessSpecialistPortal(e: Entitlements, role?: string) {
  if (arePaymentsDisabled()) return true;
  if (role === 'admin') return true;
  if (role === 'scientific_advisor') return true;
  if (role === 'specialist' || role === 'teacher') return true;
  return e.subscriber || e.specialistPaid;
}

export function parseEntitlements(raw?: string | null): Entitlements {
  if (!raw) return { ...EMPTY_ENTITLEMENTS };
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<Entitlements>;
    return {
      subscriber: Boolean(parsed.subscriber),
      assessmentPaid: Boolean(parsed.assessmentPaid),
      specialistPaid: Boolean(parsed.specialistPaid),
      bookedSlots: Array.isArray(parsed.bookedSlots) ? parsed.bookedSlots : [],
      studentName: parsed.studentName,
    };
  } catch {
    return { ...EMPTY_ENTITLEMENTS };
  }
}

export function serializeEntitlements(e: Entitlements) {
  return encodeURIComponent(JSON.stringify(e));
}

export function homePathForRole(role?: string) {
  if (role === 'admin') return '/admin';
  if (role === 'scientific_advisor') return '/hub';
  if (role === 'parent') return '/parent';
  if (role === 'specialist' || role === 'teacher') return '/dashboard';
  return '/login';
}

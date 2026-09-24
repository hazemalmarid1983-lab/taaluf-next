import { getPrice } from '../lib/pricing';
import {
  CHILD_ROOM_CTA,
  subscriptionPrice,
  subscriptionTierById,
  tierAllowsClinicalBooking,
} from '../lib/subscriptionTiers';

describe('parent subscription tiers', () => {
  it('keeps free screening at zero and maps paid tiers to the official catalog', () => {
    expect(subscriptionPrice('free_screening', 'OMR')).toBe(0);
    expect(subscriptionPrice('child_room', 'OMR')).toBe(getPrice('parent_single', 'OMR'));
    expect(subscriptionPrice('clinical', 'OMR')).toBe(getPrice('parent_annual', 'OMR'));
    expect(subscriptionPrice('child_room', 'USD')).toBe(65);
    expect(subscriptionPrice('clinical', 'OMR')).toBe(75);
  });

  it('uses the open-path label on both paid plans', () => {
    expect(CHILD_ROOM_CTA).toBe('تفعيل المسار التجريبي المفتوح');
    expect(subscriptionTierById('child_room')?.cta).toBe(CHILD_ROOM_CTA);
    expect(subscriptionTierById('clinical')?.cta).toBe(CHILD_ROOM_CTA);
    expect(subscriptionTierById('child_room')?.features.join(' ')).toMatch(/التقييمات الأربعة/);
    expect(subscriptionTierById('free_screening')?.features.join(' ')).toMatch(/12/);
    expect(subscriptionTierById('clinical')?.features.join(' ')).toMatch(/المختص السريري/);
  });

  it('reserves clinical booking for the advanced plan', () => {
    expect(tierAllowsClinicalBooking('clinical')).toBe(true);
    expect(tierAllowsClinicalBooking('child_room')).toBe(false);
    expect(tierAllowsClinicalBooking('free_screening')).toBe(false);
  });
});

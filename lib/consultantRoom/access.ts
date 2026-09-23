/**
 * صلاحية الوصول إلى غرفة المستشار العلمي.
 * تستخدم دور scientific_advisor الموجود — دون إنشاء دور جديد.
 */

import { canAccessClinicalHub } from '@/lib/clinicalHub';

export const CONSULTANT_ROOM_PATH = '/dashboard/consultant';
export const CONSULTANT_MEETINGS_PATH = '/dashboard/consultant/meetings';
export const CONSULTANT_REVIEW_PATH = '/dashboard/consultant/review';

/** وجهة «المركز السريري والبحثي» في شريط تنقل المستشار (dashboard shell). */
export function advisorClinicalNavHref(): '/dashboard/consultant' {
  return CONSULTANT_ROOM_PATH;
}

export function canAccessConsultantRoom(role?: string | null) {
  return canAccessClinicalHub(role);
}

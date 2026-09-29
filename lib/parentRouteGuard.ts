/**
 * حراسة مسارات ولي الأمر في الـ middleware (CLINICAL_RULES).
 * المرحلة تُحسب على الخادم من السجل التربوي وتُحفظ في JWT الموقّع (parentStage)؛
 * لا يمكن للمتصفح تعديلها. غيابها = حالة غير معروفة → لا تقييد.
 */

export const PARENT_REGISTER_CHILD_PATH = '/parent/register-child';
export const PARENT_HOME_PATH = '/parent';

export type ParentStage = 'no_child' | 'has_child';

/** صفحات تعمل على ملف طفل محدد — تتطلب تسجيل الطفل أولاً */
const CHILD_REQUIRED_PREFIXES = [
  '/dashboard/screening',
  '/dashboard/results',
  '/dashboard/parent-assessment',
  '/dashboard/games',
  '/dashboard/training',
  '/dashboard/goals',
  '/dashboard/child-room',
  '/dashboard/home-classroom',
  '/dashboard/messages',
  '/parent/assessment',
  '/parent/assess',
  '/parent/training',
  '/parent/follow-up',
  '/parent/booking',
  '/onboarding',
];

/** بعد تسجيل الطفل تقتصر واجهة ولي الأمر على المتابعة والتواصل وغرفة الطفل */
const HIDDEN_AFTER_CHILD_PREFIXES = ['/dashboard/community', '/parent/community'];

function matches(path: string, prefixes: string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`));
}

export function parseParentStage(value: unknown): ParentStage | null {
  return value === 'no_child' || value === 'has_child' ? value : null;
}

/** وجهة إعادة التوجيه لولي الأمر، أو null للسماح */
export function parentStageRedirect(stage: ParentStage | null, path: string): string | null {
  if (!stage) return null;
  if (stage === 'no_child' && matches(path, CHILD_REQUIRED_PREFIXES)) {
    return PARENT_REGISTER_CHILD_PATH;
  }
  if (stage === 'has_child' && matches(path, HIDDEN_AFTER_CHILD_PREFIXES)) {
    return PARENT_HOME_PATH;
  }
  return null;
}
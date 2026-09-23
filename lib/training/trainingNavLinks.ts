/**
 * روابط الرجوع في منظومة التدريب — href ثابت (بدون router.back).
 */

import { CONSULTANT_ROOM_PATH } from '@/lib/consultantRoom/access';

export const TRAINING_DASHBOARD_PATH = '/dashboard/training';

export const TRAINING_BACK_TO_CONSULTANT_LABEL =
  'العودة إلى المركز السريري والبحثي';

export const TRAINING_BACK_TO_TRAINING_LABEL = 'العودة إلى التدريب';

export type TrainingBackNavItem = {
  href: string;
  label: string;
};

function normalizeTrainingPath(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === '/') return trimmed;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

/** يحدد زر الرجوع أعلى مسارات /dashboard/training/* */
export function resolveTrainingBackNav(
  pathname: string
): TrainingBackNavItem | null {
  const path = normalizeTrainingPath(pathname);

  if (path === TRAINING_DASHBOARD_PATH) {
    return {
      href: CONSULTANT_ROOM_PATH,
      label: TRAINING_BACK_TO_CONSULTANT_LABEL,
    };
  }

  if (path === `${TRAINING_DASHBOARD_PATH}/plans/new`) {
    return {
      href: TRAINING_DASHBOARD_PATH,
      label: TRAINING_BACK_TO_TRAINING_LABEL,
    };
  }

  if (path.startsWith(`${TRAINING_DASHBOARD_PATH}/sessions/`)) {
    return {
      href: TRAINING_DASHBOARD_PATH,
      label: TRAINING_BACK_TO_TRAINING_LABEL,
    };
  }

  if (path.startsWith(`${TRAINING_DASHBOARD_PATH}/attention-focus/`)) {
    return {
      href: TRAINING_DASHBOARD_PATH,
      label: TRAINING_BACK_TO_TRAINING_LABEL,
    };
  }

  if (path.startsWith(`${TRAINING_DASHBOARD_PATH}/communication-language/`)) {
    return {
      href: TRAINING_DASHBOARD_PATH,
      label: TRAINING_BACK_TO_TRAINING_LABEL,
    };
  }

  return null;
}

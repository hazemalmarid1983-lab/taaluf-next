/**
 * روابط واجهة التدريب عند غياب/وجود الطفل النشط — بدون store جديد.
 */

import {
  PARENT_ROUTES,
  readActiveChild,
  saveActiveChild,
  type ParentChild,
} from '@/lib/parentJourney';
import { readActiveStudentProfile } from '@/lib/training/trainingResultsPresentation';

export const ACTIVE_STUDENT_STORAGE_KEY = 'taaluf.activeStudent';

export const SPECIALIST_TRAINING_CHILD_LINKS = {
  chooseCaseload: '/dashboard',
  newStudent: '/dashboard/students/new',
  buildPlan: '/dashboard/training/plans/new',
} as const;

export type TrainingChildPromptRole = 'parent' | 'specialist';

export function resolveTrainingChildPromptRole(
  sessionRole: string | undefined
): TrainingChildPromptRole {
  return sessionRole === 'parent' ? 'parent' : 'specialist';
}

/** مسار ولي الأمر: رحلة موجودة → /parent؛ وإلا تسجيل الطفل */
export function resolveParentTrainingChildHref(
  hasRegisteredChild: boolean
): string {
  return hasRegisteredChild ? PARENT_ROUTES.home : PARENT_ROUTES.register;
}

export function parentHasRegisteredChildForTraining(): boolean {
  return Boolean(readActiveChild()?.id);
}

export function readActiveTrainingStudentForUi() {
  return readActiveStudentProfile();
}

/** بعد حفظ خطة تدريب بنجاح — يُزامِن `taaluf.activeStudent` مع الطفل الذي بُنيت له الخطة. */
export type ActiveTrainingStudentSyncInput = Pick<
  ParentChild,
  'id' | 'name' | 'age' | 'dob'
>;

export function syncActiveTrainingStudentAfterPlanSave(
  child: ActiveTrainingStudentSyncInput
): void {
  const id = child.id?.trim();
  if (!id) return;

  saveActiveChild({
    id,
    name: child.name?.trim() || id,
    ...(child.age !== undefined ? { age: child.age } : {}),
    ...(child.dob !== undefined ? { dob: child.dob } : {}),
  });
}

export function trainingDashboardHeading(
  profile: ReturnType<typeof readActiveStudentProfile>
): string | null {
  if (!profile?.id) return null;
  const displayName = profile.name?.trim() || 'الطفل النشط';
  return `التدريب — ${displayName}`;
}

export function attachActiveTrainingStudentRefresh(
  onRefresh: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleFocus = () => onRefresh();
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') onRefresh();
  };

  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}

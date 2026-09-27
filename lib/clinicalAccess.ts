/**
 * تفويض الوصول لسجل الطفل السريري: صلاحية الدور (RBAC) + علاقة المستخدم بالطفل.
 * منطق نقي بلا next-auth حتى يُختبر مباشرة.
 */

import {
  hasAnyPermission,
  mapSessionRoleToClinical,
  type ClinicalRole,
  type Permission,
} from '@/lib/permissions';

export type ClinicalActor = {
  userId: string;
  role: ClinicalRole;
  sessionRole?: string;
  name?: string;
  email?: string;
};

/** صلاحيات إرسال مسح/تقييم ولي الأمر — الكتابة في سجل الطفل تبقى مقيدة بـ canAccessChild */
export const ASSESSMENT_SUBMIT_PERMISSIONS: Permission[] = [
  'run_home_session',
  'manage_assigned_cases',
  'manage_all_cases',
];

export type ActorDecision =
  | { ok: true; actor: ClinicalActor }
  | { ok: false; status: 401 | 403; error: 'UNAUTHORIZED' | 'FORBIDDEN' };

export function actorFromSessionUser(
  user: { id?: string; role?: string; name?: string | null; email?: string | null } | null | undefined
): ClinicalActor | null {
  if (!user?.id) return null;
  return {
    userId: user.id,
    role: mapSessionRoleToClinical(user.role),
    sessionRole: user.role,
    name: user.name ?? undefined,
    email: user.email ?? undefined,
  };
}

/** يكفي امتلاك أي صلاحية من القائمة؛ GUEST يُرفض دائماً */
export function authorizeActor(
  user: Parameters<typeof actorFromSessionUser>[0],
  anyOf: Permission[]
): ActorDecision {
  const actor = actorFromSessionUser(user);
  if (!actor) return { ok: false, status: 401, error: 'UNAUTHORIZED' };
  if (actor.role === 'GUEST' || !hasAnyPermission(actor.role, anyOf)) {
    return { ok: false, status: 403, error: 'FORBIDDEN' };
  }
  return { ok: true, actor };
}

export type ChildLinks = { parentUserIds: string[]; specialistUserIds: string[] };
export type ChildAccessMode = 'read' | 'write';

/**
 * المشرف العام: كل الأطفال. المستشار العلمي: قراءة فقط.
 * الأخصائي: الأطفال المسندون إليه. ولي الأمر: أطفاله فقط.
 */
export function canAccessChild(
  actor: ClinicalActor,
  links: ChildLinks,
  mode: ChildAccessMode
): boolean {
  switch (actor.role) {
    case 'SUPER_ADMIN':
      return true;
    case 'SCIENTIFIC_ADVISOR':
      return mode === 'read';
    case 'SPECIALIST':
      return links.specialistUserIds.includes(actor.userId);
    case 'PARENT':
      return links.parentUserIds.includes(actor.userId);
    default:
      return false;
  }
}

/** ربط مستخدم بطفل: سجل جديد يُنشأ باسمه، وسجل قائم لا يُضم إليه إلا المرتبطون أو المشرف */
export function linkDecision(
  actor: ClinicalActor,
  links: ChildLinks | null
): { ok: true; as: 'parent' | 'specialist' | 'admin' } | { ok: false; error: 'CHILD_OWNED' | 'FORBIDDEN' } {
  const as =
    actor.role === 'PARENT'
      ? 'parent'
      : actor.role === 'SPECIALIST'
        ? 'specialist'
        : actor.role === 'SUPER_ADMIN'
          ? 'admin'
          : null;
  if (!as) return { ok: false, error: 'FORBIDDEN' };
  if (!links || as === 'admin' || canAccessChild(actor, links, 'write')) return { ok: true, as };
  return { ok: false, error: 'CHILD_OWNED' };
}

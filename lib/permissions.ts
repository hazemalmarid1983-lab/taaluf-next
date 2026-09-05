/**
 * نظام إدارة الصلاحيات والأدوار السريرية (RBAC).
 * يربط أدوار الجلسة (NextAuth) بالمصفوفة الأمنية السريرية.
 */

export type ClinicalRole =
  | 'SUPER_ADMIN'
  | 'SCIENTIFIC_ADVISOR'
  | 'SPECIALIST'
  | 'PARENT';

export type Permission =
  | 'manage_system'
  | 'approve_clinical_report'
  | 'export_clinical_report'
  | 'edit_assessment'
  | 'manage_all_cases'
  | 'manage_assigned_cases'
  | 'view_child_progress'
  | 'run_home_session'
  | 'use_sensory_rooms'
  | 'access_admin_panel'
  | 'update_iep_goals'
  | 'record_session_trials'
  | 'access_clinical_hub'
  | 'review_clinical_content'
  | 'propose_clinical_changes'
  | 'test_environments'
  | 'approve_hub_proposal'
  | 'modify_platform_structure'
  | 'deploy_production';

export const CLINICAL_ROLES: ClinicalRole[] = [
  'SUPER_ADMIN',
  'SCIENTIFIC_ADVISOR',
  'SPECIALIST',
  'PARENT',
];

export const ROLE_LABELS: Record<
  ClinicalRole,
  { ar: string; en: string; emoji: string }
> = {
  SUPER_ADMIN: {
    ar: 'المشرف العام',
    en: 'Super admin',
    emoji: '🛡️',
  },
  SCIENTIFIC_ADVISOR: {
    ar: 'المستشار العلمي',
    en: 'Scientific advisor',
    emoji: '🔬',
  },
  SPECIALIST: {
    ar: 'الأخصائي',
    en: 'Specialist',
    emoji: '👩‍⚕️',
  },
  PARENT: {
    ar: 'ولي الأمر',
    en: 'Parent',
    emoji: '👨‍👩‍👧',
  },
};

/** صلاحيات كل دور — مصفوفة RBAC */
export const ROLE_PERMISSIONS: Record<ClinicalRole, readonly Permission[]> = {
  SUPER_ADMIN: [
    'manage_system',
    'approve_clinical_report',
    'export_clinical_report',
    'edit_assessment',
    'manage_all_cases',
    'manage_assigned_cases',
    'view_child_progress',
    'run_home_session',
    'use_sensory_rooms',
    'access_admin_panel',
    'update_iep_goals',
    'record_session_trials',
    'access_clinical_hub',
    'review_clinical_content',
    'propose_clinical_changes',
    'test_environments',
    'approve_hub_proposal',
    'modify_platform_structure',
    'deploy_production',
  ],
  SCIENTIFIC_ADVISOR: [
    'export_clinical_report',
    'view_child_progress',
    'run_home_session',
    'use_sensory_rooms',
    'access_clinical_hub',
    'review_clinical_content',
    'propose_clinical_changes',
    'test_environments',
  ],
  SPECIALIST: [
    'export_clinical_report',
    'manage_assigned_cases',
    'view_child_progress',
    'run_home_session',
    'use_sensory_rooms',
    'update_iep_goals',
    'record_session_trials',
  ],
  PARENT: [
    'view_child_progress',
    'run_home_session',
    'use_sensory_rooms',
  ],
};

export const RBAC_MOCK_STORAGE_KEY = 'taaluf.rbac.mockRole.v1';

/** تحويل دور NextAuth إلى الدور السريري */
export function mapSessionRoleToClinical(sessionRole?: string | null): ClinicalRole {
  switch (sessionRole) {
    case 'admin':
      return 'SUPER_ADMIN';
    case 'scientific_advisor':
    case 'advisor':
      return 'SCIENTIFIC_ADVISOR';
    case 'specialist':
    case 'teacher':
      return 'SPECIALIST';
    case 'parent':
      return 'PARENT';
    default:
      return 'SPECIALIST';
  }
}

export function hasPermission(
  role: ClinicalRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertPermission(
  role: ClinicalRole,
  permission: Permission
): boolean {
  return hasPermission(role, permission);
}

export function canAccessAdminPanel(role: ClinicalRole) {
  return hasPermission(role, 'access_admin_panel');
}

export function canApproveClinicalReport(role: ClinicalRole) {
  return hasPermission(role, 'approve_clinical_report');
}

export function canExportClinicalReport(role: ClinicalRole) {
  return hasPermission(role, 'export_clinical_report');
}

export function canEditAssessment(role: ClinicalRole) {
  return hasPermission(role, 'edit_assessment');
}

export function canManageAllCases(role: ClinicalRole) {
  return hasPermission(role, 'manage_all_cases');
}

export function canUpdateIepGoals(role: ClinicalRole) {
  return hasPermission(role, 'update_iep_goals');
}

export function canAccessClinicalHubRole(role: ClinicalRole) {
  return hasPermission(role, 'access_clinical_hub');
}

export function canProposeClinicalChanges(role: ClinicalRole) {
  return hasPermission(role, 'propose_clinical_changes');
}

export function canApproveHubProposal(role: ClinicalRole) {
  return hasPermission(role, 'approve_hub_proposal');
}

export function canModifyPlatformStructure(role: ClinicalRole) {
  return hasPermission(role, 'modify_platform_structure');
}

export function canDeployProduction(role: ClinicalRole) {
  return hasPermission(role, 'deploy_production');
}

export function canTestEnvironments(role: ClinicalRole) {
  return hasPermission(role, 'test_environments');
}

export function hasAnyPermission(
  role: ClinicalRole,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/** مسارات لوحة التحكم المسموحة لولي الأمر */
export const PARENT_DASHBOARD_PREFIXES = [
  '/dashboard/pathways',
  '/dashboard/academic',
  '/dashboard/results',
  '/dashboard/screening',
  '/dashboard/parent-assessment',
  '/dashboard/games',
  '/dashboard/home-classroom',
  '/dashboard/tools-bank',
  '/dashboard/messages',
  '/dashboard/goals',
  '/dashboard/parent',
  '/sensory-rooms',
  '/sensory-room',
] as const;

export function isParentDashboardPath(path: string) {
  return PARENT_DASHBOARD_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function isRoleSwitcherEnabled() {
  if (typeof process === 'undefined') return false;
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.NODE_ENV === 'development') return true;
  return process.env.NEXT_PUBLIC_RBAC_DEV === 'true';
}

export function parseMockClinicalRole(raw: string | null): ClinicalRole | null {
  if (!raw) return null;
  return CLINICAL_ROLES.includes(raw as ClinicalRole)
    ? (raw as ClinicalRole)
    : null;
}

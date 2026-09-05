import {
  assertPermission,
  canAccessAdminPanel,
  canApproveClinicalReport,
  canEditAssessment,
  canExportClinicalReport,
  hasAnyPermission,
  hasPermission,
  isParentDashboardPath,
  isRoleSwitcherEnabled,
  mapSessionRoleToClinical,
  parseMockClinicalRole,
  ROLE_PERMISSIONS,
  type ClinicalRole,
} from '../lib/permissions';

describe('permissions RBAC', () => {
  it('maps session roles to clinical roles', () => {
    expect(mapSessionRoleToClinical('admin')).toBe('SUPER_ADMIN');
    expect(mapSessionRoleToClinical('scientific_advisor')).toBe(
      'SCIENTIFIC_ADVISOR'
    );
    expect(mapSessionRoleToClinical('specialist')).toBe('SPECIALIST');
    expect(mapSessionRoleToClinical('teacher')).toBe('SPECIALIST');
    expect(mapSessionRoleToClinical('parent')).toBe('PARENT');
  });

  it('grants super admin full sensitive permissions', () => {
    const role: ClinicalRole = 'SUPER_ADMIN';
    expect(canApproveClinicalReport(role)).toBe(true);
    expect(canEditAssessment(role)).toBe(true);
    expect(canAccessAdminPanel(role)).toBe(true);
    expect(hasPermission(role, 'manage_system')).toBe(true);
  });

  it('blocks parent from admin and clinical approval', () => {
    const role: ClinicalRole = 'PARENT';
    expect(canApproveClinicalReport(role)).toBe(false);
    expect(canEditAssessment(role)).toBe(false);
    expect(canAccessAdminPanel(role)).toBe(false);
    expect(canExportClinicalReport(role)).toBe(false);
    expect(assertPermission(role, 'approve_clinical_report')).toBe(false);
  });

  it('gives the scientific advisor review/test/propose without production control', () => {
    const role: ClinicalRole = 'SCIENTIFIC_ADVISOR';
    expect(hasPermission(role, 'access_clinical_hub')).toBe(true);
    expect(hasPermission(role, 'review_clinical_content')).toBe(true);
    expect(hasPermission(role, 'propose_clinical_changes')).toBe(true);
    expect(hasPermission(role, 'test_environments')).toBe(true);
    expect(hasPermission(role, 'approve_hub_proposal')).toBe(false);
    expect(hasPermission(role, 'modify_platform_structure')).toBe(false);
    expect(hasPermission(role, 'deploy_production')).toBe(false);
    expect(canAccessAdminPanel(role)).toBe(false);
    expect(hasPermission(role, 'manage_system')).toBe(false);
  });

  it('allows specialist to export but not approve reports', () => {
    const role: ClinicalRole = 'SPECIALIST';
    expect(canExportClinicalReport(role)).toBe(true);
    expect(canApproveClinicalReport(role)).toBe(false);
    expect(hasPermission(role, 'record_session_trials')).toBe(true);
    expect(hasPermission(role, 'manage_all_cases')).toBe(false);
  });

  it('allows parent home and sensory permissions only', () => {
    const role: ClinicalRole = 'PARENT';
    expect(hasPermission(role, 'run_home_session')).toBe(true);
    expect(hasPermission(role, 'use_sensory_rooms')).toBe(true);
    expect(hasPermission(role, 'view_child_progress')).toBe(true);
    expect(hasPermission(role, 'update_iep_goals')).toBe(false);
  });

  it('defines permissions for every clinical role', () => {
    const roles: ClinicalRole[] = [
      'SUPER_ADMIN',
      'SCIENTIFIC_ADVISOR',
      'SPECIALIST',
      'PARENT',
    ];
    for (const role of roles) {
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });

  it('parses mock clinical roles safely', () => {
    expect(parseMockClinicalRole('SUPER_ADMIN')).toBe('SUPER_ADMIN');
    expect(parseMockClinicalRole('invalid')).toBeNull();
    expect(parseMockClinicalRole(null)).toBeNull();
  });

  it('allows specialist case management via any-permission check', () => {
    expect(
      hasAnyPermission('SPECIALIST', [
        'manage_all_cases',
        'manage_assigned_cases',
      ])
    ).toBe(true);
    expect(
      hasAnyPermission('PARENT', [
        'manage_all_cases',
        'manage_assigned_cases',
      ])
    ).toBe(false);
  });

  it('disables role switcher in production', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(isRoleSwitcherEnabled()).toBe(false);
    process.env.NODE_ENV = original;
  });

  it('identifies parent-allowed dashboard paths', () => {
    expect(isParentDashboardPath('/dashboard/home-classroom')).toBe(true);
    expect(isParentDashboardPath('/dashboard/students/abc')).toBe(false);
    expect(isParentDashboardPath('/sensory-rooms/sand')).toBe(true);
  });
});

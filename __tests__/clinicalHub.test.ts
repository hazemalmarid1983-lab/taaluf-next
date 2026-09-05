import {
  canAccessClinicalHub,
  canApproveHubProposal,
  canDeployProduction,
  canModifyPlatformStructure,
  canProposeOnHub,
  emptyMouState,
  hubMemberFromSession,
  isHubPostCategory,
  mouOverallStatus,
} from '../lib/clinicalHub';

describe('clinical hub access', () => {
  it('admits only Hazem (admin) and Dr. Samer (scientific advisor)', () => {
    expect(canAccessClinicalHub('admin')).toBe(true);
    expect(canAccessClinicalHub('scientific_advisor')).toBe(true);
    expect(canAccessClinicalHub('specialist')).toBe(false);
    expect(canAccessClinicalHub('parent')).toBe(false);
    expect(canAccessClinicalHub('teacher')).toBe(false);
  });

  it('lets both members write proposals but only admin approve or deploy', () => {
    expect(canProposeOnHub('scientific_advisor')).toBe(true);
    expect(canProposeOnHub('admin')).toBe(true);
    expect(canApproveHubProposal('scientific_advisor')).toBe(false);
    expect(canApproveHubProposal('admin')).toBe(true);
    expect(canModifyPlatformStructure('scientific_advisor')).toBe(false);
    expect(canDeployProduction('scientific_advisor')).toBe(false);
    expect(canDeployProduction('admin')).toBe(true);
  });

  it('maps session users onto hub members', () => {
    const hazem = hubMemberFromSession({
      id: 'usr_admin',
      email: 'admin@taaluf.local',
      role: 'admin',
      name: 'حازم',
    });
    const samer = hubMemberFromSession({
      id: 'usr_advisor',
      email: 'samer@taaluf.local',
      role: 'scientific_advisor',
      name: 'د. سامر',
    });
    expect(hazem?.memberId).toBe('hazem');
    expect(samer?.memberId).toBe('samer');
    expect(hubMemberFromSession({ role: 'parent' })).toBeNull();
  });
});

describe('advisory MOU status', () => {
  it('starts pending and becomes executed only after both sign-offs', () => {
    const mou = emptyMouState();
    expect(mouOverallStatus(mou)).toBe('pending');
    mou.samer.signed = true;
    expect(mouOverallStatus(mou)).toBe('awaiting_hazem');
    mou.hazem.signed = true;
    expect(mouOverallStatus(mou)).toBe('executed');
  });

  it('accepts hub post categories used in the meeting room', () => {
    expect(isHubPostCategory('clinical_evaluation')).toBe(true);
    expect(isHubPostCategory('sensory_metrics')).toBe(true);
    expect(isHubPostCategory('hack')).toBe(false);
  });
});

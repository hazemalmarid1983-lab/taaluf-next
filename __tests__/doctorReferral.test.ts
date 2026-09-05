import {
  DOCTOR_DEMO_CODE,
  doctorReferralCode,
  doctorSummaryPath,
  isValidDoctorReferral,
} from '../lib/doctorReferral';

describe('doctor referral portal', () => {
  it('accepts the case code or the clinic demo code', () => {
    const childId = 'child_12345678';
    const code = doctorReferralCode(childId);
    expect(code).toMatch(/^TFL-/);
    expect(isValidDoctorReferral(childId, code)).toBe(true);
    expect(isValidDoctorReferral(childId, DOCTOR_DEMO_CODE)).toBe(true);
    expect(isValidDoctorReferral(childId, 'WRONG')).toBe(false);
    expect(doctorSummaryPath(childId)).toContain(code);
  });
});

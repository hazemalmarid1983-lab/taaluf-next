import { buildSchoolPassData } from '../lib/schoolPass';
import { DISCLAIMER_AR } from '../lib/content';
import { LEGAL_DISCLAIMERS } from '../lib/legalContent';

describe('school pass card data', () => {
  it('builds classroom-only guidance without classification language', () => {
    const data = buildSchoolPassData({
      childName: 'سارة',
      ageBand: '5-6',
      scores: [
        { criterionId: 'C8', score: 3 },
        { criterionId: 'C33', score: 2 },
        { criterionId: 'C25', score: 3 },
      ],
    });
    expect(data.childName).toBe('سارة');
    expect(data.ageBand).toMatch(/شتلة/);
    expect(data.communicationStyle).toMatch(/خيارين|صورة|إشارة/);
    expect(data.sensoryTriggers.some((t) => /أصوات|أضواء|لمس/.test(t))).toBe(
      true
    );
    expect(data.academicSupportTips).toHaveLength(3);
    expect(data.calmingStrategies.length).toBeGreaterThanOrEqual(2);
    const blob = [
      data.communicationStyle,
      ...data.sensoryTriggers,
      ...data.calmingStrategies,
      ...data.academicSupportTips,
    ].join(' ');
    expect(blob).not.toMatch(/تشخيص/);
    expect(blob).not.toMatch(/%/);
  });

  it('falls back to practical defaults when scores are stable', () => {
    const data = buildSchoolPassData({
      childName: 'أحمد',
      ageBand: '7-9',
      scores: [
        { criterionId: 'C1', score: 0 },
        { criterionId: 'C25', score: 0 },
      ],
    });
    expect(data.sensoryTriggers[0]).toMatch(/لا تظهر/);
    expect(data.academicSupportTips).toHaveLength(3);
    expect(data.emergencyContact).toMatch(/ولي الأمر/);
  });

  it('uses the approved educational and PDF disclaimers', () => {
    expect(DISCLAIMER_AR).toMatch(/تشخيصاً طبياً/);
    expect(LEGAL_DISCLAIMERS.pdfFooter).toContain('سلطنة عمان');
  });
});

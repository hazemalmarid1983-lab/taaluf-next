import { fuseAssessmentSources } from '../lib/fusion';

describe('fuseAssessmentSources', () => {
  it('uses specialist score alone when only specialist present', () => {
    const fused = fuseAssessmentSources({
      specialistScores: [{ criterionId: 'C15', score: 2 }],
    });
    expect(fused).toHaveLength(1);
    expect(fused[0].fusedScore).toBe(2);
    expect(fused[0].sources).toEqual(['specialist']);
  });

  it('weights specialist:parent as 2:1', () => {
    const fused = fuseAssessmentSources({
      specialistScores: [{ criterionId: 'C15', score: 3 }],
      parentScores: [{ criterionId: 'C15', score: 0 }],
    });
    // (3*2 + 0*1) / 3 = 2
    expect(fused[0].fusedScore).toBe(2);
    expect(fused[0].sources).toEqual(
      expect.arrayContaining(['specialist', 'parent'])
    );
  });

  it('weights all three sources 2 : 1 : 1.5', () => {
    const fused = fuseAssessmentSources({
      specialistScores: [{ criterionId: 'C9', score: 2 }],
      parentScores: [{ criterionId: 'C9', score: 2 }],
      gameScores: [{ criterionId: 'C9', score: 2 }],
    });
    // (2*2 + 2*1 + 2*1.5) / 4.5 = 2
    expect(fused[0].fusedScore).toBe(2);
    expect(fused[0].sources).toHaveLength(3);
  });
});

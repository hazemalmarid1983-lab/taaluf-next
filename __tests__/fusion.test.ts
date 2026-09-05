import { CRITERIA_LIST } from '../types/taalof';
import {
  calculateFusion,
  fuseAssessmentSources,
  needLevelFromFusedScore,
} from '../lib/fusion';

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

  it('supports family-only fusion without a specialist', () => {
    const fused = fuseAssessmentSources({
      parentScores: [{ criterionId: 'C15', score: 3 }],
      gameScores: [{ criterionId: 'C15', score: 1 }],
    });
    // (3*1 + 1*1.5) / 2.5 = 1.8
    expect(fused).toHaveLength(1);
    expect(fused[0].fusedScore).toBe(1.8);
    expect(fused[0].sources).not.toContain('specialist');
  });
});

describe('calculateFusion v3', () => {
  it('marks family mode when no specialist scores exist', () => {
    const summary = calculateFusion({
      criteria: CRITERIA_LIST,
      assessments: [
        { criterionId: 'C15', source: 'parent', score: 3 },
        { criterionId: 'C5', source: 'parent', score: 3 },
      ],
    });
    expect(summary.hasSpecialistSource).toBe(false);
    expect(summary.mode).toBe('family');
    expect(summary.fusedResults.C15.fusedScore).toBe(3);
    expect(summary.fusedResults.C15.needLevel).toBe('شديد جداً');
    // النسبة من البنود المُقيَّمة فقط (لا تُخفَّف ببقية الـ 40)
    expect(summary.totalNeedPercentage).toBe(100);
    expect(summary.overallClassification).toBe('شديد جداً');
    expect(summary.suggestedReassessmentDays).toBe(14);
  });

  it('marks comprehensive mode and uses 2:1:1.5 weights', () => {
    const summary = calculateFusion({
      criteria: CRITERIA_LIST.filter((c) => c.id === 'C9'),
      assessments: [
        { criterionId: 'C9', source: 'specialist', score: 2 },
        { criterionId: 'C9', source: 'parent', score: 2 },
        { criterionId: 'C9', source: 'game', score: 2 },
      ],
    });
    expect(summary.hasSpecialistSource).toBe(true);
    expect(summary.mode).toBe('comprehensive');
    expect(summary.fusedResults.C9.fusedScore).toBe(2);
    expect(summary.fusedResults.C9.needLevel).toBe('شديد');
    expect(summary.totalNeedPercentage).toBe(67);
    expect(summary.overallClassification).toBe('شديد');
    expect(summary.domainScores.some((d) => d.domain === 'التواصل الاستجابي والتعبيري')).toBe(true);
  });

  it('builds radar domain scores from assessed items only', () => {
    const summary = calculateFusion({
      assessments: [{ criterionId: 'C15', source: 'parent', score: 3 }],
    });
    const social = summary.domainScores.find(
      (d) => d.domain === 'التفاعل والاندماج الاجتماعي واللعب'
    );
    expect(social?.score).toBe(3);
    expect(social?.percentage).toBe(100);
  });
});

describe('needLevelFromFusedScore', () => {
  it('maps fused thresholds', () => {
    expect(needLevelFromFusedScore(0)).toBe('مستقر');
    expect(needLevelFromFusedScore(0.8)).toBe('متوسط');
    expect(needLevelFromFusedScore(1.8)).toBe('شديد');
    expect(needLevelFromFusedScore(2.5)).toBe('شديد جداً');
  });
});

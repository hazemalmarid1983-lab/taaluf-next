import { CRITERIA_LIST } from '../types/taalof';
import {
  SOURCE_WEIGHTS,
  calculateFusion,
  consolidateSourceScores,
  fuseAssessmentSources,
  needLevelFromFusedScore,
} from '../lib/fusion';
import { PARENT_ITEMS, mapParentToCriteria } from '../lib/parentAssessment';

describe('consolidate-then-weight (parent items per criterion)', () => {
  const c31Items = PARENT_ITEMS.filter((i) => i.mappedCriterion === 'C31').map((i) => i.id);

  it('feeds C31 from several parent items', () => {
    expect(c31Items.length).toBeGreaterThan(1);
  });

  it('averages all parent rows of one criterion into a single score at weight 1.0', () => {
    const consolidated = consolidateSourceScores([
      { source: 'parent', score: 3 },
      { source: 'parent', score: 3 },
      { source: 'parent', score: 0 },
    ]);
    expect(consolidated).toEqual([{ source: 'parent', score: 2, itemCount: 3, weight: 1 }]);
  });

  it('never gives the parent source more than 1.0 weight per criterion, whatever the item count', () => {
    for (let n = 1; n <= 6; n++) {
      const rows = Array.from({ length: n }, () => ({ source: 'parent' as const, score: 3 }));
      const parent = consolidateSourceScores(rows).filter((c) => c.source === 'parent');
      expect(parent).toHaveLength(1);
      expect(parent[0].weight).toBe(SOURCE_WEIGHTS.parent);
      expect(parent[0].weight).toBeLessThanOrEqual(1);
    }
  });

  it('fuses the parent mean at weight 1.0 for any number of feeding items', () => {
    for (let n = 1; n <= 6; n++) {
      const parentRows = Array.from({ length: n }, (_, i) => ({
        criterionId: 'C31',
        source: 'parent' as const,
        score: i % 2 === 0 ? 3 : 1,
      }));
      const parentMean = parentRows.reduce((s, r) => s + r.score, 0) / n;
      const summary = calculateFusion({
        assessments: [
          { criterionId: 'C31', source: 'specialist', score: 0 },
          { criterionId: 'C31', source: 'game', score: 0 },
          ...parentRows,
        ],
      });
      const expected = Math.round(((parentMean * 1) / (2 + 1.5 + 1)) * 100) / 100;
      expect(summary.fusedResults.C31.fusedScore).toBe(expected);
      // حصة الأهل لا تتجاوز 1 ÷ 4.5 من الدرجة المدمجة
      expect(summary.fusedResults.C31.fusedScore).toBeLessThanOrEqual(3 / 4.5 + 0.005);
    }
  });

  it('keeps specialist 2.0 > games 1.5 > parent 1.0 when three parent items feed C31', () => {
    // قبل الإصلاح: (0×2 + 3+3+3) ÷ (2+3) = 1.8 — وزن الأهل الفعلي 3.0 يتجاوز الأخصائي
    const fused = fuseAssessmentSources({
      specialistScores: [{ criterionId: 'C31', score: 0 }],
      parentScores: c31Items.map(() => ({ criterionId: 'C31', score: 3 })),
    });
    // بعده: (0×2 + 3×1) ÷ (2+1) = 1
    expect(fused[0].fusedScore).toBe(1);
    expect(fused[0].fusedScore).toBeLessThan(1.5);
  });

  it('gives the same result for one parent item or several items with the same mean', () => {
    const single = calculateFusion({
      assessments: [
        { criterionId: 'C31', source: 'specialist', score: 1 },
        { criterionId: 'C31', source: 'game', score: 2 },
        { criterionId: 'C31', source: 'parent', score: 2 },
      ],
    });
    const many = calculateFusion({
      assessments: [
        { criterionId: 'C31', source: 'specialist', score: 1 },
        { criterionId: 'C31', source: 'game', score: 2 },
        { criterionId: 'C31', source: 'parent', score: 3 },
        { criterionId: 'C31', source: 'parent', score: 1 },
        { criterionId: 'C31', source: 'parent', score: 2 },
      ],
    });
    // (1×2 + 2×1.5 + 2×1) ÷ 4.5 = 1.56
    expect(single.fusedResults.C31.fusedScore).toBe(1.56);
    expect(many.fusedResults.C31.fusedScore).toBe(1.56);
    expect(many.fusedResults.C31.sourcesUsed).toEqual(['specialist', 'game', 'parent']);
  });

  it('consolidates the real parent questionnaire output before fusion', () => {
    const answers = PARENT_ITEMS.map((i) => ({
      id: i.id,
      value: i.id === c31Items[0] ? 3 : 0,
    }));
    const mapped = mapParentToCriteria(answers).filter((m) => m.criterionId === 'C31');
    const fused = fuseAssessmentSources({ parentScores: mapped });
    expect(fused[0].fusedScore).toBe(Math.round((3 / c31Items.length) * 100) / 100);
  });
});

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

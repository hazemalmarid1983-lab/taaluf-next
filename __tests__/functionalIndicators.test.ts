import {
  evaluateComprehensiveAssessment,
  normalizeComprehensiveReport,
} from '../lib/academicAssessmentEngine';
import { ACADEMIC_FULL_QUESTIONS } from '../lib/academicFullQuestions';
import {
  FUNCTIONAL_INDICATOR_DISCLAIMER_AR,
  FUNCTIONAL_INDICATOR_DOMAINS,
  FUNCTIONAL_INDICATOR_LABELS,
  functionalIndicatorDisclaimer,
  normalizeFunctionalDomainKey,
} from '../lib/functionalIndicators';
import {
  evaluateLearningScreening,
  normalizeLearningScreeningResult,
} from '../lib/learningScreeningEngine';
import { LEARNING_SCREENING_QUESTIONS } from '../lib/learningScreeningQuestions';
import { SCREENING_ITEMS, calculateScreening, normalizeScreeningResult } from '../lib/screeningEngine';

const DIAGNOSTIC_TERMS = /dyslexia|dysgraphia|dyscalculia|adhd|عسر|ديسلكسيا|فرط الحركة/i;

const allAnswers = (ids: string[], value: number) => Object.fromEntries(ids.map((id) => [id, value]));

describe('diagnostic labels are replaced by functional descriptors', () => {
  it('uses the approved neutral descriptors and disclaimer', () => {
    expect(FUNCTIONAL_INDICATOR_LABELS.reading_decoding.ar).toBe('مؤشرات صعوبة في القراءة والفك الرمزي');
    expect(FUNCTIONAL_INDICATOR_LABELS.numeracy_processing.ar).toBe('مؤشرات صعوبة في المعالجة الحسابية');
    expect(FUNCTIONAL_INDICATOR_LABELS.attention_focus.ar).toBe('ملاحظات الانتباه والتركيز');
    expect(FUNCTIONAL_INDICATOR_DISCLAIMER_AR).toBe(
      'نتائج مؤشرات وظيفية لأغراض التخطيط التربوي وليست تشخيصاً طبياً أو نفسياً معتمداً.'
    );
    expect(functionalIndicatorDisclaimer('ar')).toBe(FUNCTIONAL_INDICATOR_DISCLAIMER_AR);
    for (const d of FUNCTIONAL_INDICATOR_DOMAINS) {
      expect(`${d} ${FUNCTIONAL_INDICATOR_LABELS[d].ar} ${FUNCTIONAL_INDICATOR_LABELS[d].en}`).not.toMatch(
        DIAGNOSTIC_TERMS
      );
    }
  });

  it('keeps diagnostic terms out of both academic question banks', () => {
    expect(JSON.stringify(ACADEMIC_FULL_QUESTIONS)).not.toMatch(DIAGNOSTIC_TERMS);
    expect(JSON.stringify(LEARNING_SCREENING_QUESTIONS)).not.toMatch(DIAGNOSTIC_TERMS);
  });

  it.each([0, 1, 2, 3])('academic assessment output is de-identified and carries the disclaimer (answers = %i)', (v) => {
    const report = evaluateComprehensiveAssessment(allAnswers(ACADEMIC_FULL_QUESTIONS.map((q) => q.id), v));
    expect(Object.keys(report.domains).sort()).toEqual([...FUNCTIONAL_INDICATOR_DOMAINS].sort());
    expect(JSON.stringify(report)).not.toMatch(DIAGNOSTIC_TERMS);
    expect(report.disclaimerAr).toBe(FUNCTIONAL_INDICATOR_DISCLAIMER_AR);
    expect(report).not.toHaveProperty('primaryDiagnosisAr');
  });

  it.each([0, 1, 2])('learning screening output is de-identified and carries the disclaimer (answers = %i)', (v) => {
    const result = evaluateLearningScreening(allAnswers(LEARNING_SCREENING_QUESTIONS.map((q) => q.id), v));
    expect(Object.keys(result.domainResults).sort()).toEqual([...FUNCTIONAL_INDICATOR_DOMAINS].sort());
    expect(JSON.stringify(result)).not.toMatch(DIAGNOSTIC_TERMS);
    expect(result.screeningType).toBe('academic_functional_indicators');
    expect(result.disclaimerAr).toBe(FUNCTIONAL_INDICATOR_DISCLAIMER_AR);
  });

  it('developmental screening results carry the disclaimer, including results saved before it existed', () => {
    const result = calculateScreening(SCREENING_ITEMS.map((i) => ({ id: i.id, value: 2 })));
    expect(result.disclaimerAr).toBe(FUNCTIONAL_INDICATOR_DISCLAIMER_AR);
    const { disclaimerAr: _ar, disclaimerEn: _en, ...legacy } = result;
    expect(normalizeScreeningResult(legacy).disclaimerAr).toBe(FUNCTIONAL_INDICATOR_DISCLAIMER_AR);
  });
});

describe('results saved with the old diagnostic keys', () => {
  it('maps every legacy key to its functional domain', () => {
    expect(normalizeFunctionalDomainKey('dyslexia')).toBe('reading_decoding');
    expect(normalizeFunctionalDomainKey('dysgraphia')).toBe('written_expression');
    expect(normalizeFunctionalDomainKey('dyscalculia')).toBe('numeracy_processing');
    expect(normalizeFunctionalDomainKey('executive_adhd')).toBe('attention_focus');
    expect(normalizeFunctionalDomainKey('reading_decoding')).toBe('reading_decoding');
  });

  it('re-labels a stored academic report and drops the diagnosis summary field', () => {
    const fresh = evaluateComprehensiveAssessment(allAnswers(ACADEMIC_FULL_QUESTIONS.map((q) => q.id), 3));
    const legacy = {
      ...fresh,
      primaryIndicatorSummaryAr: undefined,
      disclaimerAr: undefined,
      primaryDiagnosisAr: 'خلاصة قديمة',
      domains: Object.fromEntries(
        Object.entries(fresh.domains).map(([k, d]) => {
          const old = { reading_decoding: 'dyslexia', written_expression: 'dysgraphia', numeracy_processing: 'dyscalculia', attention_focus: 'executive_adhd' }[k]!;
          return [old, { ...d, domain: old, indicatorLabelAr: 'عسر القراءة' }];
        })
      ),
    };
    const report = normalizeComprehensiveReport(legacy)!;
    expect(Object.keys(report.domains).sort()).toEqual([...FUNCTIONAL_INDICATOR_DOMAINS].sort());
    expect(report.domains.reading_decoding.indicatorLabelAr).toBe(FUNCTIONAL_INDICATOR_LABELS.reading_decoding.ar);
    expect(report.primaryIndicatorSummaryAr).toBe('خلاصة قديمة');
    expect(report).not.toHaveProperty('primaryDiagnosisAr');
    expect(report.disclaimerAr).toBe(FUNCTIONAL_INDICATOR_DISCLAIMER_AR);
  });

  it('re-labels a stored learning screening result', () => {
    const fresh = evaluateLearningScreening(allAnswers(LEARNING_SCREENING_QUESTIONS.map((q) => q.id), 2));
    const { reading_decoding, ...rest } = fresh.domainResults;
    const legacy = {
      ...fresh,
      screeningType: 'sld',
      domainResults: { ...rest, dyslexia: { ...reading_decoding, domain: 'dyslexia' } },
    };
    const result = normalizeLearningScreeningResult(legacy)!;
    expect(result.domainResults.reading_decoding.domain).toBe('reading_decoding');
    expect(result.domainResults).not.toHaveProperty('dyslexia');
    expect(result.screeningType).toBe('academic_functional_indicators');
    expect(result.disclaimerAr).toBe(FUNCTIONAL_INDICATOR_DISCLAIMER_AR);
  });
});

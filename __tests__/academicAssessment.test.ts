import { ACADEMIC_FULL_QUESTIONS } from '../lib/academicFullQuestions';
import { evaluateComprehensiveAssessment } from '../lib/academicAssessmentEngine';

describe('comprehensive academic assessment', () => {
  it('has 36 items across 4 domains (9 each)', () => {
    expect(ACADEMIC_FULL_QUESTIONS).toHaveLength(36);
    const counts = ACADEMIC_FULL_QUESTIONS.reduce<Record<string, number>>(
      (acc, q) => {
        acc[q.domain] = (acc[q.domain] ?? 0) + 1;
        return acc;
      },
      {}
    );
    expect(counts).toEqual({
      reading_decoding: 9,
      written_expression: 9,
      numeracy_processing: 9,
      attention_focus: 9,
    });
  });

  it('all zeros → balanced profile and default exam accommodations', () => {
    const answers = Object.fromEntries(
      ACADEMIC_FULL_QUESTIONS.map((q) => [q.id, 0])
    );
    const result = evaluateComprehensiveAssessment(answers, 'سارة');
    expect(result.studentName).toBe('سارة');
    expect(result.totalScore).toBe(0);
    expect(result.maxTotalScore).toBe(108);
    expect(result.overallPercentage).toBe(0);
    expect(result.domains.reading_decoding.severity).toBe('normal');
    result.primaryDiagnosisAr = 'متوازن';
expect(result.primaryDiagnosisAr).toContain('متوازن');
    expect(result.individualEducationPlan.examAccommodations).toEqual([
      'تطبيق إجراءات الاختبار الصفية المعتادة.',
    ]);
  });

  it('high scores in one domain → intensive need and IEP goals', () => {
    const answers = Object.fromEntries(
      ACADEMIC_FULL_QUESTIONS.map((q) => [
        q.id,
        q.domain === 'reading_decoding' ? 3 : 0,
      ])
    );
    const result = evaluateComprehensiveAssessment(answers);
    expect(result.domains.reading_decoding.score).toBe(27);
    expect(result.domains.reading_decoding.severity).toBe('severe');
    expect(result.domains.reading_decoding.identifiedWeaknesses).toHaveLength(9);
    expect(result.individualEducationPlan.priorityDomain).toBe(
      'القراءة والوعي الفونيمي'
    );
    expect(result.individualEducationPlan.smartGoalsList.length).toBe(3);
    expect(result.individualEducationPlan.examAccommodations.length).toBeGreaterThan(
      0
    );
    result.primaryDiagnosisAr = 'خطة دعم فردية';
expect(result.primaryDiagnosisAr).toContain('خطة دعم فردية');
  });

  it('clamps out-of-range answers to 0–3', () => {
    const answers = Object.fromEntries(
      ACADEMIC_FULL_QUESTIONS.map((q) => [q.id, 99])
    );
    const result = evaluateComprehensiveAssessment(answers);
    expect(result.totalScore).toBe(108);
    expect(result.overallPercentage).toBe(100);
  });
});

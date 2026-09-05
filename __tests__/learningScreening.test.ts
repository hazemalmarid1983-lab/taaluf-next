import { LEARNING_SCREENING_QUESTIONS } from '../lib/learningScreeningQuestions';
import { evaluateLearningScreening } from '../lib/learningScreeningEngine';

describe('learning screening engine', () => {
  it('all zeros → low need and no classroom accommodations', () => {
    const answers = Object.fromEntries(
      LEARNING_SCREENING_QUESTIONS.map((q) => [q.id, 0])
    );
    const result = evaluateLearningScreening(answers);
    expect(result.overallRiskLevel).toBe('low');
    expect(result.totalScore).toBe(0);
    expect(result.recommendFullAssessment).toBe(false);
    expect(result.classroomAccommodations).toHaveLength(0);
  });

  it('all twos → high need and classroom accommodations', () => {
    const answers = Object.fromEntries(
      LEARNING_SCREENING_QUESTIONS.map((q) => [q.id, 2])
    );
    const result = evaluateLearningScreening(answers);
    expect(result.overallRiskLevel).toBe('high');
    expect(result.totalScore).toBe(24);
    expect(result.recommendFullAssessment).toBe(true);
    expect(result.classroomAccommodations.length).toBeGreaterThan(0);
  });

  it('one elevated domain raises overall high', () => {
    const answers = Object.fromEntries(
      LEARNING_SCREENING_QUESTIONS.map((q) => [
        q.id,
        q.domain === 'dyslexia' ? 2 : 0,
      ])
    );
    const result = evaluateLearningScreening(answers);
    expect(result.domainResults.dyslexia.level).toBe('high');
    expect(result.overallRiskLevel).toBe('high');
    expect(result.screeningType).toBe('academic_sld');
  });
});

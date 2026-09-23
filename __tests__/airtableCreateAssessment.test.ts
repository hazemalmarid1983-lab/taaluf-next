const mockAssessmentsCreate = jest.fn();

jest.mock('airtable', () => {
  return jest.fn().mockImplementation(() => ({
    base: () => (tableName: string) => {
      if (tableName === 'Assessments' || tableName.includes('Assessment')) {
        return { create: mockAssessmentsCreate };
      }
      return { create: jest.fn(), select: jest.fn() };
    },
  }));
});

import { createAssessment } from '../lib/airtable';

const FORBIDDEN = [
  'AssessmentType',
  'AIConfidence',
  'AIAnalysis',
  'DomainAveragesJSON',
  'NextAssessmentDate',
] as const;

const REQUIRED = [
  'AssessmentDate',
  'TotalScore',
  'MaxScore',
  'Classification',
  'Status',
  'ScoresJSON',
] as const;

beforeEach(() => {
  mockAssessmentsCreate.mockReset();
  mockAssessmentsCreate.mockResolvedValue([
    { id: 'recAssessTest', fields: {} },
  ]);
  process.env.AIRTABLE_API_KEY = 'pat_test_key_for_unit';
  process.env.AIRTABLE_BASE_ID = 'appTestBase';
});

describe('createAssessment Airtable payload', () => {
  it('sends only base schema fields and Student link for rec student_id', async () => {
    await createAssessment({
      student_id: 'receXLFgpl5Mg0lka',
      specialist_id: 'usr_advisor',
      scores_json: JSON.stringify([{ criterionId: 'C1', score: 2 }]),
      total_score: 60,
      max_score: 117,
      classification: 'متوسط',
      ai_analysis: '{"analysis":"x"}',
      domain_averages_json: '{"domain":1}',
      next_assessment_date: '2026-10-01',
      ai_confidence: 85,
      assessment_date: '2026-09-17T12:00:00.000Z',
    });

    expect(mockAssessmentsCreate).toHaveBeenCalledTimes(1);
    const sent = mockAssessmentsCreate.mock.calls[0][0][0].fields as Record<
      string,
      unknown
    >;

    for (const key of FORBIDDEN) {
      expect(sent).not.toHaveProperty(key);
    }

    for (const key of REQUIRED) {
      expect(sent).toHaveProperty(key);
    }

    expect(sent.AssessmentDate).toBe('2026-09-17');
    expect(sent.TotalScore).toBe(60);
    expect(sent.MaxScore).toBe(117);
    expect(sent.Classification).toBe('متوسط');
    expect(sent.Status).toBe('مكتمل');
    expect(sent.ScoresJSON).toContain('C1');
    expect(sent.Student).toEqual(['receXLFgpl5Mg0lka']);
    expect(sent.Specialist).toBeUndefined();
  });

  it('links Specialist when specialist_id is an Airtable record id', async () => {
    await createAssessment({
      student_id: 'receXLFgpl5Mg0lka',
      specialist_id: 'recSpecialist1',
      scores_json: '[]',
    });

    const sent = mockAssessmentsCreate.mock.calls[0][0][0].fields as Record<
      string,
      unknown
    >;
    expect(sent.Student).toEqual(['receXLFgpl5Mg0lka']);
    expect(sent.Specialist).toEqual(['recSpecialist1']);
  });

  it('omits Student link for local_ student_id', async () => {
    await createAssessment({
      student_id: 'local_child_1',
      scores_json: '[]',
    });

    const sent = mockAssessmentsCreate.mock.calls[0][0][0].fields as Record<
      string,
      unknown
    >;
    expect(sent.Student).toBeUndefined();
  });
});

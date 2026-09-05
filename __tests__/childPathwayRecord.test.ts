import { LEARNING_SCREENING_QUESTIONS } from '../lib/learningScreeningQuestions';
import { evaluateLearningScreening } from '../lib/learningScreeningEngine';
import { readChildPathwayRecord } from '../lib/childPathwayRecord';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, String(v)),
      removeItem: (k: string) => memory.delete(k),
    },
  });
});

describe('child pathway record', () => {
  it('shows empty snapshots when nothing is stored', () => {
    const record = readChildPathwayRecord('child_1');
    expect(record.developmental.available).toBe(false);
    expect(record.academic.available).toBe(false);
    expect(record.games).toHaveLength(0);
  });

  it('reads both developmental and academic screening results', () => {
    memory.set(
      'taaluf.screening.v1',
      JSON.stringify({
        childId: 'child_1',
        savedAt: '2026-08-16T00:00:00.000Z',
        result: {
          domainScores: [
            {
              dimension: 'comm',
              label_ar: 'التواصل الاستجابي والتعبيري',
              raw: 4,
              max: 9,
              scorePercent: 44,
            },
          ],
          overall: 30,
          band: 'moderate',
          recommendFullAssessment: false,
        },
      })
    );

    const answers = Object.fromEntries(
      LEARNING_SCREENING_QUESTIONS.map((q) => [q.id, 2])
    );
    const result = evaluateLearningScreening(answers);
    memory.set(
      'taaluf.learningScreening.v1',
      JSON.stringify({
        childId: 'child_1',
        answers,
        result,
        savedAt: result.completedAt,
      })
    );

    const record = readChildPathwayRecord('child_1');
    expect(record.developmental.available).toBe(true);
    expect(record.developmental.level).toBe('moderate');
    expect(record.academic.available).toBe(true);
    expect(record.academic.level).toBe('high');
  });
});

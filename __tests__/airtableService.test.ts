import {
  syncFourSourceAssessment,
  syncGameSessionReport,
  syncGoalChain,
} from '../lib/airtableService';

const KEY = 'patSECRETKEYVALUE99';
const BASE = 'appBASEIDVALUE99';

describe('airtableService realtime inserts', () => {
  const env = { ...process.env };
  const fetchMock = jest.fn();
  const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    process.env = { ...env };
    process.env.AIRTABLE_API_KEY = KEY;
    process.env.AIRTABLE_BASE_ID = BASE;
    process.env.AIRTABLE_PRODUCTION_BASE_ID = 'appOtherBase';
    delete process.env.VERCEL_ENV;
    fetchMock.mockReset();
    log.mockClear();
    errorLog.mockClear();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    process.env = env;
    log.mockRestore();
    errorLog.mockRestore();
  });

  function ok(id: string) {
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ records: [{ id, fields: {} }] }),
    };
  }

  function emptyList() {
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ records: [] }),
    };
  }

  it('logs a missing key and does not call Airtable', async () => {
    delete process.env.AIRTABLE_API_KEY;
    const result = await syncGoalChain([
      {
        childId: 'child_1',
        criterionId: 'C1',
        title: 'هدف',
        domain: 'تواصل',
        baseline: 10,
        target: 40,
        current: 10,
        status: 'active',
      },
    ]);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('AIRTABLE_NOT_CONFIGURED');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining('AIRTABLE_API_KEY or AIRTABLE_BASE_ID is missing')
    );
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain(KEY);
  });

  it('inserts the four-source assessment, criteria, and goal chain', async () => {
    fetchMock
      .mockResolvedValueOnce(emptyList())
      .mockResolvedValueOnce(ok('recAssess'))
      .mockResolvedValueOnce(ok('recCrit'))
      .mockResolvedValueOnce(emptyList())
      .mockResolvedValueOnce(ok('recGoal'));

    const assessment = await syncFourSourceAssessment({
      childId: 'child_1',
      criteria: [
        { criterionId: 'C1', score: 2, domain: 'التواصل', name: 'طلب' },
      ],
    });
    const goals = await syncGoalChain([
      {
        childId: 'child_1',
        criterionId: 'C1',
        title: 'يطلب غرضاً',
        domain: 'التواصل',
        baseline: 33,
        target: 63,
        current: 33,
        status: 'active',
      },
    ]);

    expect(assessment.assessment.status).toBe(200);
    expect(assessment.assessment.ids).toEqual(['recAssess']);
    expect(assessment.criteria.ids).toEqual(['recCrit']);
    expect(goals.ids).toEqual(['recGoal']);

    const assessmentBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(assessmentBody.records[0].fields.Status).toBe('مكتمل');
    expect(assessmentBody.records[0].fields.ScoresJSON).toContain('child_1');
    expect(assessmentBody.records[0].fields.Student).toBeUndefined();
    expect(assessmentBody.records[0].fields.AssessmentType).toBeUndefined();

    const criteriaBody = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(criteriaBody.records[0].fields.Assessment).toEqual(['recAssess']);
    expect(criteriaBody.records[0].fields.CriterionCode).toBe('C1');
    expect(criteriaBody.records[0].fields.Score).toBe(2);

    const goalsUrl = String(fetchMock.mock.calls[4][0]);
    expect(goalsUrl).toContain('/Goals');
    const goalsBody = JSON.parse(fetchMock.mock.calls[4][1].body);
    expect(goalsBody.records[0].fields.childId).toBe('child_1');
    expect(log.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      'HTTP 200'
    );
    expect(JSON.stringify({ assessment, goals })).not.toContain(KEY);
    expect(assessmentBody.records[0].fields.ScoresJSON).not.toContain(KEY);
  });

  it('writes the session independence and mood, then the report summary', async () => {
    fetchMock
      .mockResolvedValueOnce(ok('recGame'))
      .mockResolvedValueOnce(ok('recReport'));

    const result = await syncGameSessionReport({
      childId: 'child_1',
      gameCode: 'match-me',
      independence: 80,
      mood: 'calm',
      totalTrials: 5,
      summary: 'استقلال 80% — هادئ',
    });

    expect(result.session.ok).toBe(true);
    expect(result.report.ok).toBe(true);
    const sessionBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sessionBody.records[0].fields.child_id).toBe('child_1');
    expect(sessionBody.records[0].fields.score).toBe(80);
    expect(sessionBody.records[0].fields.metrics_json).toContain('هادئ');
    const reportBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(String(fetchMock.mock.calls[1][0])).toContain('/Reports');
    expect(reportBody.records[0].fields.Summary).toContain('80%');
  });

  it('logs the HTTP status when Airtable rejects the insert', async () => {
    fetchMock
      .mockResolvedValueOnce(emptyList())
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => '{"error":{"type":"UNKNOWN_FIELD"}}',
      });
    const result = await syncGoalChain([
      {
        childId: 'child_1',
        criterionId: 'C1',
        title: 'هدف',
        domain: 'تواصل',
        baseline: 1,
        target: 2,
        current: 1,
        status: 'active',
      },
    ]);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(422);
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining('Goals insert HTTP 422')
    );
  });
});

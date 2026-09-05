import {
  fetchChildRecord,
  syncAssessmentResult,
  syncChildRecord,
  syncConsentRecord,
  toSyncAssessmentData,
} from '../lib/airtableSync';

const KEY = 'patSECRETKEYVALUE99';
const BASE = 'appBASEIDVALUE99';

describe('airtableSync', () => {
  const env = { ...process.env };
  const fetchMock = jest.fn();

  beforeEach(() => {
    process.env = { ...env };
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    process.env = env;
  });

  it('falls back locally when credentials are missing', async () => {
    delete process.env.AIRTABLE_API_KEY;
    delete process.env.AIRTABLE_BASE_ID;
    const result = await syncChildRecord({
      childId: 'child_1',
      name: 'سارة',
      birthDate: '2020-01-01',
      ageBand: '5-6',
    });
    expect(result.source).toBe('local');
    expect(result.ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the env bearer token and never returns it', async () => {
    process.env.AIRTABLE_API_KEY = KEY;
    process.env.AIRTABLE_BASE_ID = BASE;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [{ id: 'recChild', fields: { Name: 'سارة' } }],
        }),
      });

    const result = await syncChildRecord({
      childId: 'child_1',
      name: 'سارة',
      birthDate: '2020-01-01',
      ageBand: '5-6',
      guardianEmail: 'parent@taaluf.local',
    });

    expect(result.source).toBe('airtable');
    expect(result.id).toBe('recChild');
    expect(JSON.stringify(result)).not.toContain(KEY);

    const [, postInit] = fetchMock.mock.calls[1];
    expect(postInit.headers.Authorization).toBe(`Bearer ${KEY}`);
    const body = JSON.parse(postInit.body);
    expect(body.records[0].fields.Name).toBe('سارة');
    expect(body.records[0].fields.DOB).toBe('2020-01-01');
    expect(body.records[0].fields.ParentEmail).toBe('parent@taaluf.local');
    expect(JSON.stringify(body)).not.toContain(KEY);
  });

  it('writes consents and assessments with schema-safe fields', async () => {
    process.env.AIRTABLE_API_KEY = KEY;
    process.env.AIRTABLE_BASE_ID = BASE;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        records: [{ id: 'recX', fields: {} }],
      }),
    });

    const consent = await syncConsentRecord({
      userId: 'usr_1',
      childId: 'child_1',
      consentType: 'assessment',
      consentText: 'موافقة تقييم تربوي',
    });
    expect(consent.ok).toBe(true);

    const assessment = await syncAssessmentResult({
      childId: 'local_skip_link',
      journeyMode: 'independent_parent',
      totalNeedPercentage: 40,
      overallClassification: 'متوسط',
      suggestedReassessmentDays: 60,
      domainScores: [{ domain: 'التواصل الاستجابي والتعبيري', percentage: 50 }],
      fusedResultsJson: '{}',
      evaluatedAt: '2026-08-14T00:00:00.000Z',
    });
    expect(assessment.ok).toBe(true);

    const consentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(consentBody.records[0].fields.User).toBe('usr_1');
    expect(consentBody.records[0].fields.ConsentType).toBe('assessment');

    const assessBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(assessBody.records[0].fields.Student).toBeUndefined();
    expect(assessBody.records[0].fields.Classification).toBe('متوسط');
    expect(assessBody.records[0].fields.AssessmentType).toBe('أسري مستقل');
  });

  it('retrieves a child without exposing secrets on empty results', async () => {
    process.env.AIRTABLE_API_KEY = KEY;
    process.env.AIRTABLE_BASE_ID = BASE;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ records: [] }),
    });
    const result = await fetchChildRecord('child_1');
    expect(result.source).toBe('airtable');
    expect(result.data).toBeNull();
    expect(JSON.stringify(result)).not.toContain(KEY);
  });

  it('maps a fusion summary into an assessment payload', () => {
    const payload = toSyncAssessmentData({
      childId: 'recAbc',
      journeyMode: 'specialist_guided',
      summary: {
        fusedResults: {},
        domainScores: [{ domain: 'التواصل الاستجابي والتعبيري', percentage: 20, score: 0.6 }],
        totalNeedPercentage: 20,
        overallClassification: 'خفيف',
        suggestedReassessmentDays: 90,
        hasSpecialistSource: true,
        mode: 'comprehensive',
      },
    });
    expect(payload.totalNeedPercentage).toBe(20);
    expect(payload.overallClassification).toBe('خفيف');
    expect(payload.fusedResultsJson).toBe('{}');
  });
});

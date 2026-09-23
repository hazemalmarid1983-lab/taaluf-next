import {
  mapAirtableAssessmentToStored,
  parseDomainAveragesJson,
  parseScoresFromScoresJson,
  pickLatestAirtableAssessment,
  resolveAssessmentPercentage,
  type AirtableAssessmentRecord,
} from '../lib/clinical/mapAirtableAssessmentToStored';
import { hydrateActiveChildClinicalSlice } from '../lib/clinical/hydrateActiveChild';
import { loadStoredAssessments } from '../lib/assessmentHelpers';
import { loadGoalsLocal } from '../lib/goalsStore';
import { ACTIVE_CHILD_KEY } from '../lib/parentJourney';

const memory = new Map<string, string>();
const fetchMock = jest.fn();

beforeEach(() => {
  memory.clear();
  fetchMock.mockReset();
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, String(v)),
      removeItem: (k: string) => memory.delete(k),
    },
  });
  Object.defineProperty(global, 'window', {
    configurable: true,
    value: global,
  });
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('mapAirtableAssessmentToStored', () => {
  it('maps array ScoresJSON to StoredAssessment scores', () => {
    const record: AirtableAssessmentRecord = {
      id: 'recAssess1',
      fields: {
        Classification: 'متوسط',
        TotalScore: 40,
        MaxScore: 108,
        AssessmentDate: '2026-03-01',
        ScoresJSON: JSON.stringify([
          { criterionId: 'C1', score: 2 },
          { criterionId: 'C9', score: 1 },
        ]),
        DomainAveragesJSON: JSON.stringify({ تواصل: 55 }),
      },
    };
    const mapped = mapAirtableAssessmentToStored(record, 'recChild1');
    expect(mapped.id).toBe('recAssess1');
    expect(mapped.studentId).toBe('recChild1');
    expect(mapped.scores).toEqual([
      { criterionId: 'C1', score: 2 },
      { criterionId: 'C9', score: 1 },
    ]);
    expect(mapped.percentage).toBeCloseTo((40 / 108) * 100);
  });

  it('maps fusion object ScoresJSON to scores with clamped fusedScore', () => {
    const record: AirtableAssessmentRecord = {
      id: 'recFusion',
      fields: {
        TotalScore: 35,
        MaxScore: 100,
        Classification: 'خفيف',
        AssessmentDate: '2026-04-01',
        ScoresJSON: JSON.stringify({
          C15: { criterionId: 'C15', fusedScore: 2.8, needLevel: 'شديد' },
          C9: { criterionId: 'C9', fusedScore: 4, needLevel: 'شديد جداً' },
        }),
      },
    };
    const mapped = mapAirtableAssessmentToStored(record, 'recChild1');
    expect(mapped.percentage).toBe(35);
    expect(mapped.scores).toEqual(
      expect.arrayContaining([
        { criterionId: 'C15', score: 2.8 },
        { criterionId: 'C9', score: 3 },
      ])
    );
  });

  it('parses DomainAverages object and array', () => {
    expect(parseDomainAveragesJson(JSON.stringify({ أ: 10, ب: 20 }))).toEqual({
      أ: 10,
      ب: 20,
    });
    expect(
      parseDomainAveragesJson(
        JSON.stringify([{ domain: 'مجال', percentage: 42 }])
      )
    ).toEqual({ مجال: 42 });
  });

  it('returns empty scores for invalid ScoresJSON', () => {
    expect(parseScoresFromScoresJson('not-json')).toEqual([]);
    expect(parseScoresFromScoresJson('{}')).toEqual([]);
    expect(
      mapAirtableAssessmentToStored(
        {
          id: 'recX',
          fields: { ScoresJSON: '{', Classification: 'متوسط', TotalScore: 1 },
        },
        'recChild1'
      ).scores
    ).toEqual([]);
  });

  it('pickLatest uses AssessmentDate not API order', () => {
    const older: AirtableAssessmentRecord = {
      id: 'recOld',
      createdTime: '2026-06-01T00:00:00.000Z',
      fields: { AssessmentDate: '2026-01-01' },
    };
    const newer: AirtableAssessmentRecord = {
      id: 'recNew',
      createdTime: '2026-01-01T00:00:00.000Z',
      fields: { AssessmentDate: '2026-06-15' },
    };
    const picked = pickLatestAirtableAssessment([older, newer]);
    expect(picked?.id).toBe('recNew');
  });

  it('resolveAssessmentPercentage avoids divide by zero', () => {
    expect(resolveAssessmentPercentage(50, 100)).toBe(50);
    expect(resolveAssessmentPercentage(54, 108)).toBeCloseTo(50);
    expect(resolveAssessmentPercentage(10, 0)).toBe(0);
  });
});

describe('hydrateActiveChildClinicalSlice', () => {
  const child = { id: 'recChildHydrate', name: 'ليان', age: 5 };

  function mockSyncAssessments(records: AirtableAssessmentRecord[]) {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: records }),
    });
  }

  it('creates goals only when scores exist and no prior goals', async () => {
    mockSyncAssessments([
      {
        id: 'recAssessGoals',
        fields: {
          AssessmentDate: '2026-05-01',
          Classification: 'شديد',
          TotalScore: 60,
          MaxScore: 100,
          ScoresJSON: JSON.stringify([
            { criterionId: 'C1', score: 3 },
            { criterionId: 'C2', score: 2 },
          ]),
        },
      },
    ]);

    const result = await hydrateActiveChildClinicalSlice(child);
    expect(result.activeSaved).toBe(true);
    expect(result.assessmentHydrated).toBe(true);
    expect(result.goalsCreated).toBe(true);

    const stored = loadStoredAssessments();
    expect(stored.filter((a) => a.id === 'recAssessGoals')).toHaveLength(1);
    expect(stored[0].studentId).toBe('recChildHydrate');

    const goals = loadGoalsLocal('recChildHydrate');
    expect(goals.length).toBeGreaterThan(0);
  });

  it('does not create goals when scores are empty', async () => {
    mockSyncAssessments([
      {
        id: 'recEmptyScores',
        fields: {
          AssessmentDate: '2026-05-01',
          Classification: 'متوسط',
          TotalScore: 40,
          MaxScore: 100,
          ScoresJSON: '{}',
        },
      },
    ]);

    const result = await hydrateActiveChildClinicalSlice(child);
    expect(result.assessmentHydrated).toBe(true);
    expect(result.goalsCreated).toBe(false);
    expect(loadGoalsLocal('recChildHydrate')).toHaveLength(0);
  });

  it('does not replace existing goals', async () => {
    memory.set(
      'taaluf.goals.v1',
      JSON.stringify([
        {
          id: 'tg_existing',
          childId: 'recChildHydrate',
          criterionId: 'C99',
          domain: 'x',
          title: 'existing',
          smartText: 'x',
          baseline: 0,
          target: 30,
          current: 0,
          startDate: new Date().toISOString(),
          targetDate: new Date().toISOString(),
          status: 'active',
          sessions: [],
          lastUpdate: new Date().toISOString(),
        },
      ])
    );

    mockSyncAssessments([
      {
        id: 'recAssess2',
        fields: {
          AssessmentDate: '2026-05-01',
          TotalScore: 50,
          MaxScore: 100,
          ScoresJSON: JSON.stringify([{ criterionId: 'C1', score: 3 }]),
        },
      },
    ]);

    const result = await hydrateActiveChildClinicalSlice(child);
    expect(result.goalsCreated).toBe(false);
    expect(loadGoalsLocal('recChildHydrate')).toHaveLength(1);
    expect(loadGoalsLocal('recChildHydrate')[0].id).toBe('tg_existing');
  });

  it('re-hydrating same child does not duplicate assessment or goals', async () => {
    mockSyncAssessments([
      {
        id: 'recAssessDup',
        fields: {
          AssessmentDate: '2026-05-01',
          TotalScore: 50,
          MaxScore: 100,
          ScoresJSON: JSON.stringify([{ criterionId: 'C1', score: 3 }]),
        },
      },
    ]);

    await hydrateActiveChildClinicalSlice(child);
    await hydrateActiveChildClinicalSlice(child);

    expect(
      loadStoredAssessments().filter((a) => a.id === 'recAssessDup')
    ).toHaveLength(1);
    expect(loadGoalsLocal('recChildHydrate').length).toBeGreaterThan(0);
    const goalCount = loadGoalsLocal('recChildHydrate').length;
    await hydrateActiveChildClinicalSlice(child);
    expect(loadGoalsLocal('recChildHydrate')).toHaveLength(goalCount);
  });

  it('sync failure still saves activeStudent', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    const result = await hydrateActiveChildClinicalSlice(child);
    expect(result.activeSaved).toBe(true);
    expect(result.assessmentHydrated).toBe(false);
    expect(JSON.parse(memory.get(ACTIVE_CHILD_KEY) || '{}').id).toBe(
      'recChildHydrate'
    );
  });

  it('skips Airtable fetch for non-rec child ids', async () => {
    const local = await hydrateActiveChildClinicalSlice({
      id: 'child_local_1',
      name: 'محلي',
    });
    expect(local.activeSaved).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

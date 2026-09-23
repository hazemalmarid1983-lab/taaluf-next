import {
  assessmentRecordMatchesStudentId,
  fetchAssessmentRecords,
} from '../lib/airtableSync';

const KEY = 'patSECRETKEYVALUE99';
const BASE = 'appBASEIDVALUE99';
const CHILD = 'receXLFgpl5Mg0lka';

describe('assessmentRecordMatchesStudentId', () => {
  it('A) includes record when Student linked id matches childId', () => {
    expect(
      assessmentRecordMatchesStudentId(
        { id: 'recA', fields: { Student: [CHILD] } },
        CHILD
      )
    ).toBe(true);
  });

  it('B) excludes record when Student is a different linked id', () => {
    expect(
      assessmentRecordMatchesStudentId(
        { id: 'recB', fields: { Student: ['recOther'] } },
        CHILD
      )
    ).toBe(false);
  });

  it('C) includes record when childId is among multiple linked students', () => {
    expect(
      assessmentRecordMatchesStudentId(
        { id: 'recC', fields: { Student: [CHILD, 'recOther'] } },
        CHILD
      )
    ).toBe(true);
  });

  it('D) excludes safely when Student is missing or null', () => {
    expect(
      assessmentRecordMatchesStudentId({ id: 'recD', fields: {} }, CHILD)
    ).toBe(false);
    expect(
      assessmentRecordMatchesStudentId(
        { id: 'recD2', fields: { Student: null } },
        CHILD
      )
    ).toBe(false);
  });

  it('E) does not match primary display name instead of record id', () => {
    expect(
      assessmentRecordMatchesStudentId(
        { id: 'recE', fields: { Student: ['تامر'] } },
        CHILD
      )
    ).toBe(false);
  });
});

describe('fetchAssessmentRecords', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    process.env.AIRTABLE_API_KEY = KEY;
    process.env.AIRTABLE_BASE_ID = BASE;
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('filters by linked Student record ids without filterByFormula', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            id: 'recMatch1',
            fields: { Student: [CHILD], Classification: 'شديد' },
          },
          {
            id: 'recOther',
            fields: { Student: ['recOtherStudent'] },
          },
          {
            id: 'recMatch2',
            fields: { Student: [CHILD, 'recOtherStudent'] },
          },
        ],
      }),
    });

    const result = await fetchAssessmentRecords(CHILD);

    expect(result.ok).toBe(true);
    expect(result.source).toBe('airtable');
    expect(result.data?.map((r) => r.id)).toEqual(['recMatch1', 'recMatch2']);

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).not.toContain('filterByFormula');
    expect(url).toContain('pageSize=100');
  });

  it('follows pagination offset until exhausted', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            { id: 'recPage1', fields: { Student: [CHILD] } },
          ],
          offset: 'off1',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            { id: 'recPage2', fields: { Student: [CHILD] } },
          ],
        }),
      });

    const result = await fetchAssessmentRecords(CHILD);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.data?.map((r) => r.id)).toEqual(['recPage1', 'recPage2']);
    expect(String(fetchMock.mock.calls[1][0])).toContain('offset=off1');
  });
});

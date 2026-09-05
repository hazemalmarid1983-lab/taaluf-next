import {
  addToCaseload,
  loadLocalStudents,
  readCaseloadIds,
  studentsForSpecialist,
  upsertLocalStudent,
  type SpecialistStudent,
} from '../lib/specialistCaseload';

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

describe('specialist caseload', () => {
  it('lists only students assigned to the specialist', () => {
    const mine: SpecialistStudent = {
      id: 'c1',
      name: 'أحمد',
      specialist_email: 'specialist@taaluf.local',
    };
    const other: SpecialistStudent = {
      id: 'c2',
      name: 'سارة',
      specialist_email: 'other@taaluf.local',
    };
    memory.set('taaluf.students.v1', JSON.stringify([mine, other]));
    addToCaseload('specialist@taaluf.local', 'c1');

    const list = studentsForSpecialist('specialist@taaluf.local');
    expect(list.map((s) => s.id)).toEqual(['c1']);
    expect(readCaseloadIds('specialist@taaluf.local')).toEqual(['c1']);
  });

  it('upserts a local student even without Airtable', () => {
    upsertLocalStudent({
      id: 'child_1',
      name: 'ميار',
      dob: '2019-07-09',
      age: 7,
      parent_name: 'احمد',
      notes: 'غير ناطق',
    });
    expect(loadLocalStudents()[0].name).toBe('ميار');
  });
});

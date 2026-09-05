function storage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

const CASELOAD_PREFIX = 'taaluf.caseload.';

function keyFor(email: string) {
  return `${CASELOAD_PREFIX}${email.trim().toLowerCase()}`;
}

export function readCaseloadIds(email?: string | null): string[] {
  const store = storage();
  if (!email || !store) return [];
  try {
    const raw = store.getItem(keyFor(email));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map(String) : [];
  } catch {
    return [];
  }
}

export function addToCaseload(email: string, studentId: string) {
  const store = storage();
  if (!email || !studentId || !store) return;
  const ids = readCaseloadIds(email);
  if (ids.includes(studentId)) return;
  store.setItem(keyFor(email), JSON.stringify([studentId, ...ids]));
}

export type SpecialistStudent = {
  id: string;
  name: string;
  dob?: string;
  age?: number;
  parent_name?: string;
  parent_phone?: string;
  notes?: string;
  status?: string;
  specialist_email?: string;
  specialist_name?: string;
};

const STUDENTS_KEY = 'taaluf.students.v1';

export function loadLocalStudents(): SpecialistStudent[] {
  const store = storage();
  if (!store) return [];
  try {
    const list = JSON.parse(store.getItem(STUDENTS_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveLocalStudents(rows: SpecialistStudent[]) {
  const store = storage();
  if (!store) return;
  store.setItem(STUDENTS_KEY, JSON.stringify(rows.slice(0, 200)));
}

export function upsertLocalStudent(row: SpecialistStudent) {
  const list = loadLocalStudents();
  saveLocalStudents([row, ...list.filter((s) => s.id !== row.id)]);
  return row;
}

export function studentsForSpecialist(
  email?: string | null,
  extra: SpecialistStudent[] = []
): SpecialistStudent[] {
  const local = loadLocalStudents();
  const merged = [...extra];
  for (const row of local) {
    if (!merged.some((s) => s.id === row.id)) merged.push(row);
  }
  if (!email) return merged;
  const ids = new Set(readCaseloadIds(email));
  const mine = merged.filter(
    (s) =>
      s.specialist_email?.toLowerCase() === email.toLowerCase() ||
      ids.has(s.id)
  );
  return mine.length ? mine : merged.filter((s) => !s.specialist_email);
}

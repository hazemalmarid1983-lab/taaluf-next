/**
 * بوابة غرفة الطفل: لا تُفعَّل الخطة إلا بعد المصادر الأربعة.
 * إكمال جلسة رقمية لا يعني إتقان معيار.
 */

import type { AssessmentScore } from '@/types/taalof';

export const CHILD_ROOM_PATH = '/dashboard/child-room';
export const TEACHER_CHOICE_PATH = '/onboarding/teacher-choice';
export const TEACHER_FORM_PATH = '/onboarding/teacher-form';

const SCREENING_KEY = 'taaluf.screening.v1';
const PARENT_KEY = 'taaluf.parentAssessment.v1';
const GAMES_KEY = 'taaluf.gameSessions.v1';
const INVITES_KEY = 'taaluf.childRoom.invites.v1';
const TEACHER_FORMS_KEY = 'taaluf.childRoom.teacherForms.v1';
const TEACHER_SESSION_KEY = 'taaluf.childRoom.teacherSession.v1';
const TEACHER_NOTES_KEY = 'taaluf.childRoom.teacherNotes.v1';

export type RoomSourceId = 'screening' | 'parent' | 'teacher' | 'child_response';

export type RoomSourceStatus = {
  id: RoomSourceId;
  labelAr: string;
  href: string;
  done: boolean;
};

export type TeacherInvite = {
  token: string;
  childId: string;
  childName: string;
  createdAt: string;
  teacherName?: string;
  passwordHash?: string;
  acceptedAt?: string;
};

export type TeacherFormRecord = {
  childId: string;
  filler: 'teacher' | 'parent';
  teacherName?: string;
  scores: AssessmentScore[];
  savedAt: string;
};

export type TeacherSession = {
  name: string;
  childIds: string[];
};

type ScreeningPayload = {
  childId?: string;
  answers?: Array<{ id?: string; value?: number }>;
  result?: {
    domainScores?: Array<{ label_ar?: string; scorePercent?: number }>;
  };
};

type ParentRow = {
  childId?: string;
  answers?: unknown[];
  mappedScores?: Array<{ criterionId?: string; score?: number }>;
};

type GameRow = { childId?: string; score?: number };

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function screeningPayload(childId: string): ScreeningPayload | null {
  const payload = readJson<ScreeningPayload | null>(SCREENING_KEY, null);
  if (!payload?.result && !(payload?.answers && payload.answers.length > 0)) {
    return null;
  }
  if (
    payload.childId &&
    payload.childId !== childId &&
    payload.childId !== 'child_local'
  ) {
    return null;
  }
  return payload;
}

function parentRow(childId: string): ParentRow | null {
  const rows = readJson<ParentRow[]>(PARENT_KEY, []);
  if (!Array.isArray(rows)) return null;
  return (
    rows.find(
      (row) =>
        row?.childId === childId &&
        ((row.mappedScores?.length ?? 0) > 0 || (row.answers?.length ?? 0) > 0)
    ) ?? null
  );
}

function teacherForm(childId: string): TeacherFormRecord | null {
  const rows = readJson<TeacherFormRecord[]>(TEACHER_FORMS_KEY, []);
  if (!Array.isArray(rows)) return null;
  return rows.find((row) => row?.childId === childId && row.scores?.length > 0) ?? null;
}

function gameRows(childId: string): GameRow[] {
  const rows = readJson<GameRow[]>(GAMES_KEY, []);
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => row?.childId === childId);
}

export function hashRoomPassword(password: string): string {
  let hash = 2166136261;
  for (const char of password) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv_${(hash >>> 0).toString(16)}`;
}

export function listRoomSources(childId: string): RoomSourceStatus[] {
  return [
    {
      id: 'screening',
      labelAr: 'التقييم المجاني السريع',
      href: '/dashboard/screening',
      done: Boolean(screeningPayload(childId)),
    },
    {
      id: 'parent',
      labelAr: 'تقييم ولي الأمر المفصل',
      href: '/dashboard/parent-assessment',
      done: Boolean(parentRow(childId)),
    },
    {
      id: 'teacher',
      labelAr: 'نموذج المدرس',
      href: TEACHER_CHOICE_PATH,
      done: Boolean(teacherForm(childId)),
    },
    {
      id: 'child_response',
      labelAr: 'استجابات الطفل على أدوات الاختبار',
      href: '/dashboard/games',
      done: gameRows(childId).length > 0,
    },
  ];
}

export function isFourSourceGateOpen(childId: string): boolean {
  if (!childId) return false;
  return listRoomSources(childId).every((source) => source.done);
}

export function collectMergedAssessmentScores(childId: string): AssessmentScore[] {
  const byCriterion = new Map<string, number[]>();
  const push = (criterionId: string | undefined, score: number | undefined) => {
    if (!criterionId || !Number.isFinite(Number(score))) return;
    const list = byCriterion.get(criterionId) ?? [];
    list.push(Math.min(3, Math.max(0, Number(score))));
    byCriterion.set(criterionId, list);
  };

  for (const row of parentRow(childId)?.mappedScores ?? []) {
    push(row.criterionId, row.score);
  }
  for (const row of teacherForm(childId)?.scores ?? []) {
    push(row.criterionId, row.score);
  }

  return [...byCriterion.entries()].map(([criterionId, values]) => ({
    criterionId,
    score: Math.min(
      3,
      Math.max(0, values.reduce((sum, value) => sum + value, 0) / values.length)
    ),
  }));
}

export function screeningDomainNeeds(
  childId: string
): Array<{ domain: string; score: number }> {
  const screening = screeningPayload(childId);
  return (screening?.result?.domainScores ?? [])
    .filter((domain) => domain.label_ar)
    .map((domain) => ({
      domain: String(domain.label_ar),
      score: Math.min(3, Math.max(0, Math.round((Number(domain.scorePercent) || 0) / 34))),
    }));
}

export function childResponseNeed(childId: string): number | null {
  const games = gameRows(childId);
  if (games.length === 0) return null;
  const average =
    games.reduce((sum, row) => sum + Number(row.score || 0), 0) / games.length;
  if (average <= 3) return Math.min(3, Math.max(0, 3 - average));
  return Math.min(3, Math.max(0, Math.round(3 - average / 34)));
}

export function createTeacherInvite(childId: string, childName: string): TeacherInvite {
  const invites = readJson<TeacherInvite[]>(INVITES_KEY, []);
  const existing = invites.find(
    (invite) => invite.childId === childId && !invite.acceptedAt
  );
  if (existing) return existing;
  const invite: TeacherInvite = {
    token: `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    childId,
    childName,
    createdAt: new Date().toISOString(),
  };
  writeJson(INVITES_KEY, [invite, ...invites].slice(0, 40));
  return invite;
}

export function readTeacherInvite(token: string): TeacherInvite | null {
  const invites = readJson<TeacherInvite[]>(INVITES_KEY, []);
  return invites.find((invite) => invite.token === token) ?? null;
}

export function acceptTeacherInvite(
  token: string,
  teacherName: string,
  password: string
): TeacherInvite | null {
  const name = teacherName.trim();
  if (!name || password.trim().length < 4) return null;
  const invites = readJson<TeacherInvite[]>(INVITES_KEY, []);
  const index = invites.findIndex((invite) => invite.token === token);
  if (index < 0) return null;
  const current = invites[index];
  const passwordHash = hashRoomPassword(password.trim());
  if (current.passwordHash && current.passwordHash !== passwordHash) return null;
  const next: TeacherInvite = {
    ...current,
    teacherName: name,
    passwordHash,
    acceptedAt: current.acceptedAt ?? new Date().toISOString(),
  };
  invites[index] = next;
  writeJson(INVITES_KEY, invites);
  const session = readJson<TeacherSession>(TEACHER_SESSION_KEY, {
    name,
    childIds: [],
  });
  writeJson(TEACHER_SESSION_KEY, {
    name,
    childIds: [...new Set([...(session.childIds ?? []), next.childId])],
  });
  return next;
}

export function readTeacherSession(): TeacherSession | null {
  const session = readJson<TeacherSession | null>(TEACHER_SESSION_KEY, null);
  if (!session?.name || !Array.isArray(session.childIds)) return null;
  return session;
}

export function saveTeacherForm(record: Omit<TeacherFormRecord, 'savedAt'>) {
  const rows = readJson<TeacherFormRecord[]>(TEACHER_FORMS_KEY, []).filter(
    (row) => row.childId !== record.childId
  );
  writeJson(TEACHER_FORMS_KEY, [
    { ...record, savedAt: new Date().toISOString() },
    ...rows,
  ]);
}

export function listTeacherNotes(childId: string): string[] {
  const rows = readJson<Array<{ childId: string; note: string }>>(TEACHER_NOTES_KEY, []);
  return rows.filter((row) => row.childId === childId).map((row) => row.note);
}

export function addTeacherNote(childId: string, note: string) {
  const text = note.trim();
  if (!text) return;
  const rows = readJson<Array<{ childId: string; note: string }>>(TEACHER_NOTES_KEY, []);
  writeJson(TEACHER_NOTES_KEY, [{ childId, note: text }, ...rows].slice(0, 80));
}

export function assignScreeningToChild(childId: string) {
  const payload = readJson<ScreeningPayload | null>(SCREENING_KEY, null);
  if (!payload) return;
  if (!payload.childId || payload.childId === 'child_local') {
    writeJson(SCREENING_KEY, { ...payload, childId });
  }
}

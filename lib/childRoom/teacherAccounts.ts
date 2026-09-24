/**
 * حسابات المدرسين المُنشأة من رابط الدعوة.
 * كلمة المرور تُخزَّن ببصمة الدخول الرسمية ولا تُعاد في أي استجابة.
 */

import { readHubJsonFile, writeHubJsonFile } from '@/lib/hubPersistence';
import { hashPassword, verifyPassword } from '@/lib/password';

export const TEACHER_ACCOUNTS_FILE = 'teacher-accounts.json';

export type TeacherRoomAssignment = {
  childId: string;
  childName: string;
};

export type TeacherAccount = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  rooms: TeacherRoomAssignment[];
};

type AccountFile = { accounts: TeacherAccount[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function teacherLoginEmail(token: string): string {
  const slug = token.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);
  return `teacher.${slug || 'room'}@teachers.taaluf`;
}

export function teacherMayAccessRoom(
  account: TeacherAccount | null,
  childId: string
): boolean {
  if (!account) return true;
  return account.rooms.some((room) => room.childId === childId);
}

function parseAccounts(raw: string | null): TeacherAccount[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as AccountFile;
    if (!Array.isArray(parsed?.accounts)) return [];
    return parsed.accounts.filter((row) => {
      return (
        isRecord(row) &&
        typeof row.id === 'string' &&
        typeof row.email === 'string' &&
        typeof row.passwordHash === 'string' &&
        Array.isArray(row.rooms)
      );
    }) as TeacherAccount[];
  } catch {
    return [];
  }
}

async function loadAccounts(): Promise<TeacherAccount[]> {
  return parseAccounts(await readHubJsonFile(TEACHER_ACCOUNTS_FILE));
}

async function saveAccounts(accounts: TeacherAccount[]): Promise<void> {
  await writeHubJsonFile(
    TEACHER_ACCOUNTS_FILE,
    JSON.stringify({ accounts: accounts.slice(0, 400) })
  );
}

export async function registerTeacherFromInvite(input: {
  token: string;
  name: string;
  password: string;
  childId: string;
  childName: string;
}): Promise<{ id: string; email: string }> {
  const email = teacherLoginEmail(input.token);
  const passwordHash = await hashPassword(input.password);
  const accounts = await loadAccounts();
  const existing = accounts.find((row) => row.email === email);
  const rooms = [
    ...(existing?.rooms || []).filter((room) => room.childId !== input.childId),
    { childId: input.childId, childName: input.childName || input.childId },
  ];
  const account: TeacherAccount = {
    id: existing?.id || `tch_${input.token.replace(/[^a-z0-9]/gi, '').slice(0, 16)}`,
    email,
    name: input.name.trim(),
    passwordHash,
    rooms,
  };
  const next = existing
    ? accounts.map((row) => (row.email === email ? account : row))
    : [account, ...accounts];
  await saveAccounts(next);
  return { id: account.id, email: account.email };
}

export async function authorizeTeacherAccount(email: string, password: string) {
  const account = (await loadAccounts()).find((row) => row.email === email.trim().toLowerCase());
  if (!account) return null;
  const valid = await verifyPassword(password, account.passwordHash);
  if (!valid) return null;
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    role: 'teacher' as const,
  };
}

export async function findTeacherAccountById(userId: string): Promise<TeacherAccount | null> {
  const id = userId.trim();
  if (!id) return null;
  return (await loadAccounts()).find((row) => row.id === id) ?? null;
}

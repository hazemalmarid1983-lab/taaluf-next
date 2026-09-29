/**
 * حسابات التسجيل الذاتي (ولي أمر / مختص) — محفوظة على الخادم.
 * أدوار الإدارة والمستشار العلمي لا تُنشأ ذاتياً أبداً.
 * كلمة المرور تُخزَّن كبصمة bcrypt ولا تُعاد في أي استجابة.
 */

import { readHubJsonFile, writeHubJsonFileDurable } from '@/lib/hubPersistence';
import { hashPassword, verifyPassword } from '@/lib/password';

export const USER_ACCOUNTS_FILE = 'user-accounts.json';
export const SELF_SIGNUP_ROLES = ['parent', 'specialist'] as const;
export type SelfSignupRole = (typeof SELF_SIGNUP_ROLES)[number];
export const SIGNUP_PASSWORD_MIN_LENGTH = 8;
const MAX_ACCOUNTS = 5000;

/** نطاقات محجوزة للحسابات الداخلية (تجريبية/مدرّسين) */
const RESERVED_EMAIL_DOMAINS = ['taaluf.local', 'teachers.taaluf'];

export type UserAccount = {
  id: string;
  email: string;
  name: string;
  role: SelfSignupRole;
  passwordHash: string;
  createdAt: string;
};

export type SignupInput = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  role?: unknown;
};

export type SignupError =
  | 'NAME_REQUIRED'
  | 'EMAIL_INVALID'
  | 'EMAIL_RESERVED'
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORD_MISMATCH'
  | 'ROLE_NOT_ALLOWED'
  | 'EMAIL_TAKEN';

export type ValidSignup = { name: string; email: string; password: string; role: SelfSignupRole };

export function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function isSelfSignupRole(value: unknown): value is SelfSignupRole {
  return (SELF_SIGNUP_ROLES as readonly unknown[]).includes(value);
}

export function validateSignup(
  input: SignupInput
): { ok: true; value: ValidSignup } | { ok: false; error: SignupError } {
  const name = String(input.name ?? '').trim();
  const email = normalizeEmail(input.email);
  const password = String(input.password ?? '');
  if (name.length < 2 || name.length > 80) return { ok: false, error: 'NAME_REQUIRED' };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'EMAIL_INVALID' };
  }
  const domain = email.split('@')[1];
  if (RESERVED_EMAIL_DOMAINS.some((reserved) => domain === reserved || domain.endsWith(`.${reserved}`))) {
    return { ok: false, error: 'EMAIL_RESERVED' };
  }
  if (password.length < SIGNUP_PASSWORD_MIN_LENGTH || password.length > 128) {
    return { ok: false, error: 'PASSWORD_TOO_SHORT' };
  }
  if (input.confirmPassword !== undefined && input.confirmPassword !== password) {
    return { ok: false, error: 'PASSWORD_MISMATCH' };
  }
  if (!isSelfSignupRole(input.role)) return { ok: false, error: 'ROLE_NOT_ALLOWED' };
  return { ok: true, value: { name, email, password, role: input.role } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseUserAccounts(raw: string | null): UserAccount[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { accounts?: unknown };
    if (!Array.isArray(parsed?.accounts)) return [];
    return parsed.accounts.filter(
      (row): row is UserAccount =>
        isRecord(row) &&
        typeof row.id === 'string' &&
        typeof row.email === 'string' &&
        typeof row.passwordHash === 'string' &&
        isSelfSignupRole(row.role)
    );
  } catch {
    return [];
  }
}

async function loadAccounts(): Promise<UserAccount[]> {
  return parseUserAccounts(await readHubJsonFile(USER_ACCOUNTS_FILE));
}

export async function findUserAccountByEmail(email: string): Promise<UserAccount | null> {
  const target = normalizeEmail(email);
  return (await loadAccounts()).find((row) => row.email === target) ?? null;
}

export async function registerUserAccount(
  input: SignupInput
): Promise<{ ok: true; account: Omit<UserAccount, 'passwordHash'> } | { ok: false; error: SignupError }> {
  const checked = validateSignup(input);
  if (!checked.ok) return checked;
  const { name, email, password, role } = checked.value;

  const accounts = await loadAccounts();
  if (accounts.some((row) => row.email === email)) return { ok: false, error: 'EMAIL_TAKEN' };

  const account: UserAccount = {
    id: `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    email,
    name,
    role,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  await writeHubJsonFileDurable(
    USER_ACCOUNTS_FILE,
    JSON.stringify({ accounts: [account, ...accounts].slice(0, MAX_ACCOUNTS) })
  );
  return {
    ok: true,
    account: { id: account.id, email, name, role, createdAt: account.createdAt },
  };
}

export async function authorizeUserAccount(email: string, password: string) {
  const account = await findUserAccountByEmail(email);
  if (!account) return null;
  if (!(await verifyPassword(password, account.passwordHash))) return null;
  return { id: account.id, email: account.email, name: account.name, role: account.role };
}

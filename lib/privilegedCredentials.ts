import { promises as fs } from 'fs';
import path from 'path';
import { getHubDataDir } from '@/lib/hubDataDir';
import { hashPassword, verifyPassword } from '@/lib/password';

export type PrivilegedAccountId = 'admin' | 'advisor';

export type PrivilegedCredentialRecord = {
  password_hash: string;
  updatedAt: string;
};

export type PrivilegedCredentialsFile = {
  version: 1;
  accounts: Partial<Record<PrivilegedAccountId, PrivilegedCredentialRecord>>;
};

const DATA_FILE = path.join(getHubDataDir(), 'privileged-credentials.json');

const EMAIL_TO_ACCOUNT: Record<string, PrivilegedAccountId> = {
  'admin@taaluf.local': 'admin',
  'samer@taaluf.local': 'advisor',
  'advisor@taaluf.local': 'advisor',
};

const memory: PrivilegedCredentialsFile = { version: 1, accounts: {} };
let loaded = false;

function nowIso() {
  return new Date().toISOString();
}

export function privilegedAccountIdForEmail(
  email: string
): PrivilegedAccountId | null {
  return EMAIL_TO_ACCOUNT[email.trim().toLowerCase()] ?? null;
}

export function isPrivilegedLoginEmail(email: string) {
  return privilegedAccountIdForEmail(email) != null;
}

async function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PrivilegedCredentialsFile>;
    memory.accounts = parsed.accounts ?? {};
  } catch {
    memory.accounts = {};
  }
}

async function persist() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(memory, null, 2), 'utf8');
}

export async function getPrivilegedPasswordHash(
  email: string
): Promise<string | null> {
  const accountId = privilegedAccountIdForEmail(email);
  if (!accountId) return null;
  await ensureLoaded();
  return memory.accounts[accountId]?.password_hash ?? null;
}

export async function hasCustomPrivilegedPassword(email: string) {
  const hash = await getPrivilegedPasswordHash(email);
  return Boolean(hash);
}

export async function verifyPrivilegedLogin(
  email: string,
  password: string,
  fallbackHash: string
): Promise<boolean> {
  const custom = await getPrivilegedPasswordHash(email);
  const hash = custom ?? fallbackHash;
  return verifyPassword(password, hash);
}

export async function changePrivilegedPassword(input: {
  email: string;
  currentPassword: string;
  newPassword: string;
  fallbackHash: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const accountId = privilegedAccountIdForEmail(input.email);
  if (!accountId) return { ok: false, code: 'NOT_PRIVILEGED' };

  const validCurrent = await verifyPrivilegedLogin(
    input.email,
    input.currentPassword,
    input.fallbackHash
  );
  if (!validCurrent) return { ok: false, code: 'CURRENT_INVALID' };

  if (input.newPassword.length < 8) {
    return { ok: false, code: 'PASSWORD_TOO_SHORT' };
  }
  if (input.newPassword !== input.newPassword.trim()) {
    return { ok: false, code: 'PASSWORD_SPACES' };
  }
  if (input.newPassword === input.currentPassword) {
    return { ok: false, code: 'PASSWORD_SAME' };
  }

  await ensureLoaded();
  memory.accounts[accountId] = {
    password_hash: await hashPassword(input.newPassword),
    updatedAt: nowIso(),
  };
  await persist();
  return { ok: true };
}

/** للاختبارات — إعادة ضبط الذاكرة */
export function resetPrivilegedCredentialsMemoryForTests() {
  loaded = false;
  memory.accounts = {};
}

export function privilegedCredentialsFilePath() {
  return DATA_FILE;
}

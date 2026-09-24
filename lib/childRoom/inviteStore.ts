/**
 * سجل دعوات المدرس على الخادم (Blob في الإنتاج، ملف محلي في التطوير).
 * كلمة المرور تُخزَّن كبصمة فقط ولا تُعاد في الاستجابات.
 */

import { hashRoomPassword, type TeacherFormRecord } from '@/lib/childRoom/gate';
import { readHubJsonFile, writeHubJsonFile } from '@/lib/hubPersistence';

export const TEACHER_INVITES_FILE = 'teacher-invites.json';

export type ServerTeacherInvite = {
  token: string;
  childId: string;
  childName: string;
  createdAt: string;
  teacherName?: string;
  passwordHash?: string;
  acceptedAt?: string;
  form?: TeacherFormRecord;
};

type InviteFile = { invites: ServerTeacherInvite[] };

export type PublicTeacherInvite = {
  token: string;
  childId: string;
  childName: string;
  createdAt: string;
  teacherName?: string;
  accepted: boolean;
  formDone: boolean;
  path: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function sanitizeInvite(value: unknown): ServerTeacherInvite | null {
  if (!isRecord(value)) return null;
  const token = typeof value.token === 'string' ? value.token.trim() : '';
  const childId = typeof value.childId === 'string' ? value.childId.trim() : '';
  const childName = typeof value.childName === 'string' ? value.childName.trim() : '';
  if (!token || !childId || !childName) return null;
  const invite: ServerTeacherInvite = {
    token,
    childId,
    childName,
    createdAt:
      typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
  };
  if (typeof value.teacherName === 'string' && value.teacherName.trim()) {
    invite.teacherName = value.teacherName.trim();
  }
  if (typeof value.passwordHash === 'string' && value.passwordHash) {
    invite.passwordHash = value.passwordHash;
  }
  if (typeof value.acceptedAt === 'string' && value.acceptedAt) {
    invite.acceptedAt = value.acceptedAt;
  }
  if (isRecord(value.form) && Array.isArray(value.form.scores)) {
    const scores = value.form.scores
      .filter((row) => isRecord(row) && typeof row.criterionId === 'string')
      .map((row) => ({
        criterionId: String(row.criterionId),
        score: Number(row.score),
      }));
    if (scores.length > 0) {
      invite.form = {
        childId,
        filler: value.form.filler === 'parent' ? 'parent' : 'teacher',
        teacherName: invite.teacherName,
        scores,
        savedAt:
          typeof value.form.savedAt === 'string'
            ? value.form.savedAt
            : new Date().toISOString(),
      };
    }
  }
  return invite;
}

export function parseInviteFile(raw: string | null): InviteFile {
  if (!raw) return { invites: [] };
  try {
    const parsed = JSON.parse(raw) as { invites?: unknown };
    const invites = Array.isArray(parsed.invites)
      ? parsed.invites
          .map(sanitizeInvite)
          .filter((item): item is ServerTeacherInvite => Boolean(item))
      : [];
    return { invites };
  } catch {
    return { invites: [] };
  }
}

export function toPublicInvite(invite: ServerTeacherInvite): PublicTeacherInvite {
  return {
    token: invite.token,
    childId: invite.childId,
    childName: invite.childName,
    createdAt: invite.createdAt,
    teacherName: invite.teacherName,
    accepted: Boolean(invite.acceptedAt),
    formDone: Boolean(invite.form?.scores?.length),
    path: `/invite/teacher/${invite.token}`,
  };
}

export function createInviteRecord(
  invites: ServerTeacherInvite[],
  childId: string,
  childName: string
): { invites: ServerTeacherInvite[]; invite: ServerTeacherInvite } {
  const open = invites.find((item) => item.childId === childId && !item.form);
  if (open) return { invites, invite: open };
  const invite: ServerTeacherInvite = {
    token: `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    childId,
    childName,
    createdAt: new Date().toISOString(),
  };
  return { invites: [invite, ...invites].slice(0, 200), invite };
}

export function acceptInviteRecord(
  invites: ServerTeacherInvite[],
  token: string,
  teacherName: string,
  password: string
): { ok: true; invites: ServerTeacherInvite[]; invite: ServerTeacherInvite } | { ok: false; error: string } {
  const name = teacherName.trim();
  if (!name || password.trim().length < 4) {
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }
  const index = invites.findIndex((item) => item.token === token);
  if (index < 0) return { ok: false, error: 'INVITE_NOT_FOUND' };
  const current = invites[index];
  const passwordHash = hashRoomPassword(password.trim());
  if (current.passwordHash && current.passwordHash !== passwordHash) {
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }
  const invite: ServerTeacherInvite = {
    ...current,
    teacherName: name,
    passwordHash,
    acceptedAt: current.acceptedAt ?? new Date().toISOString(),
  };
  const next = [...invites];
  next[index] = invite;
  return { ok: true, invites: next, invite };
}

export function attachTeacherForm(
  invites: ServerTeacherInvite[],
  token: string,
  scores: Array<{ criterionId: string; score: number }>
): { ok: true; invites: ServerTeacherInvite[]; invite: ServerTeacherInvite } | { ok: false; error: string } {
  const index = invites.findIndex((item) => item.token === token);
  if (index < 0) return { ok: false, error: 'INVITE_NOT_FOUND' };
  const current = invites[index];
  if (!current.acceptedAt) return { ok: false, error: 'INVITE_NOT_ACCEPTED' };
  const clean = scores.filter((row) => row.criterionId && Number.isFinite(row.score));
  if (clean.length === 0) return { ok: false, error: 'SCORES_REQUIRED' };
  const invite: ServerTeacherInvite = {
    ...current,
    form: {
      childId: current.childId,
      filler: 'teacher',
      teacherName: current.teacherName,
      scores: clean.map((row) => ({
        criterionId: row.criterionId,
        score: Math.min(3, Math.max(0, Number(row.score))),
      })),
      savedAt: new Date().toISOString(),
    },
  };
  const next = [...invites];
  next[index] = invite;
  return { ok: true, invites: next, invite };
}

export async function loadTeacherInvites(): Promise<ServerTeacherInvite[]> {
  const raw = await readHubJsonFile(TEACHER_INVITES_FILE);
  return parseInviteFile(raw).invites;
}

export async function saveTeacherInvites(invites: ServerTeacherInvite[]): Promise<void> {
  const publicSafe = invites.map((invite) => ({ ...invite }));
  await writeHubJsonFile(TEACHER_INVITES_FILE, JSON.stringify({ invites: publicSafe }));
}

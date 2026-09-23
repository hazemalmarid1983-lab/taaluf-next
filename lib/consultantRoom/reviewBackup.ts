import {
  CONSULTANT_REVIEW_STORAGE_KEY,
  getReviewProgressSummary,
  saveReviewResponses,
} from '@/lib/consultantRoom/reviewProgress';
import type { ReviewResponsesState } from '@/lib/consultantRoom/types';

export const REVIEW_BACKUP_VERSION = 1 as const;

export type ReviewBackupPayload = {
  version: typeof REVIEW_BACKUP_VERSION;
  exportedAt: string;
  storageKey: typeof CONSULTANT_REVIEW_STORAGE_KEY;
  responses: ReviewResponsesState;
  summary: ReturnType<typeof getReviewProgressSummary>;
};

export function buildReviewBackupPayload(
  responses: ReviewResponsesState
): ReviewBackupPayload {
  return {
    version: REVIEW_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    storageKey: CONSULTANT_REVIEW_STORAGE_KEY,
    responses,
    summary: getReviewProgressSummary(responses),
  };
}

export function serializeReviewBackup(responses: ReviewResponsesState): string {
  return JSON.stringify(buildReviewBackupPayload(responses), null, 2);
}

export function parseReviewBackup(
  raw: string
):
  | { ok: true; payload: ReviewBackupPayload }
  | { ok: false; code: 'INVALID_JSON' | 'INVALID_SHAPE' | 'WRONG_VERSION' } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, code: 'INVALID_JSON' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, code: 'INVALID_SHAPE' };
  }

  const payload = parsed as Partial<ReviewBackupPayload>;
  if (payload.version !== REVIEW_BACKUP_VERSION) {
    return { ok: false, code: 'WRONG_VERSION' };
  }
  if (
    payload.storageKey !== CONSULTANT_REVIEW_STORAGE_KEY ||
    !payload.responses ||
    typeof payload.responses !== 'object'
  ) {
    return { ok: false, code: 'INVALID_SHAPE' };
  }

  return { ok: true, payload: payload as ReviewBackupPayload };
}

/** استبدال الإجابات المحلية من ملف نسخ احتياطي */
export function importReviewBackup(raw: string):
  | { ok: true; state: ReviewResponsesState }
  | { ok: false; code: string } {
  const parsed = parseReviewBackup(raw);
  if (!parsed.ok) return parsed;
  saveReviewResponses(parsed.payload.responses);
  return { ok: true, state: parsed.payload.responses };
}

export function reviewBackupFileName(exportedAt = new Date()): string {
  const stamp = exportedAt.toISOString().slice(0, 10);
  return `taaluf-consultant-review-${stamp}.json`;
}

/**
 * مسودة الجلسة الحية — محاولات مرتبطة بـ session.id.
 * تُفقد من ذاكرة React عند التحديث، وتُستعاد من التخزين المحلي المؤقت.
 * ليست سجل الجلسة المكتملة.
 */

import { startTrial } from '@/lib/training/engine';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';
import { validateTrainingSessionRuntime } from '@/lib/training/engine/validate';
import {
  getTrainingStorageAdapter,
  type TrainingStorageAdapter,
} from '@/lib/training/storage/adapter';
import { TRAINING_STORAGE } from '@/lib/tracks/storageKeys';

const KEY = TRAINING_STORAGE.liveSessions;
const MAX_DRAFTS = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function slotOf(session: Pick<TrainingSessionRuntime, 'childId' | 'chapterId' | 'mediaId'>) {
  return `${session.childId}::${session.chapterId}::${session.mediaId}`;
}

function readDrafts(adapter: TrainingStorageAdapter): TrainingSessionRuntime[] {
  try {
    const raw = adapter.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is TrainingSessionRuntime => {
      if (!isRecord(item)) return false;
      return validateTrainingSessionRuntime(item).valid && item.status === 'active';
    });
  } catch {
    return [];
  }
}

function writeDrafts(adapter: TrainingStorageAdapter, drafts: TrainingSessionRuntime[]) {
  try {
    adapter.setItem(KEY, JSON.stringify(drafts.slice(0, MAX_DRAFTS)));
  } catch {
    /* الحصة أو التصفح الخاص — المحاولة تبقى في الذاكرة */
  }
}

export function saveLiveTrainingSession(session: TrainingSessionRuntime): void {
  if (session.status !== 'active') return;
  if (!validateTrainingSessionRuntime(session).valid) return;

  const adapter = getTrainingStorageAdapter();
  const slot = slotOf(session);
  const next = [
    session,
    ...readDrafts(adapter).filter(
      (item) => item.id !== session.id && slotOf(item) !== slot
    ),
  ];
  writeDrafts(adapter, next);
}

export function readLiveTrainingSession(
  sessionId: string
): TrainingSessionRuntime | null {
  const id = sessionId.trim();
  if (!id) return null;
  return readDrafts(getTrainingStorageAdapter()).find((item) => item.id === id) ?? null;
}

export function findOpenLiveTrainingSession(input: {
  childId: string;
  chapterId: string;
  mediaId: string;
}): TrainingSessionRuntime | null {
  const slot = slotOf(input);
  return (
    readDrafts(getTrainingStorageAdapter()).find((item) => slotOf(item) === slot) ??
    null
  );
}

export function clearLiveTrainingSession(sessionId: string): void {
  const id = sessionId.trim();
  if (!id) return;
  const adapter = getTrainingStorageAdapter();
  const next = readDrafts(adapter).filter((item) => item.id !== id);
  if (next.length === 0) {
    try {
      adapter.removeItem(KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  writeDrafts(adapter, next);
}

export function clearLiveTrainingSessions(): void {
  try {
    getTrainingStorageAdapter().removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function prepareLiveActivitySession(
  session: TrainingSessionRuntime,
  resumeTrial: (session: TrainingSessionRuntime) => TrainingSessionRuntime = startTrial
): { action: 'play' | 'finalize'; session: TrainingSessionRuntime } {
  if (
    session.status === 'active' &&
    session.activeTrialNumber === undefined &&
    session.trials.length >= session.targetTrialCount
  ) {
    return { action: 'finalize', session };
  }

  if (session.activeTrialNumber !== undefined) {
    return { action: 'play', session };
  }

  return { action: 'play', session: resumeTrial(session) };
}

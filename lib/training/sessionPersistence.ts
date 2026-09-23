/**
 * ربط اكتمال الجلسة بالتخزين المحلي — طبقة منفصلة عن UI.
 */

import { calculateSessionMetrics } from '@/lib/training/engine/metrics';
import type { TrainingSessionMetrics } from '@/lib/training/engine/types';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';
import { applyTrainingSessionToTrackedGoals } from '@/lib/training/goalFeedback';
import {
  ensureCompletionApplyRecord,
  getCompletionApplyRecord,
  getTrainingProgress,
  getTrainingSession,
  inferLegacyCompletionFullyApplied,
  markCompletionGoalsApplied,
  markCompletionProgressApplied,
  saveTrainingProgress,
  saveTrainingSession,
} from '@/lib/training/storage';
import type { TrainingProgress } from '@/lib/training/types';

/**
 * مؤشر تقدم أولي (Progress indicator) — وليس:
 * - قرار إتقان سريري
 * - Adaptive Engine
 * - تشخيص أو تصنيف طبي
 *
 * independenceRate يُشتق من TrainingTrial.promptLevel:
 * independent = أنجز دون مساعدة رقمية/بشرية مسجّلة — وليس من سرعة الاستجابة.
 *
 * القيم emerging → developing → mastered تُشتق من آخر جلسة مكتملة
 * وعدد الجلسات التراكمي، وتُستخدم لعرض/تخزين التقدم فقط.
 */
export function deriveTrainingMasteryLevel(
  accuracy: number,
  independence: number,
  completedSessions: number
): NonNullable<TrainingProgress['masteryLevel']> {
  if (completedSessions >= 3 && accuracy >= 80 && independence >= 70) {
    return 'mastered';
  }
  if (completedSessions >= 2 && accuracy >= 55) {
    return 'developing';
  }
  if (completedSessions >= 1) {
    return 'emerging';
  }
  return 'not_started';
}

export function buildUpdatedTrainingProgress(
  existing: TrainingProgress | null,
  session: TrainingSessionRuntime,
  metrics: TrainingSessionMetrics
): TrainingProgress {
  const completedSessions = (existing?.completedSessions ?? 0) + 1;

  return {
    childId: session.childId,
    chapterId: session.chapterId,
    mediaId: session.mediaId,
    completedSessions,
    lastDifficulty: session.difficulty,
    independenceRate: metrics.independence,
    lastSessionAt: session.endedAt ?? new Date().toISOString(),
    masteryLevel: deriveTrainingMasteryLevel(
      metrics.accuracy,
      metrics.independence,
      completedSessions
    ),
  };
}

export type PersistCompletedTrainingSessionResult = {
  session: TrainingSessionRuntime;
  progress: TrainingProgress;
  metrics: TrainingSessionMetrics;
  /** false when completion side effects were already applied for this session.id */
  applied: boolean;
};

function completionEffectsAlreadyApplied(sessionId: string): boolean {
  const ledger = getCompletionApplyRecord(sessionId);
  if (ledger) {
    return ledger.progressApplied && ledger.goalsApplied;
  }
  const stored = getTrainingSession(sessionId);
  return inferLegacyCompletionFullyApplied(
    sessionId,
    stored?.status === 'completed'
  );
}

export function persistCompletedTrainingSession(
  session: TrainingSessionRuntime
): PersistCompletedTrainingSessionResult {
  if (session.status !== 'completed') {
    throw new Error('لا يمكن حفظ جلسة غير مكتملة');
  }

  const metrics = calculateSessionMetrics(session.trials);

  if (completionEffectsAlreadyApplied(session.id)) {
    const stored =
      getTrainingSession(session.id) ??
      saveTrainingSession(session);
    const progress =
      getTrainingProgress(
        session.childId,
        session.chapterId,
        session.mediaId
      ) ??
      buildUpdatedTrainingProgress(null, session, metrics);
    return { session: stored, progress, metrics, applied: false };
  }

  ensureCompletionApplyRecord(session.id);
  const ledger = getCompletionApplyRecord(session.id)!;

  saveTrainingSession(session);

  let progress: TrainingProgress;
  if (!ledger.progressApplied) {
    const existing = getTrainingProgress(
      session.childId,
      session.chapterId,
      session.mediaId
    );
    progress = buildUpdatedTrainingProgress(existing, session, metrics);
    saveTrainingProgress(progress);
    markCompletionProgressApplied(session.id);
  } else {
    progress =
      getTrainingProgress(
        session.childId,
        session.chapterId,
        session.mediaId
      ) ?? buildUpdatedTrainingProgress(null, session, metrics);
  }

  if (!getCompletionApplyRecord(session.id)?.goalsApplied) {
    applyTrainingSessionToTrackedGoals(session, metrics);
    markCompletionGoalsApplied(session.id);
  }

  return { session, progress, metrics, applied: true };
}

export function readActiveTrainingChildId(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('taaluf.activeStudent');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string };
    const id = parsed?.id?.trim();
    return id ? id : null;
  } catch {
    return null;
  }
}

export function readTrainingChildId(fallback = 'child_local'): string {
  return readActiveTrainingChildId() ?? fallback;
}

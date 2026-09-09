/**
 * محرك جلسات التدريب — إنشاء جلسة، محاولات، وإنهاء مع المقاييس.
 */

import type { TrainingTrial } from '@/lib/training/types';
import { resolveMediaRuntimeConfig } from '@/lib/training/engine/mediaLoader';
import { calculateSessionMetrics } from '@/lib/training/engine/metrics';
import {
  assertValidRecordTrainingTrialInput,
  assertValidTrainingTrial,
  validateTrainingSessionRuntime,
} from '@/lib/training/engine/validate';
import type {
  CreateTrainingSessionInput,
  RecordTrainingTrialInput,
  TrainingSessionRuntime,
} from '@/lib/training/engine/types';
import { TrainingEngineError } from '@/lib/training/engine/types';

function createSessionId(): string {
  return `training_session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function assertSessionActive(session: TrainingSessionRuntime) {
  if (session.status === 'completed') {
    throw new TrainingEngineError(
      'SESSION_ALREADY_COMPLETED',
      'الجلسة منتهية ولا يمكن تعديلها'
    );
  }
}

/** ينشئ جلسة تدريب جديدة من وسيلة محمّلة */
export function createTrainingSession(
  input: CreateTrainingSessionInput
): TrainingSessionRuntime {
  const runtimeConfig = resolveMediaRuntimeConfig(
    input.media,
    input.difficulty
  );

  const session: TrainingSessionRuntime = {
    id: input.id ?? createSessionId(),
    childId: input.childId,
    chapterId: input.chapterId,
    mediaId: input.media.mediaId,
    planId: input.planId,
    ...(input.goalIds?.length ? { goalIds: [...new Set(input.goalIds)] } : {}),
    difficulty: runtimeConfig.difficulty,
    startedAt: input.startedAt ?? new Date().toISOString(),
    trials: [],
    status: 'active',
    targetTrialCount: runtimeConfig.trialCount,
  };

  const validation = validateTrainingSessionRuntime(session);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  return session;
}

/** يبدأ محاولة جديدة داخل الجلسة النشطة */
export function startTrial(session: TrainingSessionRuntime): TrainingSessionRuntime {
  assertSessionActive(session);

  if (session.activeTrialNumber !== undefined) {
    throw new TrainingEngineError(
      'TRIAL_ALREADY_ACTIVE',
      `المحاولة ${session.activeTrialNumber} لا تزال نشطة`
    );
  }

  if (session.trials.length >= session.targetTrialCount) {
    throw new TrainingEngineError(
      'MAX_TRIALS_REACHED',
      `تم الوصول إلى الحد الأقصى (${session.targetTrialCount})`
    );
  }

  return {
    ...session,
    activeTrialNumber: session.trials.length + 1,
  };
}

/** يسجّل وينهي المحاولة النشطة */
export function recordTrial(
  session: TrainingSessionRuntime,
  input: RecordTrainingTrialInput
): TrainingSessionRuntime {
  assertSessionActive(session);
  assertValidRecordTrainingTrialInput(input);

  if (session.activeTrialNumber === undefined) {
    throw new TrainingEngineError(
      'NO_ACTIVE_TRIAL',
      'لا توجد محاولة نشطة — استخدم startTrial أولاً'
    );
  }

  const trial: TrainingTrial = {
    trialNumber: session.activeTrialNumber,
    correct: input.correct,
    promptLevel: input.promptLevel,
    responseTimeMs: input.responseTimeMs,
    recordedAt: input.recordedAt ?? new Date().toISOString(),
  };

  assertValidTrainingTrial(trial);

  const nextSession: TrainingSessionRuntime = {
    ...session,
    activeTrialNumber: undefined,
    trials: [...session.trials, trial],
  };

  const validation = validateTrainingSessionRuntime(nextSession);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  return nextSession;
}

/** ينهي الجلسة ويحسب المقاييس */
export function endTrainingSession(
  session: TrainingSessionRuntime,
  endedAt?: string
): TrainingSessionRuntime {
  assertSessionActive(session);

  if (session.activeTrialNumber !== undefined) {
    throw new TrainingEngineError(
      'TRIAL_ALREADY_ACTIVE',
      `أنهِ المحاولة ${session.activeTrialNumber} قبل إغلاق الجلسة`
    );
  }

  const metrics = calculateSessionMetrics(session.trials);
  const closedAt = endedAt ?? new Date().toISOString();

  const completed: TrainingSessionRuntime = {
    ...session,
    status: 'completed',
    endedAt: closedAt,
    independenceRate: metrics.independence,
    metrics: {
      accuracy: metrics.accuracy,
      independence: metrics.independence,
      averageResponseTimeMs: metrics.averageResponseTimeMs ?? 0,
      correctCount: metrics.correctCount,
      incorrectCount: metrics.incorrectCount,
      totalTrials: metrics.totalTrials,
    },
  };

  const validation = validateTrainingSessionRuntime(completed);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  return completed;
}

/** ينفّذ حلقة محاولات كاملة — مفيد للاختبارات والمحاكاة */
export function runTrainingTrialLoop(
  session: TrainingSessionRuntime,
  trials: RecordTrainingTrialInput[]
): TrainingSessionRuntime {
  let current = session;
  for (const trialInput of trials) {
    current = startTrial(current);
    current = recordTrial(current, trialInput);
  }
  return endTrainingSession(current);
}

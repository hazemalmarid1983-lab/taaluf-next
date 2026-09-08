/**
 * أنواع محرك التدريب — مرحلة 2 (جلسات ومحاولات وقت التشغيل).
 */

import type {
  TrainingDifficulty,
  TrainingMedia,
  TrainingMediaConfig,
  TrainingPromptLevel,
  TrainingSession,
  TrainingTrial,
} from '@/lib/training/types';
import type { TrainingPromptBreakdown } from '@/lib/training/engine/promptLevels';

export type TrainingSessionStatus = 'active' | 'completed';

/** جلسة وقت التشغيل — تمتد TrainingSession بحالة المحاولة النشطة */
export type TrainingSessionRuntime = TrainingSession & {
  status: TrainingSessionStatus;
  targetTrialCount: number;
  activeTrialNumber?: number;
};

export type CreateTrainingSessionInput = {
  id?: string;
  childId: string;
  chapterId: string;
  media: TrainingMedia;
  difficulty?: TrainingDifficulty;
  planId?: string;
  startedAt?: string;
};

export type RecordTrainingTrialInput = {
  correct: boolean;
  promptLevel: TrainingPromptLevel;
  responseTimeMs?: number;
  recordedAt?: string;
};

export type ResolvedMediaConfig = {
  engineType: TrainingMedia['engineType'];
  trialCount: number;
  difficulty: TrainingDifficulty;
  prompting: boolean;
  reinforcement: boolean;
  choices?: number;
  distractorCount?: number;
  displayDurationMs?: number;
  hideDurationMs?: number;
  waitDurationMs?: number;
  movementSpeed?: number;
  reinforcementType?: string;
  prematureResponseAllowed?: boolean;
  responseWindowMs?: number;
  matchLevel?: number;
  content?: Record<string, unknown>;
  raw: TrainingMediaConfig;
};

export type TrainingSessionMetrics = {
  accuracy: number;
  independence: number;
  averageResponseTimeMs: number | null;
  correctCount: number;
  incorrectCount: number;
  totalTrials: number;
  promptBreakdown: TrainingPromptBreakdown;
};

export type TrainingEngineErrorCode =
  | 'SESSION_NOT_ACTIVE'
  | 'SESSION_ALREADY_COMPLETED'
  | 'TRIAL_ALREADY_ACTIVE'
  | 'NO_ACTIVE_TRIAL'
  | 'MAX_TRIALS_REACHED'
  | 'MEDIA_NOT_FOUND'
  | 'INVALID_DIFFICULTY';

export class TrainingEngineError extends Error {
  readonly code: TrainingEngineErrorCode;

  constructor(code: TrainingEngineErrorCode, message: string) {
    super(message);
    this.name = 'TrainingEngineError';
    this.code = code;
  }
}

export type { TrainingTrial, TrainingSession };

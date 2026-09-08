/**
 * محرك التدريب الداخلي — منصة تآلف (مرحلة 2)
 */

export {
  TRAINING_PROMPT_LEVELS,
  TRAINING_DIGITAL_PROMPT_LEVELS,
  countTrainingPromptBreakdown,
  emptyTrainingPromptBreakdown,
  isDigitalAssistancePrompt,
  isIndependentPrompt,
  isPromptedLevel,
  isTrainingPromptLevel,
  trainingIndependencePercentage,
} from '@/lib/training/engine/promptLevels';

export {
  isValidTrainingDifficulty,
  loadTrainingMedia,
  requireTrainingMedia,
  resolveMediaRuntimeConfig,
} from '@/lib/training/engine/mediaLoader';

export {
  assertValidRecordTrainingTrialInput,
  assertValidTrainingSession,
  assertValidTrainingTrial,
  validateRecordTrainingTrialInput,
  validateTrainingSession,
  validateTrainingSessionRuntime,
  validateTrainingTrial,
} from '@/lib/training/engine/validate';

export {
  calculateAccuracy,
  calculateAverageResponseTimeMs,
  calculateSessionMetrics,
} from '@/lib/training/engine/metrics';

export {
  createTrainingSession,
  endTrainingSession,
  recordTrial,
  runTrainingTrialLoop,
  startTrial,
} from '@/lib/training/engine/sessionEngine';

export {
  TrainingEngineError,
  type CreateTrainingSessionInput,
  type RecordTrainingTrialInput,
  type ResolvedMediaConfig,
  type TrainingEngineErrorCode,
  type TrainingSessionMetrics,
  type TrainingSessionRuntime,
  type TrainingSessionStatus,
} from '@/lib/training/engine/types';

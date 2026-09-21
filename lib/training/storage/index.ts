/**
 * تخزين محلي لمنظومة التدريب — منصة تآلف
 */

export {
  createBrowserTrainingStorageAdapter,
  createMemoryTrainingStorageAdapter,
  getTrainingStorageAdapter,
  readJsonArray,
  resetTrainingStorageAdapter,
  setTrainingStorageAdapter,
  writeJsonArray,
  type TrainingStorageAdapter,
} from '@/lib/training/storage/adapter';

export { TRAINING_STORAGE_LIMITS } from '@/lib/training/storage/constants';

export {
  sanitizeStoredTrainingSession,
  sanitizeTrainingPlan,
  sanitizeTrainingProgress,
  trainingProgressKey,
  validateStoredTrainingSession,
  validateTrainingPlan,
  validateTrainingProgress,
} from '@/lib/training/storage/validateStored';

export {
  clearTrainingPlans,
  deleteTrainingPlan,
  getActiveTrainingPlan,
  getLatestCompletedTrainingPlan,
  getTrainingPlan,
  listTrainingPlans,
  MULTIPLE_ACTIVE_TRAINING_PLANS,
  saveTrainingPlan,
} from '@/lib/training/storage/planStore';

export {
  clearTrainingSessions,
  deleteTrainingSession,
  getTrainingSession,
  listTrainingSessions,
  saveTrainingSession,
} from '@/lib/training/storage/sessionStore';

export {
  clearTrainingProgress,
  deleteTrainingProgress,
  getTrainingProgress,
  listTrainingProgress,
  saveTrainingProgress,
} from '@/lib/training/storage/progressStore';

export {
  clearCompletionApplyRecords,
  ensureCompletionApplyRecord,
  getCompletionApplyRecord,
  inferLegacyCompletionFullyApplied,
  markCompletionGoalsApplied,
  markCompletionPlanAdvanceApplied,
  markCompletionProgressApplied,
} from '@/lib/training/storage/completionApplyStore';

import { clearCompletionApplyRecords } from '@/lib/training/storage/completionApplyStore';
import { clearTrainingPlans } from '@/lib/training/storage/planStore';
import { clearTrainingProgress } from '@/lib/training/storage/progressStore';
import { clearTrainingSessions } from '@/lib/training/storage/sessionStore';

export function clearAllTrainingStorage() {
  clearTrainingPlans();
  clearTrainingSessions();
  clearTrainingProgress();
  clearCompletionApplyRecords();
}

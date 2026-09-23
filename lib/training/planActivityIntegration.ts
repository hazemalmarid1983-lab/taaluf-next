/**
 * ربط بسيط بين UI النشاط وطبقة الخطة — بدون hook مشترك.
 */

export {
  clearPlanActivityRecovery,
  exitPlanActivityFlow,
  preparePlanActivityBegin,
  resolveTrainingActivityCompletionHref,
} from '@/lib/training/planActivitySafety';
export { readPlanLaunchForSessionBegin } from '@/lib/training/planLaunchContext';
export { persistSessionAndAdvancePlan } from '@/lib/training/planExecution';

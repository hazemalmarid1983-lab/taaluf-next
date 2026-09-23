/**
 * تسجيل المراقب لمحاولات observer-imitation — بدون اشتقاق تلقائي للمساعدة.
 */

import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';
import type { ObserverImitationTrialOutcome } from '@/lib/training/observerImitationEngine';
import { promptHierarchyToTrainingLevel } from '@/lib/training/tapToRequestObserverFlow';

export type ObserverImitationRecordInput = {
  success: boolean;
  observerPromptLevel: PromptHierarchyLevel;
  responseTimeMs: number;
  movementId: string;
  movementCategory: ObserverImitationTrialOutcome['movementCategory'];
  modelReplays: number;
};

/** promptLevel = اختيار المراقب فقط؛ modelReplays لا تُ mapped إلى promptLevel */
export function buildObserverImitationTrialOutcome(
  input: ObserverImitationRecordInput
): ObserverImitationTrialOutcome {
  const promptLevel = promptHierarchyToTrainingLevel(input.observerPromptLevel);

  const correct =
    input.observerPromptLevel === 'no_response' ? false : input.success;

  return {
    correct,
    promptLevel,
    responseTimeMs: Math.max(0, Math.floor(input.responseTimeMs)),
    movementId: input.movementId,
    movementCategory: input.movementCategory,
    modelReplays: Math.max(0, Math.floor(input.modelReplays)),
  };
}

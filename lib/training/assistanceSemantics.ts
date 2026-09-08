/**
 * فصل Assistance Stage (داخلي) عن TrainingPromptLevel (مسجّل في Trial).
 *
 * Latency يحدد متى يُفعَّل stage — لا يُسجَّل promptLevel من الزمن وحده.
 * promptLevel يُشتق من أقوى مساعدة رقمية فُعِّلت فعلياً قبل الاستجابة.
 */

import type { TrainingPromptLevel } from '@/lib/training/types';

/** مراحل المساعدة الرقمية الداخلية — لا تُخزَّن في Trial مباشرة */
export type TrainingAssistanceStage =
  | 'none'
  | 'visual_hint'
  | 'reduced_choices'
  | 'direct_visual_assistance';

export type TrainingAssistanceSchedule = {
  visualHintMs: number;
  reducedChoicesMs?: number;
  directVisualMs?: number;
};

const STAGE_RANK: Record<TrainingAssistanceStage, number> = {
  none: 0,
  visual_hint: 1,
  reduced_choices: 2,
  direct_visual_assistance: 3,
};

/** أقوى stage وصل إليه الزمن — يمثل المساعدة التي تلقاها الطفل فعلياً */
export function resolveAssistanceDelivered(
  elapsedMs: number,
  schedule: TrainingAssistanceSchedule,
  promptingEnabled: boolean
): TrainingAssistanceStage {
  if (!promptingEnabled || elapsedMs < schedule.visualHintMs) {
    return 'none';
  }

  if (
    schedule.directVisualMs !== undefined &&
    elapsedMs >= schedule.directVisualMs
  ) {
    return 'direct_visual_assistance';
  }

  if (
    schedule.reducedChoicesMs !== undefined &&
    elapsedMs >= schedule.reducedChoicesMs
  ) {
    return 'reduced_choices';
  }

  return 'visual_hint';
}

/** Stage الحالي للعرض — نفس delivered في نموذج التصاعد التراكمي */
export function resolveAssistanceStage(
  elapsedMs: number,
  schedule: TrainingAssistanceSchedule,
  promptingEnabled: boolean
): TrainingAssistanceStage {
  return resolveAssistanceDelivered(elapsedMs, schedule, promptingEnabled);
}

/** يحوّل المساعدة الرقمية الفعلية إلى TrainingPromptLevel للتخزين */
export function promptLevelFromAssistanceDelivered(
  delivered: TrainingAssistanceStage
): TrainingPromptLevel {
  switch (delivered) {
    case 'none':
      return 'independent';
    case 'visual_hint':
      return 'visual_hint';
    case 'reduced_choices':
      return 'reduced_choices';
    case 'direct_visual_assistance':
      return 'direct_visual_assistance';
    default:
      return 'independent';
  }
}

export function resolveTrialPromptLevel(input: {
  responded: boolean;
  promptingEnabled: boolean;
  elapsedMs: number;
  schedule: TrainingAssistanceSchedule;
}): TrainingPromptLevel {
  if (!input.responded) {
    return 'no_response';
  }

  const delivered = resolveAssistanceDelivered(
    input.elapsedMs,
    input.schedule,
    input.promptingEnabled
  );

  return promptLevelFromAssistanceDelivered(delivered);
}

export function isAssistanceStageAtLeast(
  stage: TrainingAssistanceStage,
  minimum: TrainingAssistanceStage
): boolean {
  return STAGE_RANK[stage] >= STAGE_RANK[minimum];
}

export function assistanceStageRank(stage: TrainingAssistanceStage): number {
  return STAGE_RANK[stage];
}

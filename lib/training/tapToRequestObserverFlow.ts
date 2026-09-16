/**
 * تدفق محاولات «أريد هذا» — بوابة المراقب (PromptRecordingBar).
 * منطق خالص للاختبار ومشارك مع TapToRequestPlayArea.
 */

import type { PromptHierarchyLevel } from '@/lib/promptHierarchy';
import type { TrainingAssistanceStage } from '@/lib/training/assistanceSemantics';
import type { TrainingPromptLevel } from '@/lib/training/types';
import {
  buildCommTrialSpec,
  resolveCommObserverTrialOutcome,
  type CommChoice,
  type CommRuntimeSettings,
  type CommTrialOutcome,
  type CommTrialSpec,
} from '@/lib/training/communicationChoiceEngine';

export type TapToRequestPhase = 'choosing' | 'awaiting_observer' | 'child_feedback';

export type TapToRequestPendingTrial =
  | {
      source: 'child_tap';
      choiceId: string;
      correct: boolean;
      responseTimeMs: number;
    }
  | {
      source: 'observer_no_response';
    };

function mixTrialSeed(sessionSeed: string, trialNumber: number): number {
  let h = (trialNumber + 1) * 0x9e3779b9;
  for (let i = 0; i < sessionSeed.length; i += 1) {
    h = Math.imul(h ^ sessionSeed.charCodeAt(i), 0x85ebca6b);
    h >>>= 0;
  }
  return h >>> 0;
}

function seededShuffleChoices(
  choices: CommChoice[],
  sessionSeed: string,
  trialNumber: number
): CommChoice[] {
  const indices = choices.map((_, index) => index);
  let seed = mixTrialSeed(sessionSeed, trialNumber);

  for (let i = indices.length - 1; i > 0; i -= 1) {
    seed = Math.imul(seed ^ (seed >>> 16), 0x7feb352d) >>> 0;
    const j = seed % (i + 1);
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }

  return indices.map((index) => choices[index]!);
}

/** مواصفة محاولة tap-to-request — ترتيب خيارات مختلف لكل محاولة (seed = session.id). */
export function buildTapToRequestTrialSpec(
  settings: CommRuntimeSettings,
  trialNumber: number,
  sessionSeed: string
): CommTrialSpec {
  const base = buildCommTrialSpec(settings, trialNumber);
  return {
    ...base,
    choices: seededShuffleChoices(base.choices, sessionSeed, trialNumber),
  };
}

export function indexOfCorrectChoice(choices: CommChoice[]): number {
  return choices.findIndex((choice) => choice.isCorrect);
}

/**
 * في flex-row + dir=rtl: العنصر ذو logical index 0 يُرسم عند inline-start (= يمين الشاشة).
 * الاختبارات تستخدم هذا التعريف ولا تعكس correct/incorrect.
 */
export type TapToRequestRtlVisualSlot = 'inline-start' | 'inline-end';

export function logicalIndexToRtlVisualSlot(
  logicalIndex: number,
  choiceCount: number
): TapToRequestRtlVisualSlot {
  if (choiceCount <= 1) return 'inline-start';
  if (logicalIndex === 0) return 'inline-start';
  if (logicalIndex === choiceCount - 1) return 'inline-end';
  return 'inline-start';
}

/**
 * يطابق TapToRequestPlayArea: الحاوية `dir="rtl"` + `flex`/`flex-wrap` + `justify-center`.
 * ترتيب DOM = ترتيب `choices[]`؛ في RTL العنصر 0 يظهر للمستخدم على اليمين.
 */
export type TapToRequestRtlUserSide = 'right' | 'left';

export function rtlUserSideForChoiceIndex(
  logicalIndex: number,
  choiceCount: number
): TapToRequestRtlUserSide {
  return logicalIndexToRtlVisualSlot(logicalIndex, choiceCount) === 'inline-start'
    ? 'right'
    : 'left';
}

export function correctChoiceRtlUserSide(choices: CommChoice[]): TapToRequestRtlUserSide {
  const index = indexOfCorrectChoice(choices);
  if (index < 0) throw new Error('no correct choice');
  return rtlUserSideForChoiceIndex(index, choices.length);
}

/** tap-to-request: انتهاء responseWindowMs لا ينهي المحاولة */
export function shouldCommitTrialOnResponseWindow(): boolean {
  return false;
}

/** tap-to-request: لا تصعيد مساعدة بصرية تلقائي بمرور الزمن */
export function shouldApplyTapToRequestTimedVisualAssistance(): boolean {
  return false;
}

export function resolveTapToRequestAssistanceStageForElapsed(): TrainingAssistanceStage {
  return 'none';
}

/** الخيارات المعروضة ثابتة طوال المحاولة — لا reduced_choices بسبب الزمن */
export function resolveTapToRequestDisplayedChoices(spec: CommTrialSpec): CommChoice[] {
  return spec.choices;
}

export function isCommChoiceCorrect(
  spec: CommTrialSpec,
  choiceId: string
): boolean {
  const correctChoice = spec.choices.find((c) => c.isCorrect);
  return correctChoice?.id === choiceId;
}

export function onChildTapChoice(input: {
  phase: TapToRequestPhase;
  spec: CommTrialSpec;
  choiceId: string;
  elapsedMs: number;
}):
  | { phase: 'awaiting_observer'; pending: TapToRequestPendingTrial }
  | null {
  if (input.phase !== 'choosing') return null;

  return {
    phase: 'awaiting_observer',
    pending: {
      source: 'child_tap',
      choiceId: input.choiceId,
      correct: isCommChoiceCorrect(input.spec, input.choiceId),
      responseTimeMs: Math.max(0, Math.round(input.elapsedMs)),
    },
  };
}

export function onObserverOpenRecording(input: {
  phase: TapToRequestPhase;
}): { phase: 'awaiting_observer'; pending: TapToRequestPendingTrial } | null {
  if (input.phase !== 'choosing') return null;

  return {
    phase: 'awaiting_observer',
    pending: { source: 'observer_no_response' },
  };
}

export function promptHierarchyToTrainingLevel(
  level: PromptHierarchyLevel
): TrainingPromptLevel {
  return level;
}

export function buildOutcomeAfterObserverRecord(input: {
  phase: TapToRequestPhase;
  pending: TapToRequestPendingTrial | null;
  spec: CommTrialSpec;
  observerLevel: PromptHierarchyLevel;
  elapsedMsAtRecord: number;
}): { phase: 'child_feedback'; outcome: CommTrialOutcome } | null {
  if (input.phase !== 'awaiting_observer' || !input.pending) return null;

  const promptLevel = promptHierarchyToTrainingLevel(input.observerLevel);

  const targetId = input.spec.target.id;

  if (input.pending.source === 'child_tap') {
    return {
      phase: 'child_feedback',
      outcome: {
        ...resolveCommObserverTrialOutcome({
          spec: input.spec,
          choiceId: input.pending.choiceId,
          observerPromptLevel: promptLevel,
          responseTimeMs: input.pending.responseTimeMs,
        }),
        targetId,
        responseChoiceId: input.pending.choiceId,
        responseMode: 'child_tap',
      },
    };
  }

  return {
    phase: 'child_feedback',
    outcome: {
      ...resolveCommObserverTrialOutcome({
        spec: input.spec,
        choiceId: null,
        observerPromptLevel: promptLevel,
        responseTimeMs: input.elapsedMsAtRecord,
      }),
      targetId,
      responseChoiceId: null,
      responseMode: 'observer_no_response',
    },
  };
}

/** قبل تسجيل المراقب لا تُسجَّل محاولة في الجلسة */
export function canCommitSessionTrial(input: {
  phase: TapToRequestPhase;
  observerHasRecorded: boolean;
}): boolean {
  return input.observerHasRecorded && input.phase === 'child_feedback';
}

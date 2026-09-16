/**
 * تدفق نشاط تدريبي عام — فوق Session Engine وتحت task engines.
 * لا يعرف UI ولا منطق المهمة.
 */

import {
  createTrainingSession,
  endTrainingSession,
  recordTrial,
  resolveMediaRuntimeConfig,
  startTrial,
} from '@/lib/training/engine';
import type { ResolvedMediaConfig } from '@/lib/training/engine/types';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';
import {
  TAP_TO_REQUEST_PROTOCOL_REVISION,
  type TapToRequestResponseMode,
  type TrainingDifficulty,
  type TrainingMedia,
  type TrainingPromptLevel,
} from '@/lib/training/types';

/** شكل موحّد لنتيجة المحاولة — متوافق مع follow-star و match-me */
export type TrainingTrialOutcome = {
  correct: boolean;
  promptLevel: TrainingPromptLevel;
  responseTimeMs: number;
  targetId?: string;
  responseChoiceId?: string | null;
  responseMode?: TapToRequestResponseMode;
};

export type TrainingActivityBundle<TSettings> = {
  session: TrainingSessionRuntime;
  settings: TSettings;
};

export type BeginTrainingActivityInput = {
  childId: string;
  chapterId: string;
  media: TrainingMedia;
  planId?: string;
  goalIds?: string[];
  /** صعوبة مُخصّصة من الخطة — تتجاوز إعدادات الوسيلة الافتراضية */
  sessionDifficulty?: TrainingDifficulty;
};

export type CreateTrainingActivityFlowInput<TSettings> = {
  resolveSettings: (config: ResolvedMediaConfig) => TSettings;
  resolveDifficulty: (settings: TSettings) => TrainingDifficulty;
};

export type TrainingActivityFlow<TSettings> = {
  begin(input: BeginTrainingActivityInput): TrainingActivityBundle<TSettings>;
  startTrial(session: TrainingSessionRuntime): TrainingSessionRuntime;
  commitTrial(
    session: TrainingSessionRuntime,
    outcome: TrainingTrialOutcome
  ): TrainingSessionRuntime;
  finalize(session: TrainingSessionRuntime): TrainingSessionRuntime;
  isComplete(session: TrainingSessionRuntime): boolean;
};

export function createTrainingActivityFlow<TSettings>(
  input: CreateTrainingActivityFlowInput<TSettings>
): TrainingActivityFlow<TSettings> {
  return {
    begin(beginInput: BeginTrainingActivityInput): TrainingActivityBundle<TSettings> {
      const difficulty =
        beginInput.sessionDifficulty ??
        resolveMediaRuntimeConfig(beginInput.media).difficulty;
      const runtimeConfig = resolveMediaRuntimeConfig(beginInput.media, difficulty);
      const settings = input.resolveSettings(runtimeConfig);
      const session = createTrainingSession({
        childId: beginInput.childId,
        chapterId: beginInput.chapterId,
        media: beginInput.media,
        planId: beginInput.planId,
        goalIds: beginInput.goalIds,
        difficulty,
        protocolRevision:
          beginInput.media.mediaId === 'tap-to-request'
            ? TAP_TO_REQUEST_PROTOCOL_REVISION
            : undefined,
      });

      return { session, settings };
    },

    startTrial(session: TrainingSessionRuntime): TrainingSessionRuntime {
      return startTrial(session);
    },

    commitTrial(
      session: TrainingSessionRuntime,
      outcome: TrainingTrialOutcome
    ): TrainingSessionRuntime {
      return recordTrial(session, {
        correct: outcome.correct,
        promptLevel: outcome.promptLevel,
        responseTimeMs: outcome.responseTimeMs,
        ...(outcome.targetId !== undefined ? { targetId: outcome.targetId } : {}),
        ...(outcome.responseChoiceId !== undefined
          ? { responseChoiceId: outcome.responseChoiceId }
          : {}),
        ...(outcome.responseMode !== undefined
          ? { responseMode: outcome.responseMode }
          : {}),
      });
    },

    finalize(session: TrainingSessionRuntime): TrainingSessionRuntime {
      return endTrainingSession(session);
    },

    isComplete(session: TrainingSessionRuntime): boolean {
      return session.trials.length >= session.targetTrialCount;
    },
  };
}

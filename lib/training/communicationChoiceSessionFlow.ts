import { createTrainingActivityFlow, type BeginTrainingActivityInput } from '@/lib/training/activityFlow';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';
import {
  resolveCommRuntimeSettings,
  type CommRuntimeSettings,
  type CommTrialOutcome,
} from '@/lib/training/communicationChoiceEngine';

export type CommSessionBundle = {
  session: TrainingSessionRuntime;
  settings: CommRuntimeSettings;
};

const commActivityFlow = createTrainingActivityFlow({
  resolveSettings: resolveCommRuntimeSettings,
  resolveDifficulty: (settings) => settings.difficulty,
});

export function beginCommChoiceSession(
  input: BeginTrainingActivityInput
): CommSessionBundle {
  return commActivityFlow.begin(input);
}

export function startCommChoiceTrial(
  session: TrainingSessionRuntime
): TrainingSessionRuntime {
  return commActivityFlow.startTrial(session);
}

export function commitCommChoiceTrial(
  session: TrainingSessionRuntime,
  outcome: CommTrialOutcome
): TrainingSessionRuntime {
  return commActivityFlow.commitTrial(session, outcome);
}

export function finalizeCommChoiceSession(
  session: TrainingSessionRuntime
): TrainingSessionRuntime {
  return commActivityFlow.finalize(session);
}

export function isCommChoiceSessionComplete(
  session: TrainingSessionRuntime
): boolean {
  return commActivityFlow.isComplete(session);
}

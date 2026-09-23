/**
 * تدفق جلسة observer-imitation — يربط المحرك بالإعدادات دون UI.
 */

import {
  createTrainingActivityFlow,
  type BeginTrainingActivityInput,
} from '@/lib/training/activityFlow';
import { resolveMediaRuntimeConfig } from '@/lib/training/engine/mediaLoader';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';
import {
  type ObserverImitationRuntimeSettings,
  type ObserverImitationTrialOutcome,
  resolveObserverImitationRuntimeSettings,
} from '@/lib/training/observerImitationEngine';

export type ObserverImitationSessionBundle = {
  session: TrainingSessionRuntime;
  settings: ObserverImitationRuntimeSettings;
};

const observerImitationActivityFlow = createTrainingActivityFlow({
  resolveSettings: (config) =>
    resolveObserverImitationRuntimeSettings({
      config,
      sessionId: 'session-placeholder',
    }),
  resolveDifficulty: (settings) => settings.difficulty,
});

export function beginObserverImitationSession(
  input: BeginTrainingActivityInput
): ObserverImitationSessionBundle {
  const bundle = observerImitationActivityFlow.begin(input);
  const settings = resolveObserverImitationRuntimeSettings({
    config: resolveMediaRuntimeConfig(input.media, bundle.session.difficulty),
    sessionId: bundle.session.id,
    skillIds: bundle.session.skillIds ?? input.skillIds,
  });
  return { session: bundle.session, settings };
}

export function startObserverImitationTrial(
  session: TrainingSessionRuntime
): TrainingSessionRuntime {
  return observerImitationActivityFlow.startTrial(session);
}

export function commitObserverImitationTrial(
  session: TrainingSessionRuntime,
  outcome: ObserverImitationTrialOutcome
): TrainingSessionRuntime {
  return observerImitationActivityFlow.commitTrial(session, outcome);
}

export function finalizeObserverImitationSession(
  session: TrainingSessionRuntime
): TrainingSessionRuntime {
  return observerImitationActivityFlow.finalize(session);
}

export function isObserverImitationSessionComplete(
  session: TrainingSessionRuntime
): boolean {
  return observerImitationActivityFlow.isComplete(session);
}

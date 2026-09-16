/**
 * حساب مقاييس جلسة التدريب: الدقة، الاستقلالية، زمن الاستجابة.
 */

import type { TrainingTrial } from '@/lib/training/types';
import {
  countTrainingPromptBreakdown,
  trainingIndependencePercentage,
} from '@/lib/training/engine/promptLevels';
import type { TrainingSessionMetrics } from '@/lib/training/engine/types';

export function calculateAccuracy(trials: ReadonlyArray<TrainingTrial>): number {
  if (trials.length === 0) return 0;
  const correctCount = trials.filter((trial) => trial.correct).length;
  return Math.round((correctCount / trials.length) * 100);
}

export function calculateAverageResponseTimeMs(
  trials: ReadonlyArray<TrainingTrial>
): number | null {
  const timed = trials.filter(
    (trial) =>
      trial.responseTimeMs !== undefined &&
      Number.isFinite(trial.responseTimeMs)
  );
  if (timed.length === 0) return null;

  const sum = timed.reduce(
    (acc, trial) => acc + (trial.responseTimeMs ?? 0),
    0
  );
  return Math.round(sum / timed.length);
}

export function calculateSessionMetrics(
  trials: ReadonlyArray<TrainingTrial>
): TrainingSessionMetrics {
  const correctCount = trials.filter((trial) => trial.correct).length;
  const incorrectCount = trials.length - correctCount;

  return {
    accuracy: calculateAccuracy(trials),
    independence: trainingIndependencePercentage(trials),
    averageResponseTimeMs: calculateAverageResponseTimeMs(trials),
    correctCount,
    incorrectCount,
    totalTrials: trials.length,
    promptBreakdown: countTrainingPromptBreakdown(trials),
  };
}

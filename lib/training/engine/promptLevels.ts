/**
 * مستويات المساعدة في محرك التدريب — مستقل عن homeClassroomEngine.
 */

import type { TrainingPromptLevel } from '@/lib/training/types';

/** كل القيم المقبولة في TrainingTrial.promptLevel */
export const TRAINING_PROMPT_LEVELS: TrainingPromptLevel[] = [
  'independent',
  'visual_hint',
  'reduced_choices',
  'direct_visual_assistance',
  'no_response',
  'gestural',
  'verbal',
  'verbal_partial',
  'model',
  'partial_physical',
  'full_physical',
];

/** المستويات التي تُعيَّنها المحركات الرقمية تلقائياً */
export const TRAINING_DIGITAL_PROMPT_LEVELS: TrainingPromptLevel[] = [
  'independent',
  'visual_hint',
  'reduced_choices',
  'direct_visual_assistance',
  'no_response',
];

const PROMPT_LEVEL_SET = new Set<string>(TRAINING_PROMPT_LEVELS);

export type TrainingPromptBreakdown = Record<TrainingPromptLevel, number>;

export function isTrainingPromptLevel(
  value: string
): value is TrainingPromptLevel {
  return PROMPT_LEVEL_SET.has(value);
}

export function emptyTrainingPromptBreakdown(): TrainingPromptBreakdown {
  return {
    independent: 0,
    visual_hint: 0,
    reduced_choices: 0,
    direct_visual_assistance: 0,
    no_response: 0,
    gestural: 0,
    verbal: 0,
    verbal_partial: 0,
    model: 0,
    partial_physical: 0,
    full_physical: 0,
  };
}

/** مستقل = أنجز المحاولة دون أي مساعدة رقمية (أو بشرية) مسجّلة */
export function isIndependentPrompt(level: TrainingPromptLevel): boolean {
  return level === 'independent';
}

export function isPromptedLevel(level: TrainingPromptLevel): boolean {
  return level !== 'independent' && level !== 'no_response';
}

export function isDigitalAssistancePrompt(level: TrainingPromptLevel): boolean {
  return (
    level === 'visual_hint' ||
    level === 'reduced_choices' ||
    level === 'direct_visual_assistance'
  );
}

export function countTrainingPromptBreakdown(
  trials: ReadonlyArray<{ promptLevel: TrainingPromptLevel }>
): TrainingPromptBreakdown {
  const counts = emptyTrainingPromptBreakdown();
  for (const trial of trials) {
    counts[trial.promptLevel] += 1;
  }
  return counts;
}

/**
 * نسبة المحاولات المستقلة (0–100).
 * تعتمد على promptLevel الفعلي — وليس على سرعة الاستجابة.
 */
export function trainingIndependencePercentage(
  trials: ReadonlyArray<{ promptLevel: TrainingPromptLevel }>
): number {
  if (trials.length === 0) return 0;
  const independent = trials.filter((trial) =>
    isIndependentPrompt(trial.promptLevel)
  ).length;
  return Math.round((independent / trials.length) * 100);
}

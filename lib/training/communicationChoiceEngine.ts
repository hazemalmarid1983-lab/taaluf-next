/**
 * محرك اختيار بصري للتواصل — expressive / receptive — بلا UI.
 * PROVISIONAL — Scientific Review Pending: تدريب رقمي تمهيدي فقط.
 */

import type { ResolvedMediaConfig } from '@/lib/training/engine/types';
import type {
  TapToRequestResponseMode,
  TrainingDifficulty,
  TrainingPromptLevel,
} from '@/lib/training/types';
import {
  resolveAssistanceStage,
  resolveTrialPromptLevel,
  type TrainingAssistanceSchedule,
  type TrainingAssistanceStage,
} from '@/lib/training/assistanceSemantics';

export type CommPictogramId =
  | 'water'
  | 'food'
  | 'toy'
  | 'book'
  | 'come'
  | 'sit'
  | 'give'
  | 'ball'
  | 'cup'
  | 'car'
  | 'face_child'
  | 'face_adult';

export type CommPictogram = {
  id: CommPictogramId;
  labelAr: string;
  color: string;
  shape: 'circle' | 'square' | 'rounded';
};

export type CommChoice = {
  id: string;
  item: CommPictogram;
  isCorrect: boolean;
};

export type CommTrialSpec = {
  trialNumber: number;
  choiceLevel: number;
  promptLabelAr: string;
  target: CommPictogram;
  choices: CommChoice[];
  responseWindowMs: number;
  layout: 'grid' | 'scene';
};

export type CommRuntimeSettings = {
  trialCount: number;
  difficulty: TrainingDifficulty;
  choiceLevel: number;
  choiceCount: number;
  prompting: boolean;
  reinforcement: boolean;
  responseWindowMs: number;
  pool: string;
  mode: string;
};

export type CommTrialOutcome = {
  correct: boolean;
  promptLevel: TrainingPromptLevel;
  responseTimeMs: number;
  /** tap-to-request v1 — اختياري */
  targetId?: string;
  responseChoiceId?: string | null;
  responseMode?: TapToRequestResponseMode;
};

export const COMM_CHOICE_ASSISTANCE_SCHEDULE: TrainingAssistanceSchedule = {
  visualHintMs: 2500,
  reducedChoicesMs: 4500,
  directVisualMs: 7500,
};

const NEEDS: CommPictogram[] = [
  { id: 'water', labelAr: 'ماء', color: '#3D7DD6', shape: 'circle' },
  { id: 'food', labelAr: 'طعام', color: '#E08A3C', shape: 'rounded' },
  { id: 'toy', labelAr: 'لعبة', color: '#7B5EA7', shape: 'square' },
  { id: 'book', labelAr: 'كتاب', color: '#3A9B6E', shape: 'rounded' },
];

const ACTIONS: CommPictogram[] = [
  { id: 'come', labelAr: 'تعال', color: '#2E7D8E', shape: 'circle' },
  { id: 'sit', labelAr: 'اجلس', color: '#C94C4C', shape: 'rounded' },
  { id: 'give', labelAr: 'أعطني', color: '#3A9B6E', shape: 'square' },
];

const SCENE_OBJECTS: CommPictogram[] = [
  { id: 'ball', labelAr: 'كرة', color: '#C94C4C', shape: 'circle' },
  { id: 'cup', labelAr: 'كوب', color: '#3D7DD6', shape: 'rounded' },
  { id: 'car', labelAr: 'سيارة', color: '#E08A3C', shape: 'square' },
  { id: 'book', labelAr: 'كتاب', color: '#3A9B6E', shape: 'rounded' },
];

const NAME_CALL: CommPictogram[] = [
  { id: 'face_child', labelAr: 'أنت', color: '#2E7D8E', shape: 'circle' },
  { id: 'face_adult', labelAr: 'آخر', color: '#94A3B8', shape: 'circle' },
];

const CHOICE_COUNT_BY_LEVEL: Record<number, number> = {
  1: 2,
  2: 3,
  3: 3,
  4: 4,
};

function poolItems(pool: string): CommPictogram[] {
  if (pool === 'daily_needs') return NEEDS;
  if (pool === 'actions') return ACTIONS;
  if (pool === 'scene_objects') return SCENE_OBJECTS;
  if (pool === 'name_call') return NAME_CALL;
  return NEEDS;
}

function promptForMode(mode: string, target: CommPictogram): string {
  if (mode === 'expressive_request') return `أريد: ${target.labelAr}`;
  if (mode === 'symbol_board') return `اختر الرمز`;
  if (mode === 'receptive_instruction') return target.labelAr;
  if (mode === 'point_in_scene') return `أين ${target.labelAr}؟`;
  if (mode === 'name_orienting') return `اسمك!`;
  return target.labelAr;
}

function seededIndex(seed: number, max: number): number {
  if (max <= 0) return 0;
  const x = Math.sin(seed) * 10000;
  return Math.abs(Math.floor(x)) % max;
}

/** مفتاح ترتيب حتمي — يستخدم id كاملًا (لا charCodeAt(0) فقط). */
export function commChoiceOrderScore(choiceId: string, trialNumber: number): number {
  let hash = trialNumber * 991;
  for (let i = 0; i < choiceId.length; i += 1) {
    hash = (hash * 33 + choiceId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** ترتيب حتمي للخيارات — نفس trialNumber يعطي نفس الترتيب (لا Math.random في render). */
function orderChoicesDeterministic(
  choices: CommChoice[],
  trialNumber: number
): CommChoice[] {
  return [...choices].sort(
    (a, b) =>
      commChoiceOrderScore(a.id, trialNumber) -
      commChoiceOrderScore(b.id, trialNumber)
  );
}

function pickDistractorsDeterministic(
  pool: CommPictogram[],
  targetId: string,
  count: number,
  trialNumber: number
): CommPictogram[] {
  const candidates = pool.filter((p) => p.id !== targetId);
  if (count <= 0 || candidates.length === 0) return [];

  const picked: CommPictogram[] = [];
  const used = new Set<string>();
  let attempt = 0;
  while (picked.length < count && attempt < candidates.length * 4) {
    const item = candidates[seededIndex(trialNumber * 7 + attempt * 13, candidates.length)];
    if (!used.has(item.id)) {
      used.add(item.id);
      picked.push(item);
    }
    attempt += 1;
  }
  return picked;
}

export function resolveCommRuntimeSettings(
  config: ResolvedMediaConfig
): CommRuntimeSettings {
  const content = config.content ?? {};
  const choiceLevel = Number(content.choiceLevel ?? config.matchLevel ?? 1);
  const pool = String(content.pool ?? 'daily_needs');
  const mode = String(content.mode ?? 'expressive_request');
  const baseChoices = Number(config.choices ?? CHOICE_COUNT_BY_LEVEL[choiceLevel] ?? 2);

  return {
    trialCount: Number(config.trialCount ?? 8),
    difficulty: config.difficulty ?? 1,
    choiceLevel,
    choiceCount: Math.min(baseChoices, poolItems(pool).length),
    prompting: config.prompting !== false,
    reinforcement: config.reinforcement !== false,
    responseWindowMs: Number(config.responseWindowMs ?? 9000),
    pool,
    mode,
  };
}

export function commSettingsForLevel(
  settings: CommRuntimeSettings,
  level: number
): CommRuntimeSettings {
  const choiceLevel = Math.min(4, Math.max(1, Math.floor(level)));
  return {
    ...settings,
    choiceLevel,
    choiceCount: CHOICE_COUNT_BY_LEVEL[choiceLevel] ?? settings.choiceCount,
  };
}

export function buildCommTrialSpec(
  settings: CommRuntimeSettings,
  trialNumber: number
): CommTrialSpec {
  const pool = poolItems(settings.pool);
  const target = pool[(trialNumber - 1) % pool.length];
  const distractorCount = Math.max(0, settings.choiceCount - 1);
  const distractors = pickDistractorsDeterministic(
    pool,
    target.id,
    distractorCount,
    trialNumber
  );
  const choices: CommChoice[] = orderChoicesDeterministic(
    [
      { id: `c-${target.id}`, item: target, isCorrect: true },
      ...distractors.map((item) => ({
        id: `c-${item.id}`,
        item,
        isCorrect: false,
      })),
    ],
    trialNumber
  );

  return {
    trialNumber,
    choiceLevel: settings.choiceLevel,
    promptLabelAr: promptForMode(settings.mode, target),
    target,
    choices,
    responseWindowMs: settings.responseWindowMs,
    layout: settings.mode === 'point_in_scene' ? 'scene' : 'grid',
  };
}

export function getCommDisplayedChoices(
  spec: CommTrialSpec,
  stage: TrainingAssistanceStage
): CommChoice[] {
  if (stage === 'reduced_choices' || stage === 'direct_visual_assistance') {
    const correct = spec.choices.find((c) => c.isCorrect);
    const wrong = spec.choices.find((c) => !c.isCorrect);
    return [correct, wrong].filter(Boolean) as CommChoice[];
  }
  return spec.choices;
}

export function resolveCommAssistanceStage(
  elapsedMs: number,
  prompting: boolean
): TrainingAssistanceStage {
  return resolveAssistanceStage(
    elapsedMs,
    COMM_CHOICE_ASSISTANCE_SCHEDULE,
    prompting
  );
}

/** نتيجة محاولة tap-to-request — مستوى المساعدة من المراقب فقط (لا latency). */
export function resolveCommObserverTrialOutcome(input: {
  spec: CommTrialSpec;
  choiceId: string | null;
  observerPromptLevel: TrainingPromptLevel;
  responseTimeMs: number;
}): CommTrialOutcome {
  const correctChoice = input.spec.choices.find((c) => c.isCorrect);
  const correct =
    input.choiceId !== null && input.choiceId === correctChoice?.id;

  return {
    correct,
    promptLevel: input.observerPromptLevel,
    responseTimeMs: Math.max(0, Math.round(input.responseTimeMs)),
  };
}

export function resolveCommTrialOutcome(input: {
  spec: CommTrialSpec;
  choiceId: string | null;
  elapsedMs: number;
  prompting: boolean;
  timedOut: boolean;
}): CommTrialOutcome {
  const correctChoice = input.spec.choices.find((c) => c.isCorrect);
  const selected = Boolean(input.choiceId) && !input.timedOut;
  const correct =
    selected && input.choiceId === correctChoice?.id;

  const promptLevel = resolveTrialPromptLevel({
    responded: selected,
    promptingEnabled: input.prompting,
    elapsedMs: input.elapsedMs,
    schedule: COMM_CHOICE_ASSISTANCE_SCHEDULE,
  });

  return {
    correct,
    promptLevel,
    responseTimeMs: Math.max(0, Math.round(input.elapsedMs)),
  };
}

export function shouldHighlightCommTarget(
  stage: TrainingAssistanceStage
): boolean {
  return stage === 'direct_visual_assistance';
}

export function shouldPulseCommPrompt(
  stage: TrainingAssistanceStage
): boolean {
  return stage === 'visual_hint' || stage === 'direct_visual_assistance';
}

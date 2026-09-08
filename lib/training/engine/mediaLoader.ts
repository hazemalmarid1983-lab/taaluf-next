/**
 * تحميل الوسائل التدريبية وقراءة إعداداتها من TrainingMediaConfig.
 */

import type { TrainingChapterDocument } from '@/lib/training/types';
import type { TrainingDifficulty, TrainingMedia } from '@/lib/training/types';
import { findMediaInChapter } from '@/lib/training/loadChapter';
import type { ResolvedMediaConfig } from '@/lib/training/engine/types';
import { TrainingEngineError } from '@/lib/training/engine/types';

const DEFAULT_TRIAL_COUNT = 10;
const VALID_DIFFICULTIES: TrainingDifficulty[] = [1, 2, 3];

function resolveDifficulty(
  media: TrainingMedia,
  override?: TrainingDifficulty
): TrainingDifficulty {
  if (override !== undefined) {
    if (!media.difficultyLevels.includes(override)) {
      throw new TrainingEngineError(
        'INVALID_DIFFICULTY',
        `مستوى الصعوبة ${override} غير مدعوم للوسيلة ${media.mediaId}`
      );
    }
    return override;
  }

  const fromConfig = media.config.difficulty;
  if (
    typeof fromConfig === 'number' &&
    media.difficultyLevels.includes(fromConfig as TrainingDifficulty)
  ) {
    return fromConfig as TrainingDifficulty;
  }

  return media.difficultyLevels[0] ?? 1;
}

/** يحمّل وسيلة من مستند فصل — undefined إن لم تُوجد */
export function loadTrainingMedia(
  doc: TrainingChapterDocument,
  mediaId: string
): TrainingMedia | undefined {
  return findMediaInChapter(doc, mediaId);
}

/** يحمّل وسيلة أو يرمي TrainingEngineError */
export function requireTrainingMedia(
  doc: TrainingChapterDocument,
  mediaId: string
): TrainingMedia {
  const media = loadTrainingMedia(doc, mediaId);
  if (!media) {
    throw new TrainingEngineError(
      'MEDIA_NOT_FOUND',
      `الوسيلة غير موجودة: ${mediaId}`
    );
  }
  return media;
}

/** يقرأ إعدادات وقت التشغيل من config الوسيلة دون ربط واجهة */
export function resolveMediaRuntimeConfig(
  media: TrainingMedia,
  difficultyOverride?: TrainingDifficulty
): ResolvedMediaConfig {
  const difficulty = resolveDifficulty(media, difficultyOverride);
  const trialCountRaw = media.config.trialCount;
  const trialCount =
    typeof trialCountRaw === 'number' && trialCountRaw > 0
      ? Math.floor(trialCountRaw)
      : DEFAULT_TRIAL_COUNT;

  return {
    engineType: media.engineType,
    trialCount,
    difficulty,
    prompting: media.config.prompting !== false,
    reinforcement: media.config.reinforcement !== false,
    choices:
      typeof media.config.choices === 'number'
        ? media.config.choices
        : undefined,
    distractorCount:
      typeof media.config.distractorCount === 'number'
        ? media.config.distractorCount
        : undefined,
    displayDurationMs:
      typeof media.config.displayDurationMs === 'number'
        ? media.config.displayDurationMs
        : undefined,
    hideDurationMs:
      typeof media.config.hideDurationMs === 'number'
        ? media.config.hideDurationMs
        : undefined,
    waitDurationMs:
      typeof media.config.waitDurationMs === 'number'
        ? media.config.waitDurationMs
        : undefined,
    movementSpeed:
      typeof media.config.movementSpeed === 'number'
        ? media.config.movementSpeed
        : undefined,
    reinforcementType:
      typeof media.config.reinforcementType === 'string'
        ? media.config.reinforcementType
        : undefined,
    prematureResponseAllowed:
      typeof media.config.prematureResponseAllowed === 'boolean'
        ? media.config.prematureResponseAllowed
        : undefined,
    responseWindowMs:
      typeof media.config.responseWindowMs === 'number'
        ? media.config.responseWindowMs
        : undefined,
    matchLevel:
      typeof media.config.matchLevel === 'number'
        ? media.config.matchLevel
        : typeof media.config.content?.matchLevel === 'number'
          ? media.config.content.matchLevel
          : undefined,
    content:
      media.config.content && typeof media.config.content === 'object'
        ? media.config.content
        : undefined,
    raw: media.config,
  };
}

export function isValidTrainingDifficulty(value: number): value is TrainingDifficulty {
  return VALID_DIFFICULTIES.includes(value as TrainingDifficulty);
}

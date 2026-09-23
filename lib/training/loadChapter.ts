/**
 * تحميل مستندات الفصول التدريبية مع التحقق.
 */

import attentionFocusRaw from '@/data/training/chapters/attention-focus.json';
import communicationLanguageRaw from '@/data/training/chapters/communication-language.json';
import motorSocialImitationRaw from '@/data/training/chapters/motor-social-imitation.json';
import {
  assertValidTrainingChapterDocument,
  validateTrainingChapterDocument,
} from '@/lib/training/validateChapter';
import type { TrainingChapterDocument } from '@/lib/training/types';

export const ATTENTION_FOCUS_CHAPTER_ID = 'attention-focus';
export const COMMUNICATION_LANGUAGE_CHAPTER_ID = 'communication-language';
export const MOTOR_SOCIAL_IMITATION_CHAPTER_ID = 'motor-social-imitation';

/** مستند خام — يُتحقق منه عند التحميل */
export const ATTENTION_FOCUS_CHAPTER_RAW: unknown = attentionFocusRaw;

/** تحميل فصل «الانتباه والتركيز» بعد التحقق */
export function loadAttentionFocusChapter(): TrainingChapterDocument {
  assertValidTrainingChapterDocument(attentionFocusRaw);
  return attentionFocusRaw as TrainingChapterDocument;
}

/** التحقق دون رمي استثناء */
export function validateAttentionFocusChapter() {
  return validateTrainingChapterDocument(attentionFocusRaw);
}

/** تحميل فصل بالمعرّف بعد التحقق */
export function loadCommunicationLanguageChapter(): TrainingChapterDocument {
  assertValidTrainingChapterDocument(communicationLanguageRaw);
  return communicationLanguageRaw as TrainingChapterDocument;
}

export function validateCommunicationLanguageChapter() {
  return validateTrainingChapterDocument(communicationLanguageRaw);
}

export function loadMotorSocialImitationChapter(): TrainingChapterDocument {
  assertValidTrainingChapterDocument(motorSocialImitationRaw);
  return motorSocialImitationRaw as TrainingChapterDocument;
}

export function validateMotorSocialImitationChapter() {
  return validateTrainingChapterDocument(motorSocialImitationRaw);
}

const CHAPTER_LOADERS: Record<string, () => TrainingChapterDocument> = {
  [ATTENTION_FOCUS_CHAPTER_ID]: loadAttentionFocusChapter,
  [COMMUNICATION_LANGUAGE_CHAPTER_ID]: loadCommunicationLanguageChapter,
  [MOTOR_SOCIAL_IMITATION_CHAPTER_ID]: loadMotorSocialImitationChapter,
};

export function listTrainingChapterIds(): string[] {
  return Object.keys(CHAPTER_LOADERS);
}

export function findChapterIdForMedia(mediaId: string): string | null {
  for (const chapterId of listTrainingChapterIds()) {
    const doc = CHAPTER_LOADERS[chapterId]();
    if (doc.media.some((item) => item.mediaId === mediaId)) {
      return chapterId;
    }
  }
  return null;
}

export function loadChapterById(chapterId: string): TrainingChapterDocument {
  const load = CHAPTER_LOADERS[chapterId];
  if (!load) {
    throw new Error(`فصل تدريب غير معروف: ${chapterId}`);
  }
  return load();
}

/** إيجاد وسيلة بالمعرّف داخل مستند الفصل */
export function findMediaInChapter(
  doc: TrainingChapterDocument,
  mediaId: string
) {
  return doc.media.find((item) => item.mediaId === mediaId);
}

/** إيجاد مهارة بالمعرّف داخل مستند الفصل */
export function findSkillInChapter(
  doc: TrainingChapterDocument,
  skillId: string
) {
  return doc.skills.find((item) => item.skillId === skillId);
}

/** ترتيب الوسائل حسب orderedMedia */
export function orderedMediaInChapter(doc: TrainingChapterDocument) {
  return doc.chapter.orderedMedia
    .map((mediaId) => findMediaInChapter(doc, mediaId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

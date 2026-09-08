/**
 * تحميل مستندات الفصول التدريبية مع التحقق.
 */

import attentionFocusRaw from '@/data/training/chapters/attention-focus.json';
import {
  assertValidTrainingChapterDocument,
  validateTrainingChapterDocument,
} from '@/lib/training/validateChapter';
import type { TrainingChapterDocument } from '@/lib/training/types';

export const ATTENTION_FOCUS_CHAPTER_ID = 'attention-focus';

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
export function loadChapterById(chapterId: string): TrainingChapterDocument {
  if (chapterId === ATTENTION_FOCUS_CHAPTER_ID) {
    return loadAttentionFocusChapter();
  }
  throw new Error(`فصل تدريب غير معروف: ${chapterId}`);
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

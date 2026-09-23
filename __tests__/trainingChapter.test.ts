import { CRITERIA_LIST } from '../types/taalof';
import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
  orderedMediaInChapter,
  validateAttentionFocusChapter,
} from '../lib/training/loadChapter';
import {
  TRAINING_ENGINE_TYPES,
  type TrainingChapterDocument,
} from '../lib/training/types';
import {
  validateTrainingChapterDocument,
} from '../lib/training/validateChapter';
import { TRAINING_STORAGE } from '../lib/tracks/storageKeys';

describe('training chapter — attention-focus', () => {
  const criteriaIds = new Set(CRITERIA_LIST.map((c) => c.id));

  it('loads attention-focus chapter successfully', () => {
    const validation = validateAttentionFocusChapter();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);

    const doc = loadAttentionFocusChapter();
    expect(doc.platform).toBe('تآلف');
    expect(doc.chapter.chapterId).toBe(ATTENTION_FOCUS_CHAPTER_ID);
    expect(doc.chapter.titleAr).toBe('الانتباه والتركيز');
    expect(doc.chapter.titleEn).toBe('Attention & Focus');
  });

  it('defines exactly five media tools in ordered sequence', () => {
    const doc = loadAttentionFocusChapter();
    expect(doc.media).toHaveLength(5);
    expect(doc.chapter.orderedMedia).toEqual([
      'follow-star',
      'match-me',
      'where-did-it-go',
      'find-the-target',
      'wait-then-touch',
    ]);

    const ordered = orderedMediaInChapter(doc);
    expect(ordered.map((m) => m.mediaId)).toEqual(doc.chapter.orderedMedia);
    expect(ordered.map((m) => m.titleAr)).toEqual([
      'اتبع النجمة',
      'طابق مثلي',
      'أين اختفت؟',
      'ابحث عن الهدف',
      'انتظر ثم المس',
    ]);
  });

  it('requires every media item to link skills and goals', () => {
    const doc = loadAttentionFocusChapter();
    for (const item of doc.media) {
      expect(item.skillIds.length).toBeGreaterThan(0);
      expect(item.goalLinks.length).toBeGreaterThan(0);
      for (const link of item.goalLinks) {
        const hasSkillLink = (link.skillIds?.length ?? 0) > 0;
        const hasCriterionLink = (link.criterionIds?.length ?? 0) > 0;
        expect(hasSkillLink || hasCriterionLink).toBe(true);
      }
    }
  });

  it('uses valid engine types and difficulty levels', () => {
    const doc = loadAttentionFocusChapter();
    const engineSet = new Set<string>(TRAINING_ENGINE_TYPES);

    for (const item of doc.media) {
      expect(engineSet.has(item.engineType)).toBe(true);
      expect(item.difficultyLevels).toEqual([1, 2, 3]);
      if (item.config.difficulty !== undefined) {
        expect([1, 2, 3]).toContain(item.config.difficulty);
      }
    }

    expect(doc.chapter.difficultyLevels).toEqual([1, 2, 3]);
  });

  it('links chapter skills, criteria, and media consistently', () => {
    const doc = loadAttentionFocusChapter();
    const skillIds = new Set(doc.skills.map((s) => s.skillId));

    expect(doc.chapter.skillIds.every((id) => skillIds.has(id))).toBe(true);
    expect(doc.chapter.criterionIds.every((id) => criteriaIds.has(id))).toBe(
      true
    );

    for (const item of doc.media) {
      expect(item.skillIds.every((id) => skillIds.has(id))).toBe(true);
      expect(item.criterionIds.every((id) => criteriaIds.has(id))).toBe(true);
    }
  });

  it('exposes expandable media config without engine-specific code paths', () => {
    const doc = loadAttentionFocusChapter();
    const followStar = doc.media.find((m) => m.mediaId === 'follow-star');
    expect(followStar?.config.trialCount).toBe(10);
    expect(followStar?.config.prompting).toBe(true);
    expect(followStar?.config.content).toEqual(
      expect.objectContaining({ background: 'calm' })
    );
  });

  it('registers training storage keys following project convention', () => {
    expect(TRAINING_STORAGE.plans).toBe('taaluf.training.plans.v1');
    expect(TRAINING_STORAGE.sessions).toBe('taaluf.training.sessions.v1');
    expect(TRAINING_STORAGE.progress).toBe('taaluf.training.progress.v1');
  });
});

describe('training chapter validation', () => {
  const validDoc = loadAttentionFocusChapter();

  function cloneDoc(): TrainingChapterDocument {
    return JSON.parse(JSON.stringify(validDoc)) as TrainingChapterDocument;
  }

  it('rejects media without skill linkage', () => {
    const doc = cloneDoc();
    doc.media[0].skillIds = [];
    const result = validateTrainingChapterDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('skillIds'))).toBe(true);
  });

  it('rejects media without goal linkage', () => {
    const doc = cloneDoc();
    doc.media[0].goalLinks = [];
    const result = validateTrainingChapterDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('goalLinks'))).toBe(true);
  });

  it('rejects invalid engineType', () => {
    const doc = cloneDoc();
    doc.media[0].engineType = 'invalid_engine' as TrainingChapterDocument['media'][0]['engineType'];
    const result = validateTrainingChapterDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('engineType'))).toBe(true);
  });

  it('rejects invalid difficulty levels', () => {
    const doc = cloneDoc();
    doc.media[0].difficultyLevels = [1, 4 as 1];
    const result = validateTrainingChapterDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('difficulty'))).toBe(true);
  });

  it('rejects broken orderedMedia sequence', () => {
    const doc = cloneDoc();
    doc.chapter.orderedMedia = ['follow-star', 'missing-media'];
    const result = validateTrainingChapterDocument(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('orderedMedia'))).toBe(true);
  });

  it('rejects goalLinks without skill or criterion reference', () => {
    const doc = cloneDoc();
    doc.media[0].goalLinks = [
      {
        goalType: 'visual_tracking',
        labelAr: 'هدف',
        labelEn: 'Goal',
      },
    ];
    const result = validateTrainingChapterDocument(doc);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('goalLink') || e.includes('goalLinks'))
    ).toBe(true);
  });
});

import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '../lib/training/loadChapter';
import { requireTrainingMedia, TrainingEngineError } from '../lib/training/engine';
import {
  beginWhereDidItGoSession,
  commitWhereDidItGoTrial,
  finalizeWhereDidItGoSession,
  isWhereDidItGoSessionComplete,
  startWhereDidItGoTrial,
} from '../lib/training/whereDidItGoSessionFlow';
import {
  getTrainingProgress,
  getTrainingSession,
  setTrainingStorageAdapter,
} from '../lib/training/storage';
import { persistCompletedTrainingSession } from '../lib/training/sessionPersistence';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  setTrainingStorageAdapter({
    isAvailable: () => true,
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
  });
});

describe('where-did-it-go session flow', () => {
  const media = requireTrainingMedia(
    loadAttentionFocusChapter(),
    'where-did-it-go'
  );

  it('starts activity session from media config', () => {
    const bundle = beginWhereDidItGoSession({
      childId: 'child_wdig',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    });

    expect(bundle.session.status).toBe('active');
    expect(bundle.session.mediaId).toBe('where-did-it-go');
    expect(bundle.session.targetTrialCount).toBe(8);
    expect(bundle.settings.memoryLevel).toBe(1);
    expect(bundle.settings.locationCount).toBe(2);
  });

  it('records correct and incorrect trials with digital prompt levels', () => {
    let session = beginWhereDidItGoSession({
      childId: 'child_wdig',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    session = startWhereDidItGoTrial(session);
    session = commitWhereDidItGoTrial(session, {
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 4700,
    });

    session = startWhereDidItGoTrial(session);
    session = commitWhereDidItGoTrial(session, {
      correct: false,
      promptLevel: 'visual_hint',
      responseTimeMs: 6200,
    });

    expect(session.trials).toHaveLength(2);
    expect(session.trials[1].promptLevel).toBe('visual_hint');
    expect(isWhereDidItGoSessionComplete(session)).toBe(false);
  });

  it('completes session after trialCount trials', () => {
    let session = beginWhereDidItGoSession({
      childId: 'child_wdig',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    for (let i = 0; i < session.targetTrialCount; i += 1) {
      session = startWhereDidItGoTrial(session);
      session = commitWhereDidItGoTrial(session, {
        correct: i % 2 === 0,
        promptLevel: i % 2 === 0 ? 'independent' : 'reduced_choices',
        responseTimeMs: 4000 + i * 100,
      });
    }

    expect(isWhereDidItGoSessionComplete(session)).toBe(true);
    session = finalizeWhereDidItGoSession(session);
    expect(session.status).toBe('completed');
    expect(session.trials).toHaveLength(8);
  });

  it('prevents overlapping active trials', () => {
    let session = beginWhereDidItGoSession({
      childId: 'child_wdig',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    session = startWhereDidItGoTrial(session);
    expect(() => startWhereDidItGoTrial(session)).toThrow(TrainingEngineError);

    session = commitWhereDidItGoTrial(session, {
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 4700,
    });
    expect(() => startWhereDidItGoTrial(session)).not.toThrow();
  });

  it('persists session and updates progress', () => {
    let session = beginWhereDidItGoSession({
      childId: 'child_wdig',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    for (let i = 0; i < 4; i += 1) {
      session = startWhereDidItGoTrial(session);
      session = commitWhereDidItGoTrial(session, {
        correct: true,
        promptLevel: 'independent',
        responseTimeMs: 4500,
      });
    }

    session = finalizeWhereDidItGoSession(session);
    const persisted = persistCompletedTrainingSession(session);

    expect(persisted.session.status).toBe('completed');
    expect(persisted.metrics.totalTrials).toBe(4);
    expect(getTrainingSession(session.id)?.status).toBe('completed');
    expect(
      getTrainingProgress(
        'child_wdig',
        ATTENTION_FOCUS_CHAPTER_ID,
        'where-did-it-go'
      )?.completedSessions
    ).toBe(1);
    expect(persisted.progress.masteryLevel).toBe('emerging');
  });
});

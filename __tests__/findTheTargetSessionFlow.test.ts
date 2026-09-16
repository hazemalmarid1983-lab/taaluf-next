import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '../lib/training/loadChapter';
import { requireTrainingMedia, TrainingEngineError } from '../lib/training/engine';
import {
  beginFindTheTargetSession,
  commitFindTheTargetTrial,
  finalizeFindTheTargetSession,
  isFindTheTargetSessionComplete,
  startFindTheTargetTrial,
} from '../lib/training/findTheTargetSessionFlow';
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

describe('find-the-target session flow', () => {
  const media = requireTrainingMedia(
    loadAttentionFocusChapter(),
    'find-the-target'
  );

  it('begins activity session from media config', () => {
    const bundle = beginFindTheTargetSession({
      childId: 'child_search',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    });

    expect(bundle.session.status).toBe('active');
    expect(bundle.session.mediaId).toBe('find-the-target');
    expect(bundle.session.targetTrialCount).toBe(10);
    expect(bundle.settings.searchLevel).toBe(1);
    expect(bundle.settings.itemCount).toBe(2);
  });

  it('starts, commits, and tracks trials until complete', () => {
    let session = beginFindTheTargetSession({
      childId: 'child_search',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    session = startFindTheTargetTrial(session);
    session = commitFindTheTargetTrial(session, {
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 1800,
    });

    session = startFindTheTargetTrial(session);
    session = commitFindTheTargetTrial(session, {
      correct: false,
      promptLevel: 'visual_hint',
      responseTimeMs: 4200,
    });

    expect(session.trials).toHaveLength(2);
    expect(session.trials[1].promptLevel).toBe('visual_hint');
    expect(isFindTheTargetSessionComplete(session)).toBe(false);
  });

  it('completes session after trialCount trials', () => {
    let session = beginFindTheTargetSession({
      childId: 'child_search',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    for (let i = 0; i < session.targetTrialCount; i += 1) {
      session = startFindTheTargetTrial(session);
      session = commitFindTheTargetTrial(session, {
        correct: i % 2 === 0,
        promptLevel: i % 2 === 0 ? 'independent' : 'reduced_choices',
        responseTimeMs: 1500 + i * 100,
      });
    }

    expect(isFindTheTargetSessionComplete(session)).toBe(true);
    session = finalizeFindTheTargetSession(session);
    expect(session.status).toBe('completed');
    expect(session.trials).toHaveLength(10);
  });

  it('prevents overlapping active trials', () => {
    let session = beginFindTheTargetSession({
      childId: 'child_search',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    session = startFindTheTargetTrial(session);
    expect(() => startFindTheTargetTrial(session)).toThrow(TrainingEngineError);

    session = commitFindTheTargetTrial(session, {
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 1600,
    });
    expect(() => startFindTheTargetTrial(session)).not.toThrow();
  });

  it('persists session and updates progress', () => {
    let session = beginFindTheTargetSession({
      childId: 'child_search',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    for (let i = 0; i < 4; i += 1) {
      session = startFindTheTargetTrial(session);
      session = commitFindTheTargetTrial(session, {
        correct: true,
        promptLevel: 'independent',
        responseTimeMs: 1700,
      });
    }

    session = finalizeFindTheTargetSession(session);
    const persisted = persistCompletedTrainingSession(session);

    expect(persisted.session.status).toBe('completed');
    expect(persisted.metrics.totalTrials).toBe(4);
    expect(getTrainingSession(session.id)?.status).toBe('completed');
    expect(
      getTrainingProgress(
        'child_search',
        ATTENTION_FOCUS_CHAPTER_ID,
        'find-the-target'
      )?.completedSessions
    ).toBe(1);
    expect(persisted.progress.masteryLevel).toBe('emerging');
  });
});

import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '../lib/training/loadChapter';
import { requireTrainingMedia } from '../lib/training/engine';
import {
  beginFollowStarSession,
  commitFollowStarTrial,
  finalizeFollowStarSession,
  isFollowStarSessionComplete,
  startFollowStarTrial,
} from '../lib/training/followStarSessionFlow';
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

describe('follow-star session flow', () => {
  const media = requireTrainingMedia(
    loadAttentionFocusChapter(),
    'follow-star'
  );

  it('starts activity session from media config', () => {
    const bundle = beginFollowStarSession({
      childId: 'child_fs',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    });

    expect(bundle.session.status).toBe('active');
    expect(bundle.session.mediaId).toBe('follow-star');
    expect(bundle.session.targetTrialCount).toBe(10);
    expect(bundle.settings.trialCount).toBe(10);
  });

  it('records correct and incorrect trials with prompt levels', () => {
    let session = beginFollowStarSession({
      childId: 'child_fs',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    session = startFollowStarTrial(session);
    session = commitFollowStarTrial(session, {
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 900,
    });

    session = startFollowStarTrial(session);
    session = commitFollowStarTrial(session, {
      correct: false,
      promptLevel: 'visual_hint',
      responseTimeMs: 2100,
    });

    expect(session.trials).toHaveLength(2);
    expect(session.trials[0].correct).toBe(true);
    expect(session.trials[1].promptLevel).toBe('visual_hint');
    expect(isFollowStarSessionComplete(session)).toBe(false);
  });

  it('ends session, persists session, and updates progress', () => {
    let session = beginFollowStarSession({
      childId: 'child_fs',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    for (let i = 0; i < 3; i += 1) {
      session = startFollowStarTrial(session);
      session = commitFollowStarTrial(session, {
        correct: i !== 1,
        promptLevel: i === 0 ? 'independent' : 'visual_hint',
        responseTimeMs: 1000 + i * 100,
      });
    }

    session = finalizeFollowStarSession(session);
    const persisted = persistCompletedTrainingSession(session);

    expect(persisted.session.status).toBe('completed');
    expect(persisted.metrics.totalTrials).toBe(3);
    expect(getTrainingSession(session.id)?.status).toBe('completed');
    expect(
      getTrainingProgress('child_fs', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star')
        ?.completedSessions
    ).toBe(1);
    expect(persisted.progress.masteryLevel).toBe('emerging');
  });
});

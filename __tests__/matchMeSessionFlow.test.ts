import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '../lib/training/loadChapter';
import { requireTrainingMedia } from '../lib/training/engine';
import {
  beginMatchMeSession,
  commitMatchMeTrial,
  finalizeMatchMeSession,
  isMatchMeSessionComplete,
  startMatchMeTrial,
} from '../lib/training/matchMeSessionFlow';
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

describe('match-me session flow', () => {
  const media = requireTrainingMedia(loadAttentionFocusChapter(), 'match-me');

  it('starts activity session from media config', () => {
    const bundle = beginMatchMeSession({
      childId: 'child_mm',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    });

    expect(bundle.session.status).toBe('active');
    expect(bundle.session.mediaId).toBe('match-me');
    expect(bundle.session.targetTrialCount).toBe(10);
    expect(bundle.settings.trialCount).toBe(10);
    expect(bundle.settings.choiceCount).toBe(2);
  });

  it('records correct and incorrect trials with prompt levels', () => {
    let session = beginMatchMeSession({
      childId: 'child_mm',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    session = startMatchMeTrial(session);
    session = commitMatchMeTrial(session, {
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 1100,
    });

    session = startMatchMeTrial(session);
    session = commitMatchMeTrial(session, {
      correct: false,
      promptLevel: 'reduced_choices',
      responseTimeMs: 4200,
    });

    expect(session.trials).toHaveLength(2);
    expect(session.trials[0].correct).toBe(true);
    expect(session.trials[1].promptLevel).toBe('reduced_choices');
    expect(isMatchMeSessionComplete(session)).toBe(false);
  });

  it('completes session after trialCount trials', () => {
    let session = beginMatchMeSession({
      childId: 'child_mm',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    for (let i = 0; i < session.targetTrialCount; i += 1) {
      session = startMatchMeTrial(session);
      session = commitMatchMeTrial(session, {
        correct: i % 2 === 0,
        promptLevel: i % 2 === 0 ? 'independent' : 'visual_hint',
        responseTimeMs: 1000 + i * 50,
      });
    }

    expect(isMatchMeSessionComplete(session)).toBe(true);
    session = finalizeMatchMeSession(session);
    expect(session.status).toBe('completed');
    expect(session.trials).toHaveLength(10);
  });

  it('persists session and updates progress', () => {
    let session = beginMatchMeSession({
      childId: 'child_mm',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    for (let i = 0; i < 4; i += 1) {
      session = startMatchMeTrial(session);
      session = commitMatchMeTrial(session, {
        correct: true,
        promptLevel: 'independent',
        responseTimeMs: 900,
      });
    }

    session = finalizeMatchMeSession(session);
    const persisted = persistCompletedTrainingSession(session);

    expect(persisted.session.status).toBe('completed');
    expect(persisted.metrics.totalTrials).toBe(4);
    expect(getTrainingSession(session.id)?.status).toBe('completed');
    expect(
      getTrainingProgress('child_mm', ATTENTION_FOCUS_CHAPTER_ID, 'match-me')
        ?.completedSessions
    ).toBe(1);
    expect(persisted.progress.masteryLevel).toBe('emerging');
  });
});

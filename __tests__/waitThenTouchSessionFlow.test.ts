import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '../lib/training/loadChapter';
import { requireTrainingMedia, TrainingEngineError } from '../lib/training/engine';
import {
  beginWaitThenTouchSession,
  commitWaitThenTouchTrial,
  finalizeWaitThenTouchSession,
  isWaitThenTouchSessionComplete,
  startWaitThenTouchTrial,
} from '../lib/training/waitThenTouchSessionFlow';
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

describe('wait-then-touch session flow', () => {
  const media = requireTrainingMedia(
    loadAttentionFocusChapter(),
    'wait-then-touch'
  );

  it('begins activity session from media config', () => {
    const bundle = beginWaitThenTouchSession({
      childId: 'child_wait',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    });

    expect(bundle.session.status).toBe('active');
    expect(bundle.session.mediaId).toBe('wait-then-touch');
    expect(bundle.session.targetTrialCount).toBe(10);
    expect(bundle.settings.controlLevel).toBe(1);
  });

  it('commits correct, premature, and timeout outcomes', () => {
    let session = beginWaitThenTouchSession({
      childId: 'child_wait',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    session = startWaitThenTouchTrial(session);
    session = commitWaitThenTouchTrial(session, {
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 820,
      outcomeKind: 'correct',
    });

    session = startWaitThenTouchTrial(session);
    session = commitWaitThenTouchTrial(session, {
      correct: false,
      promptLevel: 'independent',
      responseTimeMs: 540,
      outcomeKind: 'premature',
    });

    session = startWaitThenTouchTrial(session);
    session = commitWaitThenTouchTrial(session, {
      correct: false,
      promptLevel: 'no_response',
      responseTimeMs: 6000,
      outcomeKind: 'timeout',
    });

    expect(session.trials).toHaveLength(3);
    expect(session.trials[0].correct).toBe(true);
    expect(session.trials[1].correct).toBe(false);
    expect(session.trials[1].promptLevel).toBe('independent');
    expect(session.trials[2].promptLevel).toBe('no_response');
  });

  it('completes session after trialCount trials', () => {
    let session = beginWaitThenTouchSession({
      childId: 'child_wait',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    for (let i = 0; i < session.targetTrialCount; i += 1) {
      session = startWaitThenTouchTrial(session);
      session = commitWaitThenTouchTrial(session, {
        correct: i % 2 === 0,
        promptLevel: i % 2 === 0 ? 'independent' : 'no_response',
        responseTimeMs: 1000 + i * 50,
        outcomeKind: i % 2 === 0 ? 'correct' : 'timeout',
      });
    }

    expect(isWaitThenTouchSessionComplete(session)).toBe(true);
    session = finalizeWaitThenTouchSession(session);
    expect(session.status).toBe('completed');
    expect(session.trials).toHaveLength(10);
  });

  it('prevents overlapping active trials', () => {
    let session = beginWaitThenTouchSession({
      childId: 'child_wait',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    session = startWaitThenTouchTrial(session);
    expect(() => startWaitThenTouchTrial(session)).toThrow(TrainingEngineError);

    session = commitWaitThenTouchTrial(session, {
      correct: false,
      promptLevel: 'independent',
      responseTimeMs: 400,
      outcomeKind: 'premature',
    });
    expect(() => startWaitThenTouchTrial(session)).not.toThrow();
  });

  it('persists session and updates progress', () => {
    let session = beginWaitThenTouchSession({
      childId: 'child_wait',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    }).session;

    for (let i = 0; i < 4; i += 1) {
      session = startWaitThenTouchTrial(session);
      session = commitWaitThenTouchTrial(session, {
        correct: true,
        promptLevel: 'independent',
        responseTimeMs: 900,
        outcomeKind: 'correct',
      });
    }

    session = finalizeWaitThenTouchSession(session);
    const persisted = persistCompletedTrainingSession(session);

    expect(persisted.session.status).toBe('completed');
    expect(persisted.metrics.totalTrials).toBe(4);
    expect(getTrainingSession(session.id)?.status).toBe('completed');
    expect(
      getTrainingProgress(
        'child_wait',
        ATTENTION_FOCUS_CHAPTER_ID,
        'wait-then-touch'
      )?.completedSessions
    ).toBe(1);
    expect(persisted.progress.masteryLevel).toBe('emerging');
  });
});

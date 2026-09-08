import { calculateSessionMetrics } from '../lib/training/engine';
import type { TrainingSessionRuntime } from '../lib/training/engine/types';
import {
  buildUpdatedTrainingProgress,
  deriveTrainingMasteryLevel,
  persistCompletedTrainingSession,
} from '../lib/training/sessionPersistence';
import {
  createTrainingSession,
  endTrainingSession,
  recordTrial,
  requireTrainingMedia,
  runTrainingTrialLoop,
  startTrial,
} from '../lib/training/engine';
import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '../lib/training/loadChapter';
import {
  getTrainingProgress,
  getTrainingSession,
  setTrainingStorageAdapter,
} from '../lib/training/storage';

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

describe('training session persistence layer', () => {
  it('derives mastery levels from metrics', () => {
    expect(deriveTrainingMasteryLevel(85, 75, 3)).toBe('mastered');
    expect(deriveTrainingMasteryLevel(60, 40, 2)).toBe('developing');
    expect(deriveTrainingMasteryLevel(40, 20, 1)).toBe('emerging');
  });

  it('builds progress snapshot with accuracy independence and sessions', () => {
    const media = requireTrainingMedia(
      loadAttentionFocusChapter(),
      'follow-star'
    );
    const completed = runTrainingTrialLoop(
      createTrainingSession({
        childId: 'child_p',
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        media,
      }),
      [
        { correct: true, promptLevel: 'independent', responseTimeMs: 500 },
        { correct: true, promptLevel: 'independent', responseTimeMs: 600 },
      ]
    );

    const metrics = calculateSessionMetrics(completed.trials);
    const progress = buildUpdatedTrainingProgress(null, completed, metrics);

    expect(progress.completedSessions).toBe(1);
    expect(progress.independenceRate).toBe(100);
    expect(progress.lastDifficulty).toBe(1);
    expect(progress.masteryLevel).toBe('emerging');
  });

  it('persists session and increments progress on repeat completion', () => {
    const media = requireTrainingMedia(
      loadAttentionFocusChapter(),
      'follow-star'
    );

    const first = runTrainingTrialLoop(
      createTrainingSession({
        id: 'sess_1',
        childId: 'child_p',
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        media,
      }),
      [{ correct: true, promptLevel: 'independent', responseTimeMs: 400 }]
    );

    persistCompletedTrainingSession(first);

    let second = createTrainingSession({
      id: 'sess_2',
      childId: 'child_p',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    });
    second = startTrial(second);
    second = recordTrial(second, {
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 500,
    });
    second = endTrainingSession(second);
    persistCompletedTrainingSession(second);

    expect(getTrainingSession('sess_1')).toBeTruthy();
    expect(getTrainingSession('sess_2')).toBeTruthy();
    expect(
      getTrainingProgress('child_p', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star')
        ?.completedSessions
    ).toBe(2);
  });
});

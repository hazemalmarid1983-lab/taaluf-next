import { createTrainingActivityFlow } from '../lib/training/activityFlow';
import { calculateSessionMetrics } from '../lib/training/engine';
import { resolveFollowStarRuntimeSettings } from '../lib/training/followStarEngine';
import {
  findOpenLiveTrainingSession,
  readLiveTrainingSession,
} from '../lib/training/liveSessionDraft';
import { persistSessionAndAdvancePlan } from '../lib/training/planExecution';
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

  it('restores in-progress trials for the same session id after reload', () => {
    const media = requireTrainingMedia(
      loadAttentionFocusChapter(),
      'follow-star'
    );
    const flow = createTrainingActivityFlow({
      resolveSettings: resolveFollowStarRuntimeSettings,
      resolveDifficulty: (settings) => settings.difficulty,
    });
    const started = flow.startTrial(
      flow.begin({
        childId: 'child_p',
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        media,
      }).session
    );
    const afterFirstTrial = flow.commitTrial(started, {
      correct: true,
      promptLevel: 'independent',
      responseTimeMs: 400,
    });

    const restored = readLiveTrainingSession(afterFirstTrial.id);
    expect(restored?.id).toBe(afterFirstTrial.id);
    expect(restored?.status).toBe('active');
    expect(restored?.trials).toHaveLength(1);
    expect(restored?.trials[0]?.promptLevel).toBe('independent');
    expect(
      findOpenLiveTrainingSession({
        childId: 'child_p',
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        mediaId: 'follow-star',
      })?.id
    ).toBe(afterFirstTrial.id);

    const resumed = flow.begin({
      childId: 'child_p',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    });
    expect(resumed.session.id).toBe(afterFirstTrial.id);
    expect(resumed.session.trials).toHaveLength(1);

    let finished = resumed.session;
    while (finished.trials.length < finished.targetTrialCount) {
      const playing =
        finished.activeTrialNumber !== undefined
          ? finished
          : flow.startTrial(finished);
      finished = flow.commitTrial(playing, {
        correct: true,
        promptLevel: 'independent',
        responseTimeMs: 300,
      });
    }

    finished = flow.finalize(finished);
    persistSessionAndAdvancePlan(finished);
    expect(readLiveTrainingSession(afterFirstTrial.id)).toBeNull();
    expect(getTrainingSession(afterFirstTrial.id)?.status).toBe('completed');
    expect(getTrainingSession(afterFirstTrial.id)?.trials.length).toBe(
      finished.targetTrialCount
    );
  });
});

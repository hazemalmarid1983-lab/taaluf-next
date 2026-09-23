import { TRAINING_STORAGE } from '../lib/tracks/storageKeys';
import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '../lib/training/loadChapter';
import {
  createTrainingSession,
  requireTrainingMedia,
  runTrainingTrialLoop,
} from '../lib/training/engine';
import {
  clearAllTrainingStorage,
  deleteTrainingPlan,
  deleteTrainingProgress,
  deleteTrainingSession,
  getTrainingPlan,
  getTrainingProgress,
  getTrainingSession,
  getTrainingStorageAdapter,
  listTrainingPlans,
  listTrainingProgress,
  listTrainingSessions,
  resetTrainingStorageAdapter,
  saveTrainingPlan,
  saveTrainingProgress,
  saveTrainingSession,
  setTrainingStorageAdapter,
  trainingProgressKey,
  type TrainingStorageAdapter,
} from '../lib/training/storage';
import type { TrainingPlan, TrainingProgress } from '../lib/training/types';
import { createTrainingPlan } from '../lib/training/createPlan';

const memory = new Map<string, string>();

function installMemoryStorage(initial?: Record<string, string>) {
  memory.clear();
  if (initial) {
    for (const [key, value] of Object.entries(initial)) {
      memory.set(key, value);
    }
  }
  setTrainingStorageAdapter({
    isAvailable: () => true,
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
    removeItem: (key) => {
      memory.delete(key);
    },
  });
}

function readMemoryKey(key: string): string | null {
  return memory.get(key) ?? null;
}

beforeEach(() => {
  resetTrainingStorageAdapter();
  installMemoryStorage();
  clearAllTrainingStorage();
});

afterEach(() => {
  resetTrainingStorageAdapter();
  memory.clear();
});

describe('training persistence — plans', () => {
  const samplePlan: TrainingPlan = createTrainingPlan({
    id: 'plan_1',
    childId: 'child_1',
    chapterId: ATTENTION_FOCUS_CHAPTER_ID,
    goalIds: ['goal_a'],
    assignments: [
      { mediaId: 'follow-star', difficulty: 1, order: 1 },
      { mediaId: 'match-me', difficulty: 1, order: 2 },
    ],
    startDate: '2026-09-08T00:00:00.000Z',
    targetDate: '2026-10-08T00:00:00.000Z',
    status: 'active',
  });

  it('saves and reads a training plan from TRAINING_STORAGE.plans', () => {
    saveTrainingPlan(samplePlan);
    expect(readMemoryKey(TRAINING_STORAGE.plans)).toBeTruthy();
    expect(getTrainingPlan('plan_1')).toEqual(samplePlan);
    expect(listTrainingPlans('child_1')).toEqual([samplePlan]);
  });

  it('updates an existing plan', () => {
    saveTrainingPlan(samplePlan);
    const updated: TrainingPlan = {
      ...samplePlan,
      status: 'paused',
      assignments: [samplePlan.assignments[0]],
    };
    saveTrainingPlan(updated);
    expect(getTrainingPlan('plan_1')?.status).toBe('paused');
    expect(listTrainingPlans()).toHaveLength(1);
  });

  it('deletes a plan by id', () => {
    saveTrainingPlan(samplePlan);
    expect(deleteTrainingPlan('plan_1')).toBe(true);
    expect(getTrainingPlan('plan_1')).toBeNull();
    expect(deleteTrainingPlan('missing')).toBe(false);
  });

  it('rejects invalid plan payloads on save', () => {
    expect(() =>
      saveTrainingPlan({
        ...samplePlan,
        status: 'invalid' as TrainingPlan['status'],
      })
    ).toThrow();
  });
});

describe('training persistence — sessions', () => {
  const doc = loadAttentionFocusChapter();
  const media = requireTrainingMedia(doc, 'follow-star');

  function completedSession() {
    return runTrainingTrialLoop(
      createTrainingSession({
        id: 'session_1',
        childId: 'child_1',
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        media,
        planId: 'plan_1',
      }),
      [{ correct: true, promptLevel: 'independent', responseTimeMs: 500 }]
    );
  }

  it('saves and reads a completed training session', () => {
    const session = completedSession();
    saveTrainingSession(session);

    expect(readMemoryKey(TRAINING_STORAGE.sessions)).toBeTruthy();
    expect(getTrainingSession('session_1')?.status).toBe('completed');
    expect(listTrainingSessions('child_1')[0].trials).toHaveLength(1);
  });

  it('updates a stored session', () => {
    const session = completedSession();
    saveTrainingSession(session);

    const active = createTrainingSession({
      id: 'session_2',
      childId: 'child_1',
      chapterId: ATTENTION_FOCUS_CHAPTER_ID,
      media,
    });
    saveTrainingSession(active);
    expect(listTrainingSessions()).toHaveLength(2);

    const resumed = { ...active, activeTrialNumber: 1 };
    saveTrainingSession(resumed);
    expect(getTrainingSession('session_2')?.activeTrialNumber).toBe(1);
  });

  it('deletes a session by id', () => {
    saveTrainingSession(completedSession());
    expect(deleteTrainingSession('session_1')).toBe(true);
    expect(getTrainingSession('session_1')).toBeNull();
  });
});

describe('training persistence — progress', () => {
  const sampleProgress: TrainingProgress = {
    childId: 'child_1',
    chapterId: ATTENTION_FOCUS_CHAPTER_ID,
    mediaId: 'follow-star',
    completedSessions: 2,
    lastDifficulty: 1,
    independenceRate: 75,
    lastSessionAt: '2026-09-08T12:00:00.000Z',
    masteryLevel: 'developing',
  };

  it('saves and reads progress by composite key', () => {
    saveTrainingProgress(sampleProgress);
    expect(readMemoryKey(TRAINING_STORAGE.progress)).toBeTruthy();
    expect(
      getTrainingProgress('child_1', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star')
    ).toEqual(sampleProgress);
    expect(trainingProgressKey(sampleProgress)).toBe(
      'child_1::attention-focus::follow-star'
    );
  });

  it('updates progress for the same child/chapter/media', () => {
    saveTrainingProgress(sampleProgress);
    const updated: TrainingProgress = {
      ...sampleProgress,
      completedSessions: 3,
      masteryLevel: 'mastered',
    };
    saveTrainingProgress(updated);
    expect(listTrainingProgress('child_1')).toHaveLength(1);
    expect(getTrainingProgress('child_1', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star')
      ?.completedSessions).toBe(3);
  });

  it('deletes progress by composite key', () => {
    saveTrainingProgress(sampleProgress);
    expect(
      deleteTrainingProgress(
        'child_1',
        ATTENTION_FOCUS_CHAPTER_ID,
        'follow-star'
      )
    ).toBe(true);
    expect(
      getTrainingProgress('child_1', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star')
    ).toBeNull();
  });
});

describe('training persistence — corrupt and missing data', () => {
  const validPlan: TrainingPlan = createTrainingPlan({
    id: 'plan_ok',
    childId: 'child_1',
    chapterId: ATTENTION_FOCUS_CHAPTER_ID,
    assignments: [{ mediaId: 'follow-star', order: 1 }],
    startDate: '2026-09-08T00:00:00.000Z',
    status: 'draft',
  });

  it('returns empty lists for corrupt JSON', () => {
    installMemoryStorage({
      [TRAINING_STORAGE.plans]: '{not-json',
      [TRAINING_STORAGE.sessions]: '123',
      [TRAINING_STORAGE.progress]: 'null',
    });

    expect(listTrainingPlans()).toEqual([]);
    expect(listTrainingSessions()).toEqual([]);
    expect(listTrainingProgress()).toEqual([]);
  });

  it('filters invalid records and keeps valid ones', () => {
    installMemoryStorage({
      [TRAINING_STORAGE.plans]: JSON.stringify([
        validPlan,
        { id: 'bad', childId: '', chapterId: '', assignments: [] },
      ]),
    });

    expect(listTrainingPlans()).toEqual([validPlan]);
  });

  it('does not throw when saving with unavailable storage', () => {
    const unavailableAdapter: TrainingStorageAdapter = {
      isAvailable: () => false,
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    setTrainingStorageAdapter(unavailableAdapter);

    expect(() => saveTrainingPlan(validPlan)).not.toThrow();
    expect(listTrainingPlans()).toEqual([]);
    expect(getTrainingPlan('plan_ok')).toBeNull();

    expect(getTrainingStorageAdapter().isAvailable()).toBe(false);
  });

  it('returns empty reads when localStorage is undefined', () => {
    const previous = (global as { localStorage?: Storage }).localStorage;
    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      value: undefined,
    });
    resetTrainingStorageAdapter();

    expect(listTrainingPlans()).toEqual([]);
    expect(() =>
      saveTrainingPlan({
        ...validPlan,
        id: 'plan_no_ls',
      })
    ).not.toThrow();
    expect(listTrainingPlans()).toEqual([]);

    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      value: previous,
    });
    resetTrainingStorageAdapter();
  });
});

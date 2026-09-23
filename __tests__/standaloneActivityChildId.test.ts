import {
  preparePlanActivityBegin,
  resolveStandaloneActivityChildId,
  STANDALONE_TRAINING_CHILD_FALLBACK,
} from '@/lib/training/planActivitySafety';
import {
  createTrainingSession,
  requireTrainingMedia,
  runTrainingTrialLoop,
} from '@/lib/training/engine';
import { loadAttentionFocusChapter } from '@/lib/training/loadChapter';
import {
  clearAllTrainingStorage,
  getTrainingSession,
  listTrainingSessions,
  resetTrainingStorageAdapter,
  setTrainingStorageAdapter,
} from '@/lib/training/storage';
import { persistCompletedTrainingSession } from '@/lib/training/sessionPersistence';
import { filterCompletedSessionsForChild } from '@/lib/training/trainingResultsPresentation';
import { readActiveTrainingChildId, readTrainingChildId } from '@/lib/training/sessionPersistence';

const ACTIVE_STUDENT_KEY = 'taaluf.activeStudent';
const LAUNCH_KEY = 'taaluf.training.launch.v1';

function installBrowserMocks() {
  const localStore: Record<string, string> = {};
  const sessionStore: Record<string, string> = {};

  // @ts-expect-error test env mock
  global.window = global;

  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: (key: string) => localStore[key] ?? null,
      setItem: (key: string, value: string) => {
        localStore[key] = value;
      },
      removeItem: (key: string) => {
        delete localStore[key];
      },
      clear: () => {
        Object.keys(localStore).forEach((key) => delete localStore[key]);
      },
    },
    writable: true,
  });

  Object.defineProperty(global, 'sessionStorage', {
    value: {
      getItem: (key: string) => sessionStore[key] ?? null,
      setItem: (key: string, value: string) => {
        sessionStore[key] = value;
      },
      removeItem: (key: string) => {
        delete sessionStore[key];
      },
      clear: () => {
        Object.keys(sessionStore).forEach((key) => delete sessionStore[key]);
      },
    },
    writable: true,
  });

  return { localStore, sessionStore };
}

function setActiveStudent(id: string) {
  localStorage.setItem(ACTIVE_STUDENT_KEY, JSON.stringify({ id }));
}

function setLaunchContext(mediaId: string) {
  sessionStorage.setItem(
    LAUNCH_KEY,
    JSON.stringify({
      planId: 'plan_1',
      chapterId: 'attention-focus',
      mediaId,
      difficulty: 2,
      order: 1,
    })
  );
}

const memory = new Map<string, string>();

function installTrainingStorage() {
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

describe('G2 — standalone activity child id consistency', () => {
  beforeEach(() => {
    installBrowserMocks();
    resetTrainingStorageAdapter();
    memory.clear();
    clearAllTrainingStorage();
  });

  afterEach(() => {
    resetTrainingStorageAdapter();
    memory.clear();
  });

  it('uses activeStudent.id when active student is set (standalone)', () => {
    setActiveStudent('child_a');
    expect(resolveStandaloneActivityChildId()).toBe('child_a');

    const begin = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
    expect(begin).toEqual({ ok: true, childId: 'child_a', goalIds: [] });
  });

  it('does not use child_local when activeStudent exists', () => {
    setActiveStudent('child_a');
    const begin = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
    expect(begin.ok).toBe(true);
    if (begin.ok) {
      expect(begin.childId).not.toBe('child_local');
      expect(begin.childId).toBe('child_a');
    }
    expect(readTrainingChildId()).toBe('child_a');
  });

  it('falls back to child_local when no activeStudent (no invented id)', () => {
    expect(readActiveTrainingChildId()).toBeNull();
    expect(resolveStandaloneActivityChildId()).toBe(
      STANDALONE_TRAINING_CHILD_FALLBACK
    );
    const begin = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
    expect(begin).toEqual({
      ok: true,
      childId: STANDALONE_TRAINING_CHILD_FALLBACK,
      goalIds: [],
    });
  });

  it('plan-linked begin behavior unchanged when launch matches', () => {
    setActiveStudent('child_1');
    setLaunchContext('follow-star');

    const result = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
    expect(result).toEqual({
      ok: true,
      childId: 'child_1',
      planId: 'plan_1',
      sessionDifficulty: 2,
      goalIds: [],
    });
  });

  it('standalone session keeps goalIds empty on begin', () => {
    setActiveStudent('child_a');
    const begin = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
    expect(begin.ok).toBe(true);
    if (begin.ok) {
      expect(begin.goalIds).toEqual([]);
    }
  });

  it('standalone completed session appears in active child results list', () => {
    installTrainingStorage();
    setActiveStudent('child_a');

    const begin = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
    expect(begin.ok).toBe(true);
    if (!begin.ok) return;

    const doc = loadAttentionFocusChapter();
    const media = requireTrainingMedia(doc, 'follow-star');
    const session = runTrainingTrialLoop(
      createTrainingSession({
        childId: begin.childId,
        chapterId: 'attention-focus',
        media,
        goalIds: begin.goalIds,
      }),
      [{ correct: true, promptLevel: 'independent', responseTimeMs: 400 }]
    );

    persistCompletedTrainingSession(session);

    const forActive = filterCompletedSessionsForChild(
      listTrainingSessions(),
      'child_a'
    );
    expect(forActive.some((s) => s.id === session.id)).toBe(true);
    expect(forActive[0]?.childId).toBe('child_a');
  });

  it('child A active — standalone session belongs to A not B', () => {
    installTrainingStorage();
    setActiveStudent('child_a');

    const begin = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
    if (!begin.ok) throw new Error('expected begin ok');

    const doc = loadAttentionFocusChapter();
    const media = requireTrainingMedia(doc, 'follow-star');
    const session = runTrainingTrialLoop(
      createTrainingSession({
        childId: begin.childId,
        chapterId: 'attention-focus',
        media,
      }),
      [{ correct: true, promptLevel: 'independent', responseTimeMs: 400 }]
    );
    persistCompletedTrainingSession(session);

    expect(filterCompletedSessionsForChild(listTrainingSessions(), 'child_b')).toEqual(
      []
    );
    expect(
      filterCompletedSessionsForChild(listTrainingSessions(), 'child_a')
    ).toHaveLength(1);
  });

  it('re-persisting same session id does not change stored childId', () => {
    installTrainingStorage();
    setActiveStudent('child_a');
    const begin = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
    if (!begin.ok) throw new Error('expected begin ok');

    const doc = loadAttentionFocusChapter();
    const media = requireTrainingMedia(doc, 'follow-star');
    const session = runTrainingTrialLoop(
      createTrainingSession({
        id: 'sess_dup',
        childId: begin.childId,
        chapterId: 'attention-focus',
        media,
      }),
      [{ correct: true, promptLevel: 'independent', responseTimeMs: 400 }]
    );

    persistCompletedTrainingSession(session);
    persistCompletedTrainingSession(session);

    expect(getTrainingSession('sess_dup')?.childId).toBe('child_a');
  });

  it('ignores wrong-media recovery but uses activeStudent for standalone', () => {
    setActiveStudent('child_real');
    sessionStorage.setItem(
      'taaluf.training.planActivityRecovery.v1',
      JSON.stringify({
        planId: 'plan_1',
        chapterId: 'attention-focus',
        mediaId: 'match-me',
        difficulty: 2,
        order: 2,
        childId: 'child_1',
      })
    );

    const result = preparePlanActivityBegin({ pageMediaId: 'follow-star' });
    expect(result).toEqual({ ok: true, childId: 'child_real', goalIds: [] });
  });
});

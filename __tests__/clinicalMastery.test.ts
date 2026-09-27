import {
  CLINICAL_MASTERY_CONSECUTIVE_SESSIONS,
  CLINICAL_MASTERY_INDEPENDENCE_PERCENT,
  hasClinicalMastery,
  isFullyIndependentCounts,
  nextIndependentStreak,
} from '../lib/clinicalMastery';
import type { TrackedGoal } from '../lib/goalsEngine';
import {
  HOME_SESSIONS_STORAGE_KEY,
  evaluateHomeSession,
  saveHomeSession,
  type TrialResult,
} from '../lib/homeClassroomEngine';
import type { PromptHierarchyLevel } from '../lib/promptHierarchy';
import { toGoalTrackingItem } from '../lib/progressTracker';
import {
  createTrainingSession,
  requireTrainingMedia,
  runTrainingTrialLoop,
} from '../lib/training/engine';
import {
  ATTENTION_FOCUS_CHAPTER_ID,
  loadAttentionFocusChapter,
} from '../lib/training/loadChapter';
import {
  checkLevelMastery,
  initialActivityLevelRecord,
  type ActivityLevelRecord,
} from '../lib/training/masteryEngine';
import { persistCompletedTrainingSession } from '../lib/training/sessionPersistence';
import { getTrainingProgress, setTrainingStorageAdapter } from '../lib/training/storage';
import type { TrainingPromptLevel } from '../lib/training/types';

const INDEPENDENT = [{ promptLevel: 'independent' }, { promptLevel: 'independent' }];
const ONE_PROMPT = [{ promptLevel: 'independent' }, { promptLevel: 'gestural' }];

describe('clinical mastery rule', () => {
  it('requires exactly 3 consecutive sessions at 100% independence', () => {
    expect(CLINICAL_MASTERY_CONSECUTIVE_SESSIONS).toBe(3);
    expect(CLINICAL_MASTERY_INDEPENDENCE_PERCENT).toBe(100);
  });

  it('does not grant mastery after one or two independent sessions', () => {
    expect(hasClinicalMastery([{ fullyIndependent: true }])).toBe(false);
    expect(
      hasClinicalMastery([{ fullyIndependent: true }, { fullyIndependent: true }])
    ).toBe(false);
  });

  it('grants mastery on the third consecutive independent session', () => {
    expect(
      hasClinicalMastery([
        { fullyIndependent: true },
        { fullyIndependent: true },
        { fullyIndependent: true },
      ])
    ).toBe(true);
  });

  it.each([0, 1, 2])('any prompted session at position %i breaks the run', (prompted) => {
    const sessions = [0, 1, 2].map((i) => ({ fullyIndependent: i !== prompted }));
    expect(hasClinicalMastery(sessions)).toBe(false);
  });

  it('does not count independent sessions that are not consecutive', () => {
    expect(
      hasClinicalMastery([
        { fullyIndependent: true },
        { fullyIndependent: true },
        { fullyIndependent: false },
        { fullyIndependent: true },
        { fullyIndependent: true },
      ])
    ).toBe(false);
  });

  it('treats a session with one prompted trial as not fully independent', () => {
    expect(nextIndependentStreak(2, ONE_PROMPT)).toBe(0);
    expect(nextIndependentStreak(2, INDEPENDENT)).toBe(3);
    expect(nextIndependentStreak(2, [])).toBe(0);
  });

  it('does not round 199/200 up to full independence', () => {
    expect(isFullyIndependentCounts(199, 200)).toBe(false);
    expect(isFullyIndependentCounts(200, 200)).toBe(true);
    expect(isFullyIndependentCounts(0, 0)).toBe(false);
  });
});

describe('activity level promotion', () => {
  const run = (sessions: ReadonlyArray<ReadonlyArray<{ promptLevel: string }>>) => {
    let record: ActivityLevelRecord = initialActivityLevelRecord();
    let advanced = false;
    for (const s of sessions) {
      const decision = checkLevelMastery(s, record);
      record = decision.record;
      advanced = advanced || decision.advanced;
    }
    return { record, advanced };
  };

  it('does not advance after one or two independent sessions', () => {
    expect(run([INDEPENDENT]).advanced).toBe(false);
    expect(run([INDEPENDENT, INDEPENDENT]).advanced).toBe(false);
  });

  it('advances only after the third consecutive independent session', () => {
    const result = run([INDEPENDENT, INDEPENDENT, INDEPENDENT]);
    expect(result.advanced).toBe(true);
    expect(result.record.level).toBe(2);
  });

  it('does not advance when any of the three sessions had a prompt', () => {
    expect(run([INDEPENDENT, ONE_PROMPT, INDEPENDENT]).advanced).toBe(false);
    expect(run([ONE_PROMPT, INDEPENDENT, INDEPENDENT]).advanced).toBe(false);
    expect(run([INDEPENDENT, INDEPENDENT, ONE_PROMPT]).advanced).toBe(false);
  });
});

describe('training progress mastery', () => {
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

  const media = () => requireTrainingMedia(loadAttentionFocusChapter(), 'follow-star');
  let seq = 0;
  const complete = (levels: TrainingPromptLevel[]) => {
    seq += 1;
    const session = runTrainingTrialLoop(
      createTrainingSession({
        id: `mastery_${seq}`,
        childId: 'child_m',
        chapterId: ATTENTION_FOCUS_CHAPTER_ID,
        media: media(),
      }),
      levels.map((promptLevel) => ({
        correct: true,
        promptLevel,
        responseTimeMs: 500,
      }))
    );
    persistCompletedTrainingSession(session);
    return getTrainingProgress('child_m', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star');
  };

  it('is not mastered after one or two fully independent sessions', () => {
    expect(complete(['independent', 'independent'])?.masteryLevel).not.toBe('mastered');
    expect(complete(['independent', 'independent'])?.masteryLevel).not.toBe('mastered');
  });

  it('is mastered after the third consecutive fully independent session', () => {
    complete(['independent', 'independent']);
    complete(['independent', 'independent']);
    const progress = complete(['independent', 'independent']);
    expect(progress?.consecutiveIndependentSessions).toBe(3);
    expect(progress?.masteryLevel).toBe('mastered');
  });

  it('is not mastered when a prompt appears in one of the three sessions', () => {
    complete(['independent', 'independent']);
    complete(['independent', 'visual_hint']);
    const progress = complete(['independent', 'independent']);
    expect(progress?.consecutiveIndependentSessions).toBe(1);
    expect(progress?.masteryLevel).not.toBe('mastered');
  });

  it('is not mastered at high but imperfect independence', () => {
    for (let i = 0; i < 4; i += 1) {
      complete(['independent', 'independent', 'independent', 'independent', 'gestural']);
    }
    const progress = getTrainingProgress('child_m', ATTENTION_FOCUS_CHAPTER_ID, 'follow-star');
    expect(progress?.independenceRate).toBe(80);
    expect(progress?.masteryLevel).not.toBe('mastered');
  });
});

describe('tracked goal mastery', () => {
  const goal = (sessions: TrackedGoal['sessions']): TrackedGoal => ({
    id: 'g',
    childId: 'child_g',
    criterionId: 'C1',
    domain: 'التواصل الاستجابي والتعبيري',
    title: 'الطلب',
    smartText: 'أن يطلب بكلمة',
    baseline: 0,
    target: 30,
    current: 30,
    startDate: '2026-01-01',
    targetDate: '2026-04-01',
    status: 'active',
    sessions,
  });
  const s = (fullyIndependent: boolean, day: number) => ({
    at: `2026-01-${String(day).padStart(2, '0')}`,
    fullyIndependent,
  });

  it('is not mastered with only one or two independent sessions, even at 100% progress', () => {
    expect(toGoalTrackingItem(goal([s(true, 1)])).status).not.toBe('mastered');
    expect(toGoalTrackingItem(goal([s(true, 1), s(true, 2)])).status).not.toBe('mastered');
  });

  it('is not mastered when a prompted session sits among the last three', () => {
    expect(
      toGoalTrackingItem(goal([s(true, 1), s(false, 2), s(true, 3)])).status
    ).not.toBe('mastered');
  });

  it('is mastered after three consecutive independent sessions', () => {
    expect(toGoalTrackingItem(goal([s(true, 1), s(true, 2), s(true, 3)])).status).toBe(
      'mastered'
    );
  });
});

describe('home classroom session mastery', () => {
  const store = new Map<string, string>();
  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, String(v)),
        removeItem: (k: string) => store.delete(k),
      },
    });
  });
  beforeEach(() => {
    store.clear();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  let day = 1;
  const session = (levels: PromptHierarchyLevel[]) => {
    day += 1;
    jest.setSystemTime(new Date(`2026-03-${String(day).padStart(2, '0')}T10:00:00Z`));
    const trials: TrialResult[] = levels.map((promptLevel, i) => ({
      trialNumber: i + 1,
      promptLevel,
      timestamp: new Date().toISOString(),
    }));
    const summary = evaluateHomeSession('child_h', 'goal_h', trials);
    saveHomeSession(summary);
    return summary;
  };
  const allIndependent: PromptHierarchyLevel[] = Array(5).fill('independent');
  const fourOfFive: PromptHierarchyLevel[] = [
    'independent',
    'independent',
    'independent',
    'independent',
    'verbal',
  ];

  it('never labels a single session as mastered, even at 100%', () => {
    const first = session(allIndependent);
    expect(first.band).not.toBe('mastered');
    expect(first.consecutiveIndependentSessions).toBe(1);
  });

  it('is not mastered after two independent sessions', () => {
    session(allIndependent);
    expect(session(allIndependent).band).not.toBe('mastered');
  });

  it('is mastered on the third consecutive independent session', () => {
    session(allIndependent);
    session(allIndependent);
    const third = session(allIndependent);
    expect(third.consecutiveIndependentSessions).toBe(3);
    expect(third.band).toBe('mastered');
  });

  it('is not mastered when one of the three sessions had a prompt', () => {
    session(allIndependent);
    session(fourOfFive);
    const third = session(allIndependent);
    expect(third.consecutiveIndependentSessions).toBe(1);
    expect(third.band).not.toBe('mastered');
  });

  it('no longer treats 80% independence as mastery', () => {
    for (let i = 0; i < 3; i += 1) {
      expect(session(fourOfFive).band).not.toBe('mastered');
    }
    expect(store.has(HOME_SESSIONS_STORAGE_KEY)).toBe(true);
  });
});

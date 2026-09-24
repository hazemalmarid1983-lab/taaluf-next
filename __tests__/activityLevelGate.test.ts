import {
  applyActivityLevelAttempt,
  initialActivityLevelRecord,
  INDEPENDENT_STREAK_TO_UNLOCK,
  isIndependentSuccess,
  loadStoredActivityLevel,
  readActivityLevel,
} from '../lib/training/activityLevelGate';
import { saveTrainingProgress } from '../lib/training/storage/progressStore';
import {
  createMemoryTrainingStorageAdapter,
  resetTrainingStorageAdapter,
  setTrainingStorageAdapter,
} from '../lib/training/storage/adapter';

describe('activity level gate', () => {
  afterEach(() => {
    resetTrainingStorageAdapter();
  });

  it('keeps level 1 until three consecutive independent successes', () => {
    let state = initialActivityLevelRecord();
    const independent = { correct: true, promptLevel: 'independent' };

    const first = applyActivityLevelAttempt(state, independent);
    const second = applyActivityLevelAttempt(first.record, independent);
    expect(first.advanced).toBe(false);
    expect(second.record.level).toBe(1);
    expect(second.record.independentStreak).toBe(2);
    expect(INDEPENDENT_STREAK_TO_UNLOCK).toBe(3);

    const third = applyActivityLevelAttempt(second.record, independent);
    expect(third.advanced).toBe(true);
    expect(third.record.level).toBe(2);
    expect(third.record.independentStreak).toBe(0);
    state = third.record;
    expect(state.level).toBe(2);
  });

  it('resets the streak when the response is helped or incorrect', () => {
    const warmed = applyActivityLevelAttempt(initialActivityLevelRecord(), {
      correct: true,
      promptLevel: 'independent',
    }).record;
    expect(isIndependentSuccess({ correct: true, promptLevel: 'gestural' })).toBe(false);

    const helped = applyActivityLevelAttempt(warmed, {
      correct: true,
      promptLevel: 'gestural',
    });
    expect(helped.record.level).toBe(1);
    expect(helped.record.independentStreak).toBe(0);

    const missed = applyActivityLevelAttempt(
      { ...warmed, independentStreak: 2 },
      { correct: false, promptLevel: 'independent' }
    );
    expect(missed.record.level).toBe(1);
    expect(missed.record.independentStreak).toBe(0);
  });

  it('does not open a level past the ceiling', () => {
    const top = applyActivityLevelAttempt(
      { level: 6, independentStreak: 2, criterionUnlockApplied: false },
      { correct: true, promptLevel: 'independent' },
      6
    );
    expect(top.advanced).toBe(false);
    expect(top.record.level).toBe(6);
  });

  it('applies a recorded mastered progress marker once', () => {
    setTrainingStorageAdapter(createMemoryTrainingStorageAdapter());
    saveTrainingProgress({
      childId: 'child_1',
      chapterId: 'attention-focus',
      mediaId: 'where-did-it-go',
      completedSessions: 3,
      lastDifficulty: 1,
      masteryLevel: 'mastered',
    });

    const first = loadStoredActivityLevel({
      childId: 'child_1',
      mediaId: 'where-did-it-go',
      chapterId: 'attention-focus',
    });
    expect(first.level).toBe(2);
    expect(first.criterionUnlockApplied).toBe(true);

    const second = loadStoredActivityLevel({
      childId: 'child_1',
      mediaId: 'where-did-it-go',
      chapterId: 'attention-focus',
    });
    expect(second.level).toBe(2);
    expect(readActivityLevel('child_1', 'where-did-it-go').level).toBe(2);
  });
});

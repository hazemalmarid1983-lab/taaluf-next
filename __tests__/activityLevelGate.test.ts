import { saveActivityLevel, readActivityLevel } from '../lib/training/activityLevelGate';
import {
  checkLevelMastery,
  initialActivityLevelRecord,
  INDEPENDENT_SESSIONS_TO_UNLOCK,
  isFullyIndependentSession,
} from '../lib/training/masteryEngine';
import {
  createMemoryTrainingStorageAdapter,
  resetTrainingStorageAdapter,
  setTrainingStorageAdapter,
} from '../lib/training/storage/adapter';

function trials(count: number, promptLevel = 'independent') {
  return Array.from({ length: count }, () => ({ promptLevel }));
}

function sessionWithOne(promptLevel: string, count = 8) {
  const rows = trials(count);
  rows[3] = { promptLevel };
  return rows;
}

describe('global mastery engine', () => {
  afterEach(() => {
    resetTrainingStorageAdapter();
  });

  it('counts a full session only when every trial is fully independent', () => {
    expect(isFullyIndependentSession(trials(5))).toBe(true);
    expect(isFullyIndependentSession(trials(8))).toBe(true);
    expect(isFullyIndependentSession(trials(10))).toBe(true);
    expect(isFullyIndependentSession([])).toBe(false);
    expect(isFullyIndependentSession(sessionWithOne('verbal', 5))).toBe(false);
    expect(isFullyIndependentSession(sessionWithOne('verbal_partial', 8))).toBe(false);
    expect(isFullyIndependentSession(sessionWithOne('full_physical', 10))).toBe(false);
    expect(isFullyIndependentSession(sessionWithOne('partial_physical', 8))).toBe(false);
    expect(isFullyIndependentSession(sessionWithOne('no_response', 5))).toBe(false);
    expect(isFullyIndependentSession(sessionWithOne('gestural', 8))).toBe(false);
  });

  it('promotes only after three consecutive fully independent sessions', () => {
    let state = initialActivityLevelRecord();
    const lengths = [5, 8, 10];

    lengths.forEach((count, index) => {
      const decision = checkLevelMastery(trials(count), state);
      state = decision.record;
      if (index < 2) {
        expect(decision.advanced).toBe(false);
        expect(state.level).toBe(1);
      }
    });

    expect(INDEPENDENT_SESSIONS_TO_UNLOCK).toBe(3);
    expect(state.level).toBe(2);
    expect(state.consecutiveIndependentSessions).toBe(0);
  });

  it('resets the session counter when any trial in the block is not independent', () => {
    const warmed = checkLevelMastery(trials(5), initialActivityLevelRecord()).record;
    const second = checkLevelMastery(trials(8), warmed).record;
    expect(second.consecutiveIndependentSessions).toBe(2);

    const verbal = checkLevelMastery(sessionWithOne('verbal', 10), second);
    expect(verbal.sessionIndependent).toBe(false);
    expect(verbal.record.level).toBe(1);
    expect(verbal.record.consecutiveIndependentSessions).toBe(0);

    const again = checkLevelMastery(
      sessionWithOne('no_response', 5),
      { level: 1, consecutiveIndependentSessions: 2 }
    );
    expect(again.record.consecutiveIndependentSessions).toBe(0);
    expect(again.advanced).toBe(false);
  });

  it('does not open a level past the ceiling', () => {
    const top = checkLevelMastery(trials(8), {
      level: 6,
      consecutiveIndependentSessions: 2,
    });
    expect(top.advanced).toBe(false);
    expect(top.record.level).toBe(6);
  });

  it('keeps the session counter across stored visits', () => {
    setTrainingStorageAdapter(createMemoryTrainingStorageAdapter());
    const afterTwo = checkLevelMastery(trials(5), checkLevelMastery(trials(10)).record);
    saveActivityLevel('child_1', 'where-did-it-go', afterTwo.record);

    const stored = readActivityLevel('child_1', 'where-did-it-go');
    expect(stored.level).toBe(1);
    expect(stored.consecutiveIndependentSessions).toBe(2);

    const third = checkLevelMastery(trials(8), stored);
    expect(third.record.level).toBe(2);
  });
});

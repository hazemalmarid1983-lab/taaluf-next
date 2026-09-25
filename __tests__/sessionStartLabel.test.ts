import {
  ACTION_PRACTICE_COACH_NOTE_AR,
  startSessionLabel,
} from '../lib/training/sessionStartLabel';

describe('start session label', () => {
  it('names the next session number instead of always saying the first', () => {
    expect(startSessionLabel(1)).toBe('ابدأ الجلسة رقم 1');
    expect(startSessionLabel(3)).toBe('ابدأ الجلسة رقم 3');
    expect(startSessionLabel(undefined)).toBe('ابدأ الجلسة');
    expect(startSessionLabel(0)).toBe('ابدأ الجلسة');
  });

  it('tells the parent to practice the action in real life before recording support', () => {
    expect(ACTION_PRACTICE_COACH_NOTE_AR).toContain('تنفيذ الأمر في الواقع');
    expect(ACTION_PRACTICE_COACH_NOTE_AR).toContain('القائمة الجانبية');
  });
});

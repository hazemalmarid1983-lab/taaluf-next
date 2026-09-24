import {
  mergeJourneyRecord,
  upsertJourney,
} from '../lib/childRoom/journeyStore';
import {
  teacherLoginEmail,
  teacherMayAccessRoom,
  type TeacherAccount,
} from '../lib/childRoom/teacherAccounts';

describe('child journey server record', () => {
  it('keeps earlier slices when a later patch only adds the plan', () => {
    const first = mergeJourneyRecord(null, {
      childId: 'child_1',
      planId: 'child_room',
      screening: { childId: 'child_1', result: { overall: 1 } },
      now: '2026-09-24T00:00:00.000Z',
    });
    const next = mergeJourneyRecord(first, {
      childId: 'child_1',
      planId: 'clinical',
      parentAssessment: { childId: 'child_1', mappedScores: [{ criterionId: 'a', score: 1 }] },
      now: '2026-09-24T01:00:00.000Z',
    });
    expect(next.planId).toBe('clinical');
    expect(next.screening).toEqual({ childId: 'child_1', result: { overall: 1 } });
    expect(next.parentAssessments).toHaveLength(1);
    const withPlay = upsertJourney([next], {
      childId: 'child_1',
      childResponse: { childId: 'child_1', gameCode: 'match' },
    });
    expect(withPlay[0].childResponses).toHaveLength(1);
    expect(withPlay[0].planId).toBe('clinical');
  });
});

describe('invite teacher account', () => {
  it('derives a stable login and limits that account to its room', () => {
    expect(teacherLoginEmail('inv_abc')).toBe('teacher.invabc@teachers.taaluf');
    const account: TeacherAccount = {
      id: 'tch_1',
      email: 'teacher.invabc@teachers.taaluf',
      name: 'مدرس',
      passwordHash: '$2b$10$example',
      rooms: [{ childId: 'child_1', childName: 'ليان' }],
    };
    expect(teacherMayAccessRoom(account, 'child_1')).toBe(true);
    expect(teacherMayAccessRoom(account, 'child_2')).toBe(false);
    expect(teacherMayAccessRoom(null, 'child_2')).toBe(true);
    expect(account.passwordHash.startsWith('$2')).toBe(true);
  });
});

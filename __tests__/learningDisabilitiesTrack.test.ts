import { evaluateComprehensiveAssessment } from '@/lib/academicAssessmentEngine';
import { ACADEMIC_FULL_QUESTIONS } from '@/lib/academicFullQuestions';
import { buildIepFromAssessment, iepCompletionRate } from '@/lib/ldIep/engine';
import {
  createResourceRoomSession,
  isSlotAvailable,
  weeklyAttendanceRate,
} from '@/lib/resourceRoom/engine';
import { DEFAULT_RESOURCE_ROOM_SLOTS } from '@/lib/resourceRoom/types';
import {
  TRACK_DEFINITIONS,
  isLearningDisabilitiesTrack,
  isDevelopmentalTrack,
} from '@/lib/tracks/types';
import { isLearningDifficultiesRoute } from '@/lib/featureFlags';

describe('Learning Disabilities track', () => {
  it('defines separate track for Ministry of Education', () => {
    const ld = TRACK_DEFINITIONS.learning_disabilities;
    const dev = TRACK_DEFINITIONS.developmental;
    expect(ld.regulatoryBody).toBe('moe');
    expect(dev.regulatoryBody).toBe('msd');
    expect(ld.hubHref).toBe('/dashboard/ld');
    expect(dev.hubHref).toBe('/dashboard');
  });

  it('identifies track types correctly', () => {
    expect(isLearningDisabilitiesTrack('learning_disabilities')).toBe(true);
    expect(isLearningDisabilitiesTrack('developmental')).toBe(false);
    expect(isDevelopmentalTrack('developmental')).toBe(true);
    expect(isDevelopmentalTrack(undefined)).toBe(true);
  });

  it('includes /dashboard/ld in gated routes', () => {
    expect(isLearningDifficultiesRoute('/dashboard/ld')).toBe(true);
    expect(isLearningDifficultiesRoute('/dashboard/ld/iep')).toBe(true);
    expect(isLearningDifficultiesRoute('/dashboard/screening')).toBe(false);
  });

  it('builds IEP from comprehensive assessment', () => {
    const answers = Object.fromEntries(
      ACADEMIC_FULL_QUESTIONS.map((q) => [
        q.id,
        q.domain === 'dyslexia' ? 3 : 0,
      ])
    );
    const report = evaluateComprehensiveAssessment(answers, 'Test Student');
    const iep = buildIepFromAssessment(report, 'child_test');
    expect(iep.childId).toBe('child_test');
    expect(iep.goals.length).toBeGreaterThan(0);
    expect(iep.schoolIntegration.placement).toBeDefined();
    expect(iepCompletionRate(iep)).toBeGreaterThanOrEqual(0);
  });

  it('schedules resource room sessions with capacity limits', () => {
    const slot = DEFAULT_RESOURCE_ROOM_SLOTS[0];
    const date = '2026-09-10';
    expect(isSlotAvailable(slot, date, [])).toBe(true);

    const session = createResourceRoomSession({
      childId: 'c1',
      childName: 'Student',
      slotId: slot.id,
      scheduledDate: date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      sessionType: slot.sessionType,
      targetDomain: 'dyslexia',
    });
    expect(session.status).toBe('scheduled');

    const full = Array.from({ length: slot.maxStudents }, (_, i) =>
      createResourceRoomSession({
        childId: `c${i}`,
        childName: `S${i}`,
        slotId: slot.id,
        scheduledDate: date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        sessionType: slot.sessionType,
        targetDomain: 'dyslexia',
      })
    );
    expect(isSlotAvailable(slot, date, full)).toBe(false);
  });

  it('computes weekly attendance rate', () => {
    const sessions = [
      createResourceRoomSession({
        childId: 'c1',
        childName: 'S',
        scheduledDate: new Date().toISOString().slice(0, 10),
        startTime: '08:00',
        endTime: '08:45',
        sessionType: 'reading_intervention',
        targetDomain: 'dyslexia',
      }),
    ];
    sessions[0].status = 'completed';
    expect(weeklyAttendanceRate(sessions, 'c1')).toBe(100);
  });
});

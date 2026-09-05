import { aggregateClinicalProgressReport } from '../lib/clinicalReportAggregator';
import type { TrackedGoal } from '../lib/goalsEngine';
import type { HomeSessionSummary } from '../lib/homeClassroomEngine';
import type { SensoryHubSessionMetrics } from '../lib/sensoryHub';

const baseStudent = {
  id: 'child_1',
  name: 'سارة',
  age: 6,
  parentName: 'والدة سارة',
};

const baseGoal: TrackedGoal = {
  id: 'g1',
  childId: 'child_1',
  criterionId: 'c1',
  domain: 'التواصل',
  title: 'تحسين النطق',
  smartText: 'نطق',
  baseline: 20,
  target: 80,
  current: 35,
  startDate: '2026-01-01',
  targetDate: '2026-06-01',
  status: 'active',
  sessions: [],
};

describe('clinical report aggregator', () => {
  it('handles missing assessment and sensory sessions without errors', () => {
    const report = aggregateClinicalProgressReport({
      student: baseStudent,
      goals: [baseGoal],
      assessments: [],
      homeSessions: [],
      sensorySessions: [],
    });

    expect(report.meta.childName).toBe('سارة');
    expect(report.assessment.hasAssessment).toBe(false);
    expect(report.sensoryStats.hasData).toBe(false);
    expect(report.sensoryStats.totalSessions).toBe(0);
    expect(report.promptingSummary.homeSessionCount).toBe(0);
    expect(report.recommendation.id).toBe('assessment');
  });

  it('aggregates assessment baseline, IEP goals, and prompting', () => {
    const homeSessions: HomeSessionSummary[] = [
      {
        childId: 'child_1',
        goalId: 'bank',
        goalTitleAr: 'تحسين النطق — تمرين',
        sessionDate: '2026-09-01T10:00:00.000Z',
        totalTrials: 5,
        independentCount: 4,
        promptedCount: 1,
        noResponseCount: 0,
        masteryPercentage: 80,
        band: 'mastered',
        clinicalNoteAr: '',
        clinicalNoteEn: '',
        recommendedNextStepAr: '',
        recommendedNextStepEn: '',
        moodBefore: 'yellow',
        moodAfter: 'green',
        promptBreakdown: {
          independent: 4,
          gestural: 1,
          verbal: 0,
          partial_physical: 0,
          full_physical: 0,
          no_response: 0,
        },
      },
    ];

    const report = aggregateClinicalProgressReport({
      student: baseStudent,
      goals: [baseGoal],
      assessments: [
        {
          id: 'a1',
          studentId: 'child_1',
          savedAt: '2026-08-01T10:00:00.000Z',
          percentage: 62,
          classification: 'متوسط',
          totalScore: 40,
          maxScore: 65,
          domainAverages: { التواصل: 2.1, الحركة: 1.5 },
          scores: [],
        },
      ],
      homeSessions,
      sensorySessions: [],
    });

    expect(report.assessment.hasAssessment).toBe(true);
    expect(report.assessment.domainBaselines).toHaveLength(2);
    expect(report.iepGoals[0].avgIndependence).toBe(80);
    expect(report.promptingSummary.independentPct).toBe(80);
    expect(report.emotionalStability.improvedSessions).toBe(1);
    expect(report.avgHomeIndependence).toBe(80);
  });

  it('summarizes sensory statistics when sessions exist', () => {
    const sensory: SensoryHubSessionMetrics[] = [
      {
        roomId: 'stars',
        childId: 'child_1',
        durationMs: 90_000,
        interactions: 6,
        calmIndex: 75,
        settings: { volume: 0.4, brightness: 0.7, sensitivity: 0.6 },
        startedAt: '2026-09-01T10:00:00.000Z',
        endedAt: '2026-09-01T10:01:30.000Z',
      },
    ];

    const report = aggregateClinicalProgressReport({
      student: baseStudent,
      goals: [baseGoal],
      assessments: [
        {
          id: 'a1',
          studentId: 'child_1',
          savedAt: '2026-08-01T10:00:00.000Z',
          percentage: 62,
          classification: 'متوسط',
          totalScore: 40,
          maxScore: 65,
          domainAverages: {},
          scores: [],
        },
      ],
      homeSessions: [],
      sensorySessions: sensory,
    });

    expect(report.sensoryStats.hasData).toBe(true);
    expect(report.sensoryStats.totalSessions).toBe(1);
    expect(report.sensoryStats.topRooms[0].roomId).toBe('stars');
  });
});

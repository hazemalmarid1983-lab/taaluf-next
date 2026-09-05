import {
  buildAdaptiveFlowContext,
  deriveClinicalFlowStep,
  getNextRecommendedAction,
  getReadinessPath,
  mapReadinessToMood,
  saveSessionPause,
  loadSessionPause,
  clearSessionPause,
  type ReadinessState,
} from '../lib/adaptiveClinicalFlow';
import type { TrackedGoal } from '../lib/goalsEngine';
import type { HomeSessionSummary } from '../lib/homeClassroomEngine';
import type { SensoryHubSessionMetrics } from '../lib/sensoryHub';

describe('adaptive clinical flow', () => {
  const goals: TrackedGoal[] = [
    {
      id: 'g1',
      childId: 'c1',
      criterionId: 'cr1',
      domain: 'التواصل',
      title: 'تحسين النطق',
      smartText: 'نطق',
      baseline: 20,
      target: 80,
      current: 25,
      startDate: '2026-01-01',
      targetDate: '2026-06-01',
      status: 'active',
      sessions: [],
    },
  ];

  it('maps readiness to regulation zones', () => {
    expect(mapReadinessToMood('calm')).toBe('green');
    expect(mapReadinessToMood('hyperactive')).toBe('yellow');
    expect(mapReadinessToMood('anxious')).toBe('blue');
  });

  it('routes hyperactive and anxious to sensory rooms', () => {
    expect(getReadinessPath('hyperactive').directTrain).toBe(false);
    expect(getReadinessPath('hyperactive').href).toContain('tracing');
    expect(getReadinessPath('anxious').href).toContain('stars');
    expect(getReadinessPath('calm').directTrain).toBe(true);
  });

  it('derives clinical flow steps', () => {
    expect(
      deriveClinicalFlowStep({
        checkInComplete: false,
        scheduleOn: false,
        schedulePassed: false,
        trialsCount: 0,
        hasSummary: false,
      })
    ).toBe('prepare');

    expect(
      deriveClinicalFlowStep({
        checkInComplete: true,
        scheduleOn: false,
        schedulePassed: false,
        trialsCount: 2,
        hasSummary: false,
      })
    ).toBe('train');

    expect(
      deriveClinicalFlowStep({
        checkInComplete: true,
        scheduleOn: false,
        schedulePassed: false,
        trialsCount: 5,
        hasSummary: true,
        moodAfter: null,
      })
    ).toBe('reinforce');
  });

  it('recommends assessment when none exists', () => {
    const noAssessment = getNextRecommendedAction({
      childId: 'c1',
      childName: 'سارة',
      goals,
      hasAssessment: false,
    });
    expect(noAssessment.id).toBe('assessment');
  });

  it('recommends home training when no recent session', () => {
    const action = getNextRecommendedAction({
      childId: 'c1',
      childName: 'سارة',
      goals,
      hasAssessment: true,
      lastHomeSession: null,
    });
    expect(action.id).toBe('home_train');
  });

  it('recommends sensory regulation when calm index is low', () => {
    const sensory: SensoryHubSessionMetrics[] = [
      {
        roomId: 'rain',
        childId: 'c1',
        durationMs: 60_000,
        interactions: 2,
        calmIndex: 30,
        settings: { volume: 0.4, brightness: 0.7, sensitivity: 0.6 },
        startedAt: '2026-09-01T10:00:00.000Z',
        endedAt: '2026-09-01T10:01:00.000Z',
      },
      {
        roomId: 'stars',
        childId: 'c1',
        durationMs: 60_000,
        interactions: 1,
        calmIndex: 35,
        settings: { volume: 0.4, brightness: 0.7, sensitivity: 0.6 },
        startedAt: '2026-09-02T10:00:00.000Z',
        endedAt: '2026-09-02T10:01:00.000Z',
      },
    ];
    const action = getNextRecommendedAction({
      childId: 'c1',
      goals,
      hasAssessment: true,
      lastHomeSession: {
        childId: 'c1',
        goalId: 'g',
        goalTitleAr: 'هدف',
        sessionDate: new Date().toISOString(),
        totalTrials: 5,
        independentCount: 3,
        promptedCount: 2,
        noResponseCount: 0,
        masteryPercentage: 60,
        band: 'emerging',
        clinicalNoteAr: '',
        clinicalNoteEn: '',
        recommendedNextStepAr: '',
        recommendedNextStepEn: '',
      } as HomeSessionSummary,
      sensorySessions: sensory,
    });
    expect(action.id).toBe('sensory_regulation');
  });

  it('persists session pause snapshot', () => {
    const store: Record<string, string> = {};
    // @ts-expect-error test env mock
    global.window = global;
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        getItem: (k: string) => store[k] ?? null,
        removeItem: (k: string) => {
          delete store[k];
        },
      },
      writable: true,
    });

    saveSessionPause({
      childId: 'c1',
      goalId: 'goal1',
      goalTitleAr: 'هدف',
      trials: [],
      moodBefore: 'green',
      scheduleOn: false,
      schedulePassed: true,
      readiness: 'calm',
      savedAt: new Date().toISOString(),
      returnHref: '/dashboard/home-classroom',
      sensoryRoomHref: '/sensory-rooms/stars',
    });
    expect(loadSessionPause()?.childId).toBe('c1');
    clearSessionPause();
    expect(loadSessionPause()).toBeNull();
  });
});

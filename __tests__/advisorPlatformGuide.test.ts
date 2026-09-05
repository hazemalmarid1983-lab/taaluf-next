import {
  advisorGuideProgress,
  emptyAdvisorGuideState,
  isAdvisorGuideComplete,
  nextUnacknowledgedSectionId,
} from '../lib/advisorPlatformGuide';
import { defaultHubTab } from '../lib/nextBestActionFlow';
import { emptyMouState } from '../lib/clinicalHub';

describe('advisor platform guide', () => {
  it('tracks progress across sections', () => {
    const state = emptyAdvisorGuideState();
    expect(advisorGuideProgress(state)).toEqual({
      completed: 0,
      total: 10,
      percent: 0,
    });
    state.sections.welcome = {
      sectionId: 'welcome',
      acknowledged: true,
      acknowledgedAt: '2026-01-01',
      signerName: 'د. سامر',
    };
    expect(advisorGuideProgress(state).completed).toBe(1);
    expect(isAdvisorGuideComplete(state)).toBe(false);
  });

  it('finds next unacknowledged section', () => {
    const state = emptyAdvisorGuideState();
    expect(nextUnacknowledgedSectionId(state)).toBe('welcome');
    state.sections.welcome = {
      sectionId: 'welcome',
      acknowledged: true,
    };
    expect(nextUnacknowledgedSectionId(state)).toBe('nature');
  });

  it('opens guide tab first for advisor with incomplete guide', () => {
    const tab = defaultHubTab({
      mouStatus: 'pending',
      pendingCount: 0,
      actorRole: 'scientific_advisor',
      advisorGuide: emptyAdvisorGuideState(),
    });
    expect(tab).toBe('guide');
  });

  it('opens agreement after guide is complete', () => {
    const guide = emptyAdvisorGuideState();
    for (const id of [
      'welcome',
      'nature',
      'roles',
      'screening',
      'assessment',
      'fusion',
      'goals',
      'sensory',
      'classroom',
      'advisor_workflow',
    ] as const) {
      guide.sections[id] = { sectionId: id, acknowledged: true };
    }
    expect(isAdvisorGuideComplete(guide)).toBe(true);
    const tab = defaultHubTab({
      mouStatus: 'pending',
      pendingCount: 0,
      actorRole: 'scientific_advisor',
      advisorGuide: guide,
    });
    expect(tab).toBe('agreement');
  });
});

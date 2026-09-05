import { emptyMouState, HUB_MEMBERS, mouOverallStatus } from '../lib/clinicalHub';
import {
  defaultHubTab,
  hubFocusFromQuery,
  resolveAdminNextAction,
  resolveHubNextAction,
  resolvePostLoginDestination,
  resolveSpecialistLoginDestination,
  specialistNeedsFirstAssessment,
} from '../lib/nextBestActionFlow';

describe('nextBestActionFlow', () => {
  it('keeps explicit deep-link callback over role home', () => {
    const dest = resolvePostLoginDestination(
      'parent',
      '/dashboard/games',
      undefined
    );
    expect(dest).toBe('/dashboard/games');
  });

  it('falls back to role home when no callback', () => {
    expect(resolvePostLoginDestination('scientific_advisor', null)).toBe('/hub');
    expect(resolvePostLoginDestination('specialist', null)).toBe(
      '/dashboard/assessments/new'
    );
  });

  it('sends specialist without assessments to new assessment flow', () => {
    expect(specialistNeedsFirstAssessment([])).toBe(true);
    expect(specialistNeedsFirstAssessment([{ studentId: 'child_1' }])).toBe(
      false
    );
    expect(resolveSpecialistLoginDestination(null, false)).toBe(
      '/dashboard/assessments/new'
    );
    expect(resolveSpecialistLoginDestination(null, true)).toBe('/dashboard');
    expect(
      resolveSpecialistLoginDestination('/dashboard/games', false)
    ).toBe('/dashboard/games');
  });

  it('sends advisor to MOU when unsigned', () => {
    const mou = emptyMouState();
    const action = resolveHubNextAction({
      actor: {
        memberId: 'samer',
        role: 'scientific_advisor',
        nameAr: HUB_MEMBERS.samer.nameAr,
        nameEn: HUB_MEMBERS.samer.nameEn,
        titleAr: HUB_MEMBERS.samer.titleAr,
        titleEn: HUB_MEMBERS.samer.titleEn,
      },
      mou,
      posts: [],
    });
    expect(action.autoRedirect).toBe(true);
    expect(action.href).toBe('/hub?focus=agreement');
  });

  it('prioritizes pending hub reviews for admin after MOU executed', () => {
    const mou = emptyMouState();
    mou.hazem.signed = true;
    mou.samer.signed = true;
    const action = resolveAdminNextAction({
      mouStatus: mouOverallStatus(mou),
      pendingHubPosts: 2,
    });
    expect(action.href).toBe('/hub?focus=meeting');
    expect(action.titleEn).toContain('2');
  });

  it('defaults hub tab to agreement when MOU is unsigned', () => {
    expect(
      defaultHubTab({
        mouStatus: 'pending',
        pendingCount: 0,
        actorRole: 'scientific_advisor',
      })
    ).toBe('agreement');
  });

  it('opens meeting tab for admin when proposals are pending', () => {
    expect(
      defaultHubTab({
        mouStatus: 'executed',
        pendingCount: 3,
        actorRole: 'admin',
      })
    ).toBe('meeting');
  });

  it('parses hub focus query', () => {
    expect(hubFocusFromQuery('meeting')).toBe('meeting');
    expect(hubFocusFromQuery('invalid')).toBeNull();
  });
});

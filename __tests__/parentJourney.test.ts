import {
  buildParentJourneySteps,
  clearActiveChildSession,
  getReportMetadataByJourney,
  readActiveChild,
  resolveParentNextStep,
  saveActiveChild,
} from '../lib/parentJourney';

const base = {
  consented: true,
  hasChild: true,
  hasScreening: true,
  hasFullAccess: true,
  hasStaffFollowup: false,
  hasParentQ: true,
  hasGames: true,
  hasReport: true,
};

describe('resolveParentNextStep', () => {
  it('asks for consent first', () => {
    const next = resolveParentNextStep({ ...base, consented: false });
    expect(next.href).toBe('/consent');
    expect(next.kind).toBe('onboarding');
  });

  it('asks to register the child next', () => {
    const next = resolveParentNextStep({
      ...base,
      hasChild: false,
      hasScreening: false,
      hasFullAccess: false,
      hasParentQ: false,
      hasGames: false,
      hasReport: false,
    });
    expect(next.href).toBe('/parent/register-child');
  });

  it('offers free screening then paid full path', () => {
    expect(
      resolveParentNextStep({
        ...base,
        hasScreening: false,
        hasFullAccess: false,
        hasParentQ: false,
        hasGames: false,
        hasReport: false,
      }).href
    ).toBe('/dashboard/screening');

    expect(
      resolveParentNextStep({
        ...base,
        hasFullAccess: false,
        hasStaffFollowup: false,
        hasParentQ: false,
        hasGames: false,
        hasReport: false,
      }).href
    ).toBe('/parent/pay-assessment');

    expect(
      resolveParentNextStep({
        ...base,
        hasFullAccess: false,
        hasStaffFollowup: true,
        hasParentQ: false,
        hasGames: false,
        hasReport: false,
      }).href
    ).toBe('/parent/follow-up');

    expect(
      resolveParentNextStep({
        ...base,
        hasParentQ: false,
        hasGames: false,
        hasReport: false,
      }).href
    ).toBe('/dashboard/parent-assessment');

    expect(
      resolveParentNextStep({
        ...base,
        hasGames: false,
        hasReport: false,
      }).href
    ).toBe('/dashboard/games');

    expect(
      resolveParentNextStep({
        ...base,
        hasReport: false,
      }).href
    ).toBe('/parent/assessment');

    expect(resolveParentNextStep(base).href).toBe(
      '/parent/assessment?view=results'
    );
    expect(resolveParentNextStep(base).cta).toBe('اطلع على التقرير');
    expect(
      resolveParentNextStep({
        ...base,
        hasFullAccess: false,
        hasStaffFollowup: false,
        hasParentQ: false,
        hasGames: false,
        hasReport: false,
      }).cta
    ).toBe('عرض الخيارات');
  });
});

describe('adaptive parent journey', () => {
  it('lets an independent family skip specialist 40 items after survey + games', () => {
    const next = resolveParentNextStep({
      ...base,
      selectedMode: 'independent_parent',
      hasReport: false,
    });
    expect(next.href).toBe('/parent/assessment?view=results');
    expect(next.kind).toBe('done');
    expect(next.title).toMatch(/أسري/);
  });

  it('keeps games optional on the independent path', () => {
    const next = resolveParentNextStep({
      ...base,
      selectedMode: 'independent_parent',
      hasGames: false,
      gamesSkipped: false,
      hasReport: false,
    });
    expect(next.href).toBe('/dashboard/games');
    expect(next.body).toMatch(/اختياري/);

    const skipped = resolveParentNextStep({
      ...base,
      selectedMode: 'independent_parent',
      hasGames: false,
      gamesSkipped: true,
      hasReport: false,
    });
    expect(skipped.href).toBe('/parent/assessment?view=results');
  });

  it('builds mode-specific steps and report metadata', () => {
    const family = buildParentJourneySteps('independent_parent');
    expect(family.some((s) => s.id === 'specialist_session')).toBe(false);
    expect(family.find((s) => s.id === 'interactive_games')?.isRequired).toBe(
      false
    );

    const guided = buildParentJourneySteps('specialist_guided');
    expect(guided.some((s) => s.id === 'specialist_session')).toBe(true);
    expect(guided.find((s) => s.id === 'interactive_games')?.isRequired).toBe(
      true
    );

    expect(getReportMetadataByJourney('independent_parent').fusionMode).toBe(
      'family'
    );
    expect(getReportMetadataByJourney('specialist_guided').fusionMode).toBe(
      'comprehensive'
    );
  });
});

describe('active child session', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    Object.defineProperty(global, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => memory.get(k) ?? null,
        setItem: (k: string, v: string) => memory.set(k, String(v)),
        removeItem: (k: string) => memory.delete(k),
      },
    });
  });

  it('reads the Gemini alias key and clears it when starting another child', () => {
    localStorage.setItem(
      'taaluf_current_child',
      JSON.stringify({ id: 'child_9', name: 'سارة', age: 6 })
    );
    localStorage.setItem('taaluf.screening.v1', '{"result":true}');
    expect(readActiveChild()?.name).toBe('سارة');

    saveActiveChild({ id: 'child_9', name: 'سارة', age: 6 });
    clearActiveChildSession();
    expect(readActiveChild()).toBeNull();
    expect(localStorage.getItem('taaluf.activeStudent')).toBeNull();
    expect(localStorage.getItem('taaluf_current_child')).toBeNull();
    expect(localStorage.getItem('taaluf.screening.v1')).toBeNull();
  });
});

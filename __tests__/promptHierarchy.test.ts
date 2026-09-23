import {
  buildPromptFadingCue,
  compareIndependence,
  countPromptBreakdown,
  independencePercentage,
  noResponseCount,
  normalizePromptLevel,
  promptedCount,
  summarizePromptLevels,
} from '../lib/promptHierarchy';

describe('prompt hierarchy', () => {
  it('counts a trial as independent only when that level was recorded', () => {
    const trials = [
      { promptLevel: 'verbal' as const },
      { promptLevel: 'partial_physical' as const },
      { promptLevel: 'no_response' as const },
      { promptLevel: 'verbal' as const },
      { promptLevel: 'independent' as const },
    ];
    expect(independencePercentage(trials)).toBe(20);
    expect(promptedCount(trials)).toBe(3);
    expect(noResponseCount(trials)).toBe(1);
    expect(
      independencePercentage(
        trials.map(() => ({ promptLevel: 'verbal' as const }))
      )
    ).toBe(0);
  });

  it('normalizes legacy prompt levels', () => {
    expect(normalizePromptLevel('verbal_gestural')).toBe('gestural');
    expect(normalizePromptLevel('physical_prompt')).toBe('full_physical');
    expect(normalizePromptLevel('independent')).toBe('independent');
  });

  it('counts breakdown across five hierarchy levels', () => {
    const breakdown = countPromptBreakdown([
      { promptLevel: 'independent' },
      { promptLevel: 'independent' },
      { promptLevel: 'independent' },
      { promptLevel: 'gestural' },
      { promptLevel: 'gestural' },
    ]);
    expect(breakdown.independent).toBe(3);
    expect(breakdown.gestural).toBe(2);
    expect(
      independencePercentage([
        { promptLevel: 'independent' },
        { promptLevel: 'independent' },
        { promptLevel: 'independent' },
        { promptLevel: 'gestural' },
        { promptLevel: 'gestural' },
      ])
    ).toBe(60);
  });

  it('summarizes trials in Arabic prose', () => {
    const text = summarizePromptLevels(
      countPromptBreakdown([
        { promptLevel: 'independent' },
        { promptLevel: 'independent' },
        { promptLevel: 'independent' },
        { promptLevel: 'gestural' },
        { promptLevel: 'gestural' },
      ]),
      true
    );
    expect(text).toContain('3 مستقلة');
    expect(text).toContain('2 بمساعدة إيمائية');
  });

  it('compares independence to a previous session', () => {
    const current = [
      { promptLevel: 'independent' },
      { promptLevel: 'independent' },
      { promptLevel: 'independent' },
      { promptLevel: 'independent' },
      { promptLevel: 'gestural' },
    ];
    const previous = [
      { promptLevel: 'independent' },
      { promptLevel: 'independent' },
      { promptLevel: 'gestural' },
      { promptLevel: 'gestural' },
      { promptLevel: 'gestural' },
    ];
    const comparison = compareIndependence(current, previous);
    expect(comparison.direction).toBe('improved');
    expect(comparison.delta).toBe(40);
  });

  it('builds a fading cue when physical prompts dominate', () => {
    const cue = buildPromptFadingCue(
      countPromptBreakdown([
        { promptLevel: 'full_physical' },
        { promptLevel: 'full_physical' },
        { promptLevel: 'partial_physical' },
        { promptLevel: 'independent' },
        { promptLevel: 'no_response' },
      ]),
      compareIndependence([{ promptLevel: 'independent' }], null)
    );
    expect(cue.cueAr).toContain('جسدية');
  });
});

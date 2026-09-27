import type { TrackedGoal } from '../lib/goalsEngine';
import { buildGeneralizationProbe, PROBE_PROMPT_LABELS_AR } from '../lib/generalizationProbeStore';
import { buildGoalSessionFromForm } from '../lib/goalSessionForm';
import { PROMPT_HIERARCHY_ORDER } from '../lib/promptHierarchy';
import {
  CLINICAL_PROMPT_BY_HIERARCHY,
  CLINICAL_PROMPT_LEVELS,
  goalSessionToMasteryRecord,
  mostIntrusivePromptLevel,
  toClinicalPromptLevel,
} from '../lib/skillMastery';

const goal: TrackedGoal = {
  id: 'g',
  childId: 'c',
  criterionId: 'C3',
  domain: 'x',
  developmentalDomain: 'receptive_language',
  title: 't',
  smartText: 's',
  baseline: 0,
  target: 100,
  current: 0,
  startDate: '2026-01-01',
  targetDate: '2026-04-01',
  status: 'active',
  sessions: [],
};

describe('8-level prompt alignment', () => {
  it('maps every session hierarchy level to the clinical scale in the same order', () => {
    expect(PROMPT_HIERARCHY_ORDER.map((l) => CLINICAL_PROMPT_BY_HIERARCHY[l])).toEqual([
      ...CLINICAL_PROMPT_LEVELS,
    ]);
    expect(CLINICAL_PROMPT_LEVELS).toHaveLength(8);
    expect(CLINICAL_PROMPT_LEVELS).toEqual(expect.arrayContaining(['Model', 'Partial Verbal']));
  });

  it('normalizes hierarchy ids, legacy and digital assistance levels', () => {
    expect(toClinicalPromptLevel('model')).toBe('Model');
    expect(toClinicalPromptLevel('verbal_partial')).toBe('Partial Verbal');
    expect(toClinicalPromptLevel('Partial Verbal')).toBe('Partial Verbal');
    expect(toClinicalPromptLevel('physical_prompt')).toBe('Full Physical');
    expect(toClinicalPromptLevel('direct_visual_assistance')).toBe('Model');
    expect(toClinicalPromptLevel('unknown')).toBeUndefined();
  });

  it('picks the most intrusive prompt used in a session', () => {
    expect(mostIntrusivePromptLevel(['independent', 'model', 'verbal'])).toBe('Model');
    expect(mostIntrusivePromptLevel(['independent', 'independent'])).toBe('Independent');
    expect(mostIntrusivePromptLevel([])).toBeUndefined();
  });

  it('carries the session prompt level into the mastery record', () => {
    const built = buildGoalSessionFromForm(goal, {
      independencePct: 70,
      promptLevel: 'Model',
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.session.promptLevel).toBe('Model');
    expect(goalSessionToMasteryRecord('g', built.session, 0).prompt_level).toBe('Model');
  });

  it('defaults 100% sessions to Independent and rejects contradictions', () => {
    const full = buildGoalSessionFromForm(goal, { independencePct: 100 });
    expect(full.ok && full.session.promptLevel).toBe('Independent');
    for (const input of [
      { independencePct: 100, promptLevel: 'Gestural' as const },
      { independencePct: 80, promptLevel: 'Independent' as const },
    ]) {
      const result = buildGoalSessionFromForm(goal, input);
      expect(result).toEqual({ ok: false, errors: ['PROMPT_LEVEL_CONFLICT'] });
    }
  });

  it('accepts all 8 levels in generalization probes', () => {
    expect(Object.keys(PROBE_PROMPT_LABELS_AR)).toEqual([...CLINICAL_PROMPT_LEVELS]);
    const result = buildGeneralizationProbe(
      { dimension: 'place', setting: 'home', independencePct: 60, promptLevel: 'Partial Verbal' },
      { goalId: 'g', reportedBy: 'professional', now: new Date('2026-02-01T00:00:00Z') }
    );
    expect(result.ok && result.probe.prompt_level).toBe('Partial Verbal');
  });
});

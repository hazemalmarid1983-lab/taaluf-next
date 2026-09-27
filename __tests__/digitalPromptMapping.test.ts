import { sanitizeGoalSession } from '../lib/clinicalGoalActions';
import type { TrackedGoal } from '../lib/goalsEngine';
import { buildGoalSessionFromForm } from '../lib/goalSessionForm';
import {
  DIGITAL_PROMPT_MAPPING_SUMMARY_AR,
  digitalPromptMappingLabelAr,
  isDigitalAssistanceCue,
  resolveSessionPromptEvidence,
  sessionPromptLabelAr,
  toClinicalPromptLevel,
} from '../lib/skillMastery';
import { TRAINING_DIGITAL_PROMPT_LEVELS } from '../lib/training/engine/promptLevels';
import {
  promptLevelLabelAr,
  summarizeDigitalPromptMapping,
} from '../lib/training/trainingResultsPresentation';
import {
  DIGITAL_ASSISTANCE_CUES,
  DIGITAL_PROMPT_MAPPING,
  DIGITAL_PROMPT_MAPPING_STATUS,
} from '../types/clinical';

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

describe('digital prompt mapping config', () => {
  it('maps visual hint and reduced choices to Gestural, direct visual guidance to Model', () => {
    expect(
      Object.fromEntries(DIGITAL_ASSISTANCE_CUES.map((c) => [c, DIGITAL_PROMPT_MAPPING[c].clinical_level]))
    ).toEqual({
      visual_hint: 'Gestural',
      reduced_choices: 'Gestural',
      direct_visual_assistance: 'Model',
    });
    for (const cue of DIGITAL_ASSISTANCE_CUES) {
      expect(toClinicalPromptLevel(cue)).toBe(DIGITAL_PROMPT_MAPPING[cue].clinical_level);
    }
  });

  it('covers every assistance level the digital engines assign', () => {
    const engineCues = TRAINING_DIGITAL_PROMPT_LEVELS.filter((l) => l !== 'independent' && l !== 'no_response');
    expect(engineCues).toEqual([...DIGITAL_ASSISTANCE_CUES]);
    expect(isDigitalAssistanceCue('gestural')).toBe(false);
    expect(isDigitalAssistanceCue('toString')).toBe(false);
  });

  it('stays flagged for scientific sign-off', () => {
    expect(DIGITAL_PROMPT_MAPPING_STATUS).toBe('pending_scientific_signoff');
  });

  it('labels each cue with its mapped clinical level', () => {
    expect(digitalPromptMappingLabelAr('visual_hint')).toBe('تلميح بصري (رقمي) ← تلقين بالإشارة');
    expect(digitalPromptMappingLabelAr('direct_visual_assistance')).toBe('مساعدة بصرية مباشرة (رقمي) ← نموذج');
    expect(promptLevelLabelAr('reduced_choices')).toBe('تقليل الخيارات (رقمي) ← تلقين بالإشارة');
    expect(DIGITAL_PROMPT_MAPPING_SUMMARY_AR.split(' · ')).toHaveLength(3);
  });
});

describe('session prompt evidence', () => {
  it('records a digital source when only a digital cue reached the top level', () => {
    expect(resolveSessionPromptEvidence(['independent', 'visual_hint', 'direct_visual_assistance'])).toEqual({
      promptLevel: 'Model',
      promptSource: 'digital_assistance',
      digitalPromptCue: 'direct_visual_assistance',
    });
    expect(resolveSessionPromptEvidence(['visual_hint', 'reduced_choices'])).toEqual({
      promptLevel: 'Gestural',
      promptSource: 'digital_assistance',
      digitalPromptCue: 'reduced_choices',
    });
  });

  it('records a human source when a human prompt reached the same or a higher level', () => {
    expect(resolveSessionPromptEvidence(['visual_hint', 'gestural'])).toEqual({
      promptLevel: 'Gestural',
      promptSource: 'human',
    });
    expect(resolveSessionPromptEvidence(['direct_visual_assistance', 'partial_physical'])).toEqual({
      promptLevel: 'Partial Physical',
      promptSource: 'human',
    });
  });

  it('has no source for independent or no-response sessions', () => {
    expect(resolveSessionPromptEvidence(['independent'])).toEqual({ promptLevel: 'Independent' });
    expect(resolveSessionPromptEvidence(['visual_hint', 'no_response'])).toEqual({ promptLevel: 'No Response' });
    expect(resolveSessionPromptEvidence([])).toEqual({ promptLevel: undefined });
  });

  it('labels the recorded level with its digital origin', () => {
    expect(
      sessionPromptLabelAr({ promptLevel: 'Gestural', promptSource: 'digital_assistance', digitalPromptCue: 'visual_hint' })
    ).toBe('تلقين بالإشارة — مطابَق من مساعدة رقمية: تلميح بصري');
    expect(sessionPromptLabelAr({ promptLevel: 'Model', promptSource: 'human' })).toBe('نموذج');
    expect(sessionPromptLabelAr({})).toBeUndefined();
  });

  it('summarizes the cues a game session used for the observer panel', () => {
    const summary = summarizeDigitalPromptMapping([
      { promptLevel: 'independent' },
      { promptLevel: 'visual_hint' },
      { promptLevel: 'visual_hint' },
      { promptLevel: 'direct_visual_assistance' },
    ]);
    expect(summary.rows.map((r) => [r.cue, r.clinicalLevel, r.count])).toEqual([
      ['visual_hint', 'Gestural', 2],
      ['direct_visual_assistance', 'Model', 1],
    ]);
    expect(summary.promptSource).toBe('digital_assistance');
    expect(summary.sessionPromptLabelAr).toContain('مساعدة بصرية مباشرة');
    expect(summary.pendingSignoff).toBe(true);
  });
});

describe('recording the mapping', () => {
  it('derives the level from the digital cue in the session form', () => {
    const built = buildGoalSessionFromForm(goal, { independencePct: 60, digitalPromptCue: 'reduced_choices' });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.session).toMatchObject({
      promptLevel: 'Gestural',
      promptSource: 'digital_assistance',
      digitalPromptCue: 'reduced_choices',
    });
  });

  it('rejects a level that contradicts the digital mapping', () => {
    expect(
      buildGoalSessionFromForm(goal, { independencePct: 60, digitalPromptCue: 'direct_visual_assistance', promptLevel: 'Gestural' })
    ).toEqual({ ok: false, errors: ['DIGITAL_PROMPT_MAPPING_CONFLICT'] });
    expect(
      buildGoalSessionFromForm(goal, { independencePct: 100, digitalPromptCue: 'visual_hint' })
    ).toEqual({ ok: false, errors: ['PROMPT_LEVEL_CONFLICT'] });
  });

  it('marks manually entered prompts as human', () => {
    const built = buildGoalSessionFromForm(goal, { independencePct: 60, promptLevel: 'Model' });
    expect(built.ok && built.session.promptSource).toBe('human');
    expect(built.ok && built.session.digitalPromptCue).toBeUndefined();
  });

  it('re-derives the level from the cue on the server and ignores unknown cues', () => {
    const at = '2026-02-01T10:00:00.000Z';
    expect(
      sanitizeGoalSession({ at, independencePct: 50, promptLevel: 'Independent', digitalPromptCue: 'direct_visual_assistance' })
    ).toMatchObject({ promptLevel: 'Model', promptSource: 'digital_assistance', digitalPromptCue: 'direct_visual_assistance' });
    const spoofed = sanitizeGoalSession({ at, promptLevel: 'Verbal', promptSource: 'digital_assistance', digitalPromptCue: 'magic' });
    expect(spoofed).toMatchObject({ promptLevel: 'Verbal' });
    expect(spoofed).not.toHaveProperty('promptSource');
    expect(spoofed).not.toHaveProperty('digitalPromptCue');
    expect(sanitizeGoalSession({ at, promptLevel: 'Verbal', promptSource: 'human' })).toMatchObject({ promptSource: 'human' });
  });
});

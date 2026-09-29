import { sanitizeGoalSession } from '../lib/clinicalGoalActions';
import type { TrackedGoal } from '../lib/goalsEngine';
import { buildGoalSessionFromForm } from '../lib/goalSessionForm';
import {
  DEFAULT_SKILL_TYPE_CONFIGS,
  DIGITAL_STIMULUS_SUPPORT_SUMMARY_AR,
  digitalStimulusSupportLabelAr,
  evaluateGoalMastery,
  evaluateSkillMastery,
  goalSessionToMasteryRecord,
  isDigitalAssistanceCue,
  isValidIndependentTrial,
  resolveSessionPromptEvidence,
  sessionPromptLabelAr,
  sessionQualifies,
  stimulusArrayLevelOf,
  toClinicalPromptLevel,
  trialResponsePromptLevel,
  trialStimulusSupport,
  type MasterySessionRecord,
} from '../lib/skillMastery';
import { TRAINING_DIGITAL_PROMPT_LEVELS } from '../lib/training/engine/promptLevels';
import {
  promptLevelLabelAr,
  summarizeStimulusSupport,
} from '../lib/training/trainingResultsPresentation';
import {
  DIGITAL_ASSISTANCE_CUES,
  DIGITAL_STIMULUS_SUPPORT,
  STIMULUS_ARRAY_LABELS_AR,
  STIMULUS_SUPPORT_STATUS,
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

describe('stimulus array support is a separate dimension from response prompts', () => {
  it('classifies each digital cue on the stimulus array scale', () => {
    expect(
      Object.fromEntries(
        DIGITAL_ASSISTANCE_CUES.map((c) => [c, [DIGITAL_STIMULUS_SUPPORT[c].array_level, DIGITAL_STIMULUS_SUPPORT[c].target_highlighted]])
      )
    ).toEqual({
      visual_hint: ['full_array', true],
      reduced_choices: ['partially_reduced', false],
      direct_visual_assistance: ['highly_reduced', true],
    });
    expect(STIMULUS_ARRAY_LABELS_AR).toEqual({
      full_array: 'كاملة',
      partially_reduced: 'مخفّضة جزئياً',
      highly_reduced: 'مخفّضة بشدة',
    });
  });

  it('never maps a digital cue to Gestural, Model or any response prompt level', () => {
    for (const cue of DIGITAL_ASSISTANCE_CUES) {
      expect(toClinicalPromptLevel(cue)).toBeUndefined();
      expect(trialResponsePromptLevel(cue)).toBe('Independent');
      expect(trialStimulusSupport(cue)).toBe(cue);
      expect(isValidIndependentTrial(trialResponsePromptLevel(cue), trialStimulusSupport(cue))).toBe(false);
    }
    expect(isValidIndependentTrial('Independent', undefined)).toBe(true);
    expect(stimulusArrayLevelOf(undefined)).toBe('full_array');
  });

  it('covers every assistance level the digital engines assign', () => {
    const engineCues = TRAINING_DIGITAL_PROMPT_LEVELS.filter((l) => l !== 'independent' && l !== 'no_response');
    expect(engineCues).toEqual([...DIGITAL_ASSISTANCE_CUES]);
    expect(isDigitalAssistanceCue('gestural')).toBe(false);
    expect(isDigitalAssistanceCue('toString')).toBe(false);
  });

  it('stays flagged for scientific sign-off of the array-level classification', () => {
    expect(STIMULUS_SUPPORT_STATUS).toBe('pending_scientific_signoff');
  });

  it('labels cues on the stimulus dimension, not the prompt hierarchy', () => {
    expect(digitalStimulusSupportLabelAr('reduced_choices')).toBe(
      'تقليل الخيارات (رقمي) ← مصفوفة المثيرات: مخفّضة جزئياً'
    );
    expect(digitalStimulusSupportLabelAr('direct_visual_assistance')).toBe(
      'مساعدة بصرية مباشرة (رقمي) ← مصفوفة المثيرات: مخفّضة بشدة مع إبراز الهدف'
    );
    expect(promptLevelLabelAr('visual_hint')).toBe('تلميح بصري (رقمي) ← مصفوفة المثيرات: كاملة مع إبراز الهدف');
    expect(DIGITAL_STIMULUS_SUPPORT_SUMMARY_AR).not.toMatch(/إشارة|نموذج/);
    expect(DIGITAL_STIMULUS_SUPPORT_SUMMARY_AR.split(' · ')).toHaveLength(3);
  });
});

describe('session evidence on both dimensions', () => {
  it('records digital-only sessions as independent responses with stimulus support', () => {
    expect(resolveSessionPromptEvidence(['independent', 'visual_hint', 'direct_visual_assistance'])).toEqual({
      promptLevel: 'Independent',
      stimulusSupport: 'direct_visual_assistance',
    });
  });

  it('keeps the human prompt and the stimulus support independent of each other', () => {
    expect(resolveSessionPromptEvidence(['reduced_choices', 'gestural'])).toEqual({
      promptLevel: 'Gestural',
      stimulusSupport: 'reduced_choices',
    });
    expect(resolveSessionPromptEvidence(['direct_visual_assistance', 'verbal'])).toEqual({
      promptLevel: 'Verbal',
      stimulusSupport: 'direct_visual_assistance',
    });
    expect(resolveSessionPromptEvidence(['independent', 'model'])).toEqual({ promptLevel: 'Model' });
  });

  it('handles independent, no-response and empty sessions', () => {
    expect(resolveSessionPromptEvidence(['independent'])).toEqual({ promptLevel: 'Independent' });
    expect(resolveSessionPromptEvidence(['visual_hint', 'no_response'])).toEqual({
      promptLevel: 'No Response',
      stimulusSupport: 'visual_hint',
    });
    expect(resolveSessionPromptEvidence([])).toEqual({ promptLevel: undefined });
  });

  it('labels a session with both dimensions', () => {
    expect(sessionPromptLabelAr({ promptLevel: 'Independent', stimulusSupport: 'reduced_choices' })).toBe(
      'مستقل · مصفوفة المثيرات: مخفّضة جزئياً (تقليل الخيارات)'
    );
    expect(sessionPromptLabelAr({ promptLevel: 'Model' })).toBe('نموذج');
    expect(sessionPromptLabelAr({})).toBeUndefined();
  });

  it('summarizes a game session for the observer panel', () => {
    const summary = summarizeStimulusSupport([
      { promptLevel: 'independent' },
      { promptLevel: 'visual_hint' },
      { promptLevel: 'reduced_choices' },
      { promptLevel: 'direct_visual_assistance' },
    ]);
    expect(summary.rows.map((r) => [r.cue, r.arrayLevel, r.count])).toEqual([
      ['visual_hint', 'full_array', 1],
      ['reduced_choices', 'partially_reduced', 1],
      ['direct_visual_assistance', 'highly_reduced', 1],
    ]);
    expect(summary.responsePromptLabelAr).toBe('مستقل');
    expect(summary.stimulusSupportLabelAr).toBe('مصفوفة المثيرات: مخفّضة بشدة مع إبراز الهدف');
    expect(summary.validIndependentTrials).toBe(1);
    expect(summary.stimulusSupportedTrials).toBe(3);
    expect(summary.pendingSignoff).toBe(true);
  });
});

describe('cold probe mastery requires 100% response independence AND a full unmodified array', () => {
  const { closed_cognitive, social } = DEFAULT_SKILL_TYPE_CONFIGS;
  const rec = (day: number, extra: Partial<MasterySessionRecord> = {}): MasterySessionRecord => ({
    session_id: `s${day}`,
    goal_id: 'g',
    date: `2026-02-0${day}T10:00:00Z`,
    independence_pct: 100,
    prompt_level: 'Independent',
    first_trial_independent: true,
    ...extra,
  });

  it('rejects a 100% independent session that used any stimulus modification', () => {
    for (const cue of DIGITAL_ASSISTANCE_CUES) {
      expect(sessionQualifies(closed_cognitive, rec(1, { stimulus_support: cue }))).toBe(false);
    }
    expect(sessionQualifies(closed_cognitive, rec(1))).toBe(true);
  });

  it('breaks the 3-session run when one session used a reduced array', () => {
    const result = evaluateSkillMastery(closed_cognitive, [
      rec(1),
      rec(2, { stimulus_support: 'reduced_choices' }),
      rec(3),
    ]);
    expect(result.mastered).toBe(false);
    expect(result.qualifying_streak).toBe(1);
    expect(evaluateSkillMastery(closed_cognitive, [rec(1), rec(2), rec(3)]).mastered).toBe(true);
  });

  it('still requires an unmodified cold-probe first trial for 80% skill types', () => {
    const ok = rec(1, { independence_pct: 80, prompt_level: 'Verbal', stimulus_support: 'reduced_choices' });
    expect(sessionQualifies(social, ok)).toBe(true);
    expect(sessionQualifies(social, { ...ok, first_trial_independent: false })).toBe(false);
  });
});

describe('recording both dimensions in the session form', () => {
  it('logs stimulus support separately and keeps the human prompt level as entered', () => {
    const built = buildGoalSessionFromForm(goal, {
      independencePct: 60,
      promptLevel: 'Verbal',
      stimulusSupport: 'reduced_choices',
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.session).toMatchObject({ promptLevel: 'Verbal', stimulusSupport: 'reduced_choices' });
    expect(built.session).not.toHaveProperty('promptSource');
  });

  it('rejects a digital cue entered as a response prompt level', () => {
    expect(
      buildGoalSessionFromForm(goal, { independencePct: 60, promptLevel: 'reduced_choices' as never })
    ).toEqual({ ok: false, errors: ['STIMULUS_SUPPORT_NOT_A_RESPONSE_PROMPT'] });
    expect(
      buildGoalSessionFromForm(goal, { trialScores: ['independent', 'visual_hint'] })
    ).toEqual({ ok: false, errors: ['STIMULUS_SUPPORT_NOT_A_RESPONSE_PROMPT'] });
  });

  it('rejects 100% independence with a modified stimulus array', () => {
    expect(
      buildGoalSessionFromForm(goal, { independencePct: 100, stimulusSupport: 'visual_hint' })
    ).toEqual({ ok: false, errors: ['STIMULUS_SUPPORT_CONFLICT'] });
  });

  it('accepts independent responses on a reduced array below 100%', () => {
    const built = buildGoalSessionFromForm(goal, {
      independencePct: 40,
      promptLevel: 'Independent',
      stimulusSupport: 'direct_visual_assistance',
    });
    expect(built.ok).toBe(true);
  });

  it('excludes stimulus-supported trials from independence and the cold probe', () => {
    const built = buildGoalSessionFromForm(goal, {
      trialScores: ['Independent', 'Independent', 'Independent', 'Independent'],
      trialStimulus: ['reduced_choices', null, null, null],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.session).toMatchObject({
      independencePct: 75,
      fullyIndependent: false,
      promptLevel: 'Independent',
      stimulusSupport: 'reduced_choices',
      firstTrialIndependent: false,
    });
  });

  it('validates per-trial stimulus length and values', () => {
    expect(
      buildGoalSessionFromForm(goal, { trialScores: ['Independent', 'Verbal'], trialStimulus: ['reduced_choices'] })
    ).toEqual({ ok: false, errors: ['INVALID_TRIAL_STIMULUS'] });
    expect(
      buildGoalSessionFromForm(goal, { trialScores: ['Independent'], trialStimulus: ['gestural'] })
    ).toEqual({ ok: false, errors: ['INVALID_TRIAL_STIMULUS'] });
  });

  it('blocks mastery for three 100% sessions when one was stimulus-supported', () => {
    const sessions = [1, 2, 3].map((day) => ({
      at: `2026-02-0${day}T10:00:00Z`,
      independencePct: 100,
      fullyIndependent: true,
      promptLevel: 'Independent' as const,
      firstTrialIndependent: true,
      ...(day === 2 ? { stimulusSupport: 'visual_hint' as const } : {}),
    }));
    expect(evaluateGoalMastery({ ...goal, sessions }).mastered).toBe(false);
  });
});

describe('physical observation goals: human prompts only, no stimulus array', () => {
  const beadGoal: TrackedGoal = {
    ...goal,
    id: 'beads',
    developmentalDomain: 'fine_motor',
    title: 'لضم الخرز',
    smartText: 'أن يلضم الطفل 5 خرزات في خيط',
  };

  it('keeps physical prompt levels on the response dimension with no stimulus support', () => {
    for (const level of ['gestural', 'model', 'partial_physical', 'full_physical'] as const) {
      expect(trialStimulusSupport(level)).toBeUndefined();
      expect(isValidIndependentTrial(trialResponsePromptLevel(level), trialStimulusSupport(level))).toBe(false);
    }
    expect(trialResponsePromptLevel('partial_physical')).toBe('Partial Physical');
    expect(resolveSessionPromptEvidence(['independent', 'partial_physical', 'full_physical'])).toEqual({
      promptLevel: 'Full Physical',
    });
  });

  it('records a live motor session from per-trial human prompts', () => {
    const built = buildGoalSessionFromForm(beadGoal, {
      trialScores: ['Independent', 'Partial Physical', 'Independent', 'Full Physical'],
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.session).toMatchObject({
      independencePct: 50,
      fullyIndependent: false,
      promptLevel: 'Full Physical',
      firstTrialIndependent: true,
    });
    expect(built.session.stimulusSupport).toBeUndefined();
  });

  it('sanitizes a physical session without inventing a stimulus dimension', () => {
    const at = '2026-02-01T10:00:00.000Z';
    const clean = sanitizeGoalSession({
      at,
      independencePct: 25,
      promptLevel: 'Full Physical',
      trialScores: ['Full Physical', 'Partial Physical', 'Independent', 'Model'],
    });
    expect(clean).toMatchObject({ promptLevel: 'Full Physical' });
    expect(clean).not.toHaveProperty('stimulusSupport');
    expect(clean).not.toHaveProperty('trialStimulus');
  });

  it('masters a fine motor goal only after three independent sessions on real materials', () => {
    const sessions = [1, 2, 3].map((day) => ({
      at: `2026-02-0${day}T10:00:00Z`,
      independencePct: 100,
      fullyIndependent: true,
      promptLevel: 'Independent' as const,
      firstTrialIndependent: true,
    }));
    expect(evaluateGoalMastery({ ...beadGoal, sessions }).mastered).toBe(true);
    const prompted = sessions.map((s, i) =>
      i === 1 ? { ...s, independencePct: 75, fullyIndependent: false, promptLevel: 'Partial Physical' as const } : s
    );
    expect(evaluateGoalMastery({ ...beadGoal, sessions: prompted }).mastered).toBe(false);
  });
});

describe('a trial is independent only with an Independent prompt AND a full array', () => {
  it('does not treat a legacy fullyIndependent flag as independent when the array was modified', () => {
    const record = goalSessionToMasteryRecord(
      'g',
      { at: '2026-02-01T10:00:00Z', fullyIndependent: true, stimulusSupport: 'reduced_choices' },
      0
    );
    expect(record).toMatchObject({
      independence_pct: 0,
      prompt_level: 'Verbal',
      first_trial_independent: false,
      stimulus_support: 'reduced_choices',
    });
    expect(sessionQualifies(DEFAULT_SKILL_TYPE_CONFIGS.closed_cognitive, record)).toBe(false);
  });

  it('does not let a natural-cue response count as independent on a reduced array', () => {
    const strictAdl = { ...DEFAULT_SKILL_TYPE_CONFIGS.adaptive_self_help, mastery_threshold_pct: 100 };
    const session: MasterySessionRecord = {
      session_id: 's1',
      goal_id: 'g',
      date: '2026-02-01T10:00:00Z',
      independence_pct: 100,
      prompt_level: 'Verbal',
      natural_cue_only: true,
      first_trial_independent: true,
    };
    expect(sessionQualifies(strictAdl, session)).toBe(true);
    expect(sessionQualifies(strictAdl, { ...session, stimulus_support: 'visual_hint' })).toBe(false);
  });
});

describe('server sanitizing', () => {
  const at = '2026-02-01T10:00:00.000Z';

  it('keeps both dimensions and ignores unknown cues', () => {
    expect(
      sanitizeGoalSession({ at, independencePct: 50, promptLevel: 'Gestural', stimulusSupport: 'reduced_choices' })
    ).toMatchObject({ promptLevel: 'Gestural', stimulusSupport: 'reduced_choices' });
    const spoofed = sanitizeGoalSession({ at, promptLevel: 'Verbal', stimulusSupport: 'magic' });
    expect(spoofed).toMatchObject({ promptLevel: 'Verbal' });
    expect(spoofed).not.toHaveProperty('stimulusSupport');
  });

  it('does not accept a digital cue as a response prompt level', () => {
    expect(sanitizeGoalSession({ at, promptLevel: 'direct_visual_assistance' })).not.toHaveProperty('promptLevel');
  });

  it('migrates legacy digital-prompt sessions to stimulus support without a derived Gestural/Model', () => {
    const legacy = sanitizeGoalSession({
      at,
      independencePct: 50,
      promptLevel: 'Model',
      promptSource: 'digital_assistance',
      digitalPromptCue: 'direct_visual_assistance',
    });
    expect(legacy).toMatchObject({ stimulusSupport: 'direct_visual_assistance' });
    expect(legacy).not.toHaveProperty('promptLevel');
    expect(legacy).not.toHaveProperty('promptSource');
    expect(legacy).not.toHaveProperty('digitalPromptCue');
  });

  it('keeps per-trial stimulus aligned with trial scores', () => {
    expect(
      sanitizeGoalSession({ at, trialScores: ['Independent', 'Verbal'], trialStimulus: ['visual_hint', null] })
    ).toMatchObject({ trialStimulus: ['visual_hint', null] });
    expect(
      sanitizeGoalSession({ at, trialScores: ['Independent', 'Verbal'], trialStimulus: ['visual_hint'] })
    ).not.toHaveProperty('trialStimulus');
  });
});

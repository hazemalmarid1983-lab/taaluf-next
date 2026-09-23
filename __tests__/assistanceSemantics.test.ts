import {
  MATCH_ME_ASSISTANCE_SCHEDULE,
  resolveMatchMeAssistanceStage,
  resolveMatchMeTrialOutcome,
  buildMatchMeTrialSpec,
  resolveMatchMeRuntimeSettings,
} from '../lib/training/matchMeEngine';
import {
  FOLLOW_STAR_ASSISTANCE_SCHEDULE,
  resolveFollowStarAssistanceStage,
  resolveFollowStarTrialOutcome,
} from '../lib/training/followStarEngine';
import {
  promptLevelFromAssistanceDelivered,
  resolveAssistanceDelivered,
  resolveTrialPromptLevel,
} from '../lib/training/assistanceSemantics';
import {
  requireTrainingMedia,
  resolveMediaRuntimeConfig,
  trainingIndependencePercentage,
} from '../lib/training/engine';
import { loadAttentionFocusChapter } from '../lib/training/loadChapter';

describe('assistance semantics — shared prompting rules', () => {
  const matchMedia = requireTrainingMedia(loadAttentionFocusChapter(), 'match-me');
  const matchSettings = resolveMatchMeRuntimeSettings(
    resolveMediaRuntimeConfig(matchMedia)
  );

  it('1. slow correct response without assistance → independent', () => {
    const spec = buildMatchMeTrialSpec(matchSettings, 1);
    const correctId = spec.choices.find((c) => c.isCorrect)!.id;

    const outcome = resolveMatchMeTrialOutcome({
      promptingEnabled: true,
      selected: true,
      choiceId: correctId,
      spec,
      elapsedMs: 2200,
    });

    expect(outcome.promptLevel).toBe('independent');
    expect(outcome.correct).toBe(true);
  });

  it('2. correct after visual hint → visual_hint (non-independent)', () => {
    const spec = buildMatchMeTrialSpec(matchSettings, 1);
    const correctId = spec.choices.find((c) => c.isCorrect)!.id;

    const outcome = resolveMatchMeTrialOutcome({
      promptingEnabled: true,
      selected: true,
      choiceId: correctId,
      spec,
      elapsedMs: 3000,
    });

    expect(outcome.promptLevel).toBe('visual_hint');
    expect(trainingIndependencePercentage([{ promptLevel: outcome.promptLevel }])).toBe(
      0
    );
  });

  it('3. correct after reduced choices → reduced_choices', () => {
    const level3Settings = resolveMatchMeRuntimeSettings({
      ...resolveMediaRuntimeConfig(matchMedia),
      matchLevel: 3,
      choices: 3,
    });
    const spec = buildMatchMeTrialSpec(level3Settings, 1);
    const correctId = spec.choices.find((c) => c.isCorrect)!.id;

    const outcome = resolveMatchMeTrialOutcome({
      promptingEnabled: true,
      selected: true,
      choiceId: correctId,
      spec,
      elapsedMs: 4500,
    });

    expect(outcome.promptLevel).toBe('reduced_choices');
  });

  it('4. correct after direct visual assistance → direct_visual_assistance', () => {
    const spec = buildMatchMeTrialSpec(matchSettings, 1);
    const correctId = spec.choices.find((c) => c.isCorrect)!.id;

    const outcome = resolveMatchMeTrialOutcome({
      promptingEnabled: true,
      selected: true,
      choiceId: correctId,
      spec,
      elapsedMs: 7200,
    });

    expect(outcome.promptLevel).toBe('direct_visual_assistance');
  });

  it('5. timeout → no_response', () => {
    const spec = buildMatchMeTrialSpec(matchSettings, 1);

    expect(
      resolveMatchMeTrialOutcome({
        promptingEnabled: true,
        selected: false,
        spec,
        elapsedMs: 8000,
      }).promptLevel
    ).toBe('no_response');
  });

  it('6. incorrect before any assistance → independent (not verbal)', () => {
    const spec = buildMatchMeTrialSpec(matchSettings, 1);
    const incorrectId = spec.choices.find((c) => !c.isCorrect)!.id;

    const outcome = resolveMatchMeTrialOutcome({
      promptingEnabled: true,
      selected: true,
      choiceId: incorrectId,
      spec,
      elapsedMs: 900,
    });

    expect(outcome.promptLevel).toBe('independent');
    expect(outcome.correct).toBe(false);
  });

  it('7. match-me and follow-star share the same semantics model', () => {
    expect(
      resolveTrialPromptLevel({
        responded: true,
        promptingEnabled: true,
        elapsedMs: 2200,
        schedule: MATCH_ME_ASSISTANCE_SCHEDULE,
      })
    ).toBe('independent');

    expect(
      resolveTrialPromptLevel({
        responded: true,
        promptingEnabled: true,
        elapsedMs: 3000,
        schedule: MATCH_ME_ASSISTANCE_SCHEDULE,
      })
    ).toBe('visual_hint');

    expect(
      resolveTrialPromptLevel({
        responded: true,
        promptingEnabled: true,
        elapsedMs: 1500,
        schedule: FOLLOW_STAR_ASSISTANCE_SCHEDULE,
      })
    ).toBe('visual_hint');

    expect(
      resolveTrialPromptLevel({
        responded: true,
        promptingEnabled: true,
        elapsedMs: 900,
        schedule: FOLLOW_STAR_ASSISTANCE_SCHEDULE,
      })
    ).toBe('independent');
  });

  it('8. independence metrics reflect assistance delivered, not latency alone', () => {
    const trials = [
      { promptLevel: 'independent' as const },
      { promptLevel: 'independent' as const },
      { promptLevel: 'visual_hint' as const },
      { promptLevel: 'reduced_choices' as const },
    ];

    expect(trainingIndependencePercentage(trials)).toBe(50);
  });

  it('maps assistance stages to prompt levels without human prompt names', () => {
    expect(promptLevelFromAssistanceDelivered('none')).toBe('independent');
    expect(promptLevelFromAssistanceDelivered('visual_hint')).toBe('visual_hint');
    expect(promptLevelFromAssistanceDelivered('reduced_choices')).toBe(
      'reduced_choices'
    );
    expect(promptLevelFromAssistanceDelivered('direct_visual_assistance')).toBe(
      'direct_visual_assistance'
    );
  });

  it('follow-star slow hit without visual cue timing → independent', () => {
    expect(
      resolveFollowStarTrialOutcome({
        promptingEnabled: true,
        tapped: true,
        hit: true,
        elapsedReadyMs: 900,
        movementMs: 1000,
      }).promptLevel
    ).toBe('independent');
  });

  it('follow-star hit after visual cue → visual_hint', () => {
    expect(
      resolveFollowStarTrialOutcome({
        promptingEnabled: true,
        tapped: true,
        hit: true,
        elapsedReadyMs: 1800,
        movementMs: 1000,
      }).promptLevel
    ).toBe('visual_hint');
  });

  it('assistance stage escalates over time in match-me', () => {
    expect(resolveMatchMeAssistanceStage(1000, true)).toBe('none');
    expect(resolveMatchMeAssistanceStage(3000, true)).toBe('visual_hint');
    expect(resolveMatchMeAssistanceStage(5000, true)).toBe('reduced_choices');
    expect(resolveMatchMeAssistanceStage(7500, true)).toBe(
      'direct_visual_assistance'
    );
  });

  it('assistance stage escalates over time in follow-star', () => {
    expect(resolveFollowStarAssistanceStage(900, true)).toBe('none');
    expect(resolveFollowStarAssistanceStage(1500, true)).toBe('visual_hint');
  });

  it('resolveAssistanceDelivered uses schedule thresholds only', () => {
    expect(
      resolveAssistanceDelivered(4000, MATCH_ME_ASSISTANCE_SCHEDULE, true)
    ).toBe('reduced_choices');
    expect(
      resolveAssistanceDelivered(4000, MATCH_ME_ASSISTANCE_SCHEDULE, false)
    ).toBe('none');
  });
});

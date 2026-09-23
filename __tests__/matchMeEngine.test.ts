import { loadAttentionFocusChapter } from '../lib/training/loadChapter';

import {

  requireTrainingMedia,

  resolveMediaRuntimeConfig,

} from '../lib/training/engine';

import {

  buildMatchMeTrialSpec,

  getMatchMeDisplayedChoices,

  isMatchMeSelectionCorrect,

  MATCH_LEVEL_CHOICE_COUNT,

  resolveMatchLevel,

  resolveMatchMeAssistanceStage,

  resolveMatchMeRuntimeSettings,

  resolveMatchMeTrialOutcome,

  wereMatchMeChoicesReduced,

} from '../lib/training/matchMeEngine';

import type { ResolvedMediaConfig } from '../lib/training/engine/types';



describe('match-me engine', () => {

  const media = requireTrainingMedia(loadAttentionFocusChapter(), 'match-me');

  const runtimeConfig = resolveMediaRuntimeConfig(media);

  const settings = resolveMatchMeRuntimeSettings(runtimeConfig);



  it('reads runtime settings from media config', () => {

    expect(settings.trialCount).toBe(10);

    expect(settings.difficulty).toBe(1);

    expect(settings.matchLevel).toBe(1);

    expect(settings.choiceCount).toBe(2);

    expect(settings.prompting).toBe(true);

    expect(settings.reinforcement).toBe(true);

    expect(settings.responseWindowMs).toBe(8000);

    expect(settings.itemPool).toBe('basic_shapes');

  });



  it('supports match levels 1–6 choice counts', () => {

    expect(MATCH_LEVEL_CHOICE_COUNT[1]).toBe(2);

    expect(MATCH_LEVEL_CHOICE_COUNT[2]).toBe(3);

    expect(MATCH_LEVEL_CHOICE_COUNT[4]).toBe(4);

    expect(MATCH_LEVEL_CHOICE_COUNT[6]).toBe(4);

  });



  it('builds level 1 trial with two choices', () => {

    const level1Settings = resolveMatchMeRuntimeSettings({

      ...runtimeConfig,

      matchLevel: 1,

      choices: 2,

    });

    const spec = buildMatchMeTrialSpec(level1Settings, 1);



    expect(spec.choices).toHaveLength(2);

    expect(spec.choices.filter((c) => c.isCorrect)).toHaveLength(1);

    expect(spec.matchLevel).toBe(1);

  });



  it('builds level 2 trial with three choices', () => {

    const level2Settings = resolveMatchMeRuntimeSettings({

      ...runtimeConfig,

      matchLevel: 2,

      choices: 3,

    });

    const spec = buildMatchMeTrialSpec(level2Settings, 2);



    expect(spec.choices).toHaveLength(3);

    expect(spec.choices.some((c) => c.isCorrect)).toBe(true);

    expect(spec.choices.filter((c) => !c.isCorrect)).toHaveLength(2);

  });



  it('selects distractors distinct from the target', () => {

    const spec = buildMatchMeTrialSpec(settings, 3);

    const correct = spec.choices.find((c) => c.isCorrect)!;



    for (const choice of spec.choices) {

      if (!choice.isCorrect) {

        expect(choice.item.id).not.toBe(correct.item.id);

      }

    }

  });



  it('detects correct and incorrect selections', () => {

    const spec = buildMatchMeTrialSpec(settings, 1);

    const correct = spec.choices.find((c) => c.isCorrect)!;

    const incorrect = spec.choices.find((c) => !c.isCorrect)!;



    expect(isMatchMeSelectionCorrect(correct.id, spec)).toBe(true);

    expect(isMatchMeSelectionCorrect(incorrect.id, spec)).toBe(false);

    expect(isMatchMeSelectionCorrect('missing', spec)).toBe(false);

  });



  it('assigns prompt levels including no_response', () => {

    const spec = buildMatchMeTrialSpec(settings, 1);



    expect(

      resolveMatchMeTrialOutcome({

        promptingEnabled: true,

        selected: false,

        spec,

        elapsedMs: 8000,

      }).promptLevel

    ).toBe('no_response');



    expect(

      resolveMatchMeTrialOutcome({

        promptingEnabled: true,

        selected: true,

        choiceId: spec.choices.find((c) => c.isCorrect)!.id,

        spec,

        elapsedMs: 900,

      }).promptLevel

    ).toBe('independent');

  });



  it('records reduced choices as reduced_choices prompt level', () => {

    const level3Settings = resolveMatchMeRuntimeSettings({

      ...runtimeConfig,

      matchLevel: 3,

      choices: 3,

    });

    const spec = buildMatchMeTrialSpec(level3Settings, 4);

    const reduced = getMatchMeDisplayedChoices(spec, 'reduced_choices');



    expect(reduced.length).toBeLessThan(spec.choices.length);

    expect(wereMatchMeChoicesReduced(spec, 'reduced_choices')).toBe(true);



    const correctId = spec.choices.find((c) => c.isCorrect)!.id;

    const outcome = resolveMatchMeTrialOutcome({

      promptingEnabled: true,

      selected: true,

      choiceId: correctId,

      spec,

      elapsedMs: 5000,

    });



    expect(outcome.correct).toBe(true);

    expect(outcome.promptLevel).toBe('reduced_choices');

  });



  it('escalates assistance stage over time', () => {

    expect(resolveMatchMeAssistanceStage(1000, true)).toBe('none');

    expect(resolveMatchMeAssistanceStage(3000, true)).toBe('visual_hint');

    expect(resolveMatchMeAssistanceStage(5000, true)).toBe('reduced_choices');

    expect(resolveMatchMeAssistanceStage(7500, true)).toBe(

      'direct_visual_assistance'

    );

  });



  it('measures response time from elapsed ms', () => {

    const spec = buildMatchMeTrialSpec(settings, 1);

    const correctId = spec.choices.find((c) => c.isCorrect)!.id;



    const outcome = resolveMatchMeTrialOutcome({

      promptingEnabled: true,

      selected: true,

      choiceId: correctId,

      spec,

      elapsedMs: 1420,

    });



    expect(outcome.responseTimeMs).toBe(1420);

    expect(outcome.correct).toBe(true);

  });



  it('derives match level from difficulty when not explicit', () => {

    const cfg1: ResolvedMediaConfig = {

      ...runtimeConfig,

      matchLevel: undefined,

      difficulty: 1,

    };

    const cfg2: ResolvedMediaConfig = {

      ...runtimeConfig,

      matchLevel: undefined,

      difficulty: 2,

    };

    const cfg3: ResolvedMediaConfig = {

      ...runtimeConfig,

      matchLevel: undefined,

      difficulty: 3,

    };



    expect(resolveMatchLevel(cfg1)).toBe(1);

    expect(resolveMatchLevel(cfg2)).toBe(3);

    expect(resolveMatchLevel(cfg3)).toBe(4);

  });



  it('prevents duplicate recording via session engine contract', () => {

    const spec = buildMatchMeTrialSpec(settings, 1);

    const correctId = spec.choices.find((c) => c.isCorrect)!.id;



    const first = resolveMatchMeTrialOutcome({

      promptingEnabled: true,

      selected: true,

      choiceId: correctId,

      spec,

      elapsedMs: 800,

    });



    const second = resolveMatchMeTrialOutcome({

      promptingEnabled: true,

      selected: true,

      choiceId: correctId,

      spec,

      elapsedMs: 800,

    });



    expect(first).toEqual(second);

  });

});



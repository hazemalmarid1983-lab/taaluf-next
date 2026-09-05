import {
  DEFAULT_GOAL_WHY,
  analysisFocusSentence,
  buildProposedGoals,
  goalWhyFromCriterion,
} from '../lib/goalsEngine';
import { shortRadarDomainLabel } from '../lib/radarLabels';

describe('goal why text', () => {
  it('maps fused fractional scores to the nearest level description', () => {
    const why = goalWhyFromCriterion(
      {
        levels: {
          '2': { description: 'نادراً ما ينظر للعين أثناء اللعب.' },
        },
      },
      1.8
    );
    expect(why).toBe('نادراً ما ينظر للعين أثناء اللعب.');
  });

  it('fills a default why when the criterion has no level text', () => {
    expect(goalWhyFromCriterion({ levels: {} }, 3)).toBe(DEFAULT_GOAL_WHY);
    expect(goalWhyFromCriterion(undefined, 2)).toBe(DEFAULT_GOAL_WHY);
  });

  it('never leaves proposed-goal why empty', () => {
    const goals = buildProposedGoals(
      [
        { criterionId: 'C1', score: 2.4 },
        { criterionId: 'missing-id', score: 3 },
      ],
      8
    );
    expect(goals.length).toBeGreaterThan(0);
    for (const g of goals) {
      expect(g.why.trim().length).toBeGreaterThan(10);
    }
  });
});

describe('radar labels', () => {
  it('shortens the social domain so the first letters are not clipped', () => {
    expect(
      shortRadarDomainLabel('التفاعل والاندماج الاجتماعي واللعب')
    ).toBe('التفاعل واللعب');
  });
});

describe('local AI opening sentence', () => {
  it('uses a fluent routine-support sentence when no domain is concentrated', () => {
    expect(analysisFocusSentence([])).toBe(
      'تظهر الحاجة إلى دعم ومتابعة روتينية في الجوانب السلوكية والتفاعلية'
    );
    expect(analysisFocusSentence([])).not.toMatch(/مركّزة في: متابعة/);
  });

  it('lists concentrated domains when present', () => {
    expect(
      analysisFocusSentence(['التواصل الاستجابي والتعبيري'])
    ).toMatch(/دعم مركّز في: التواصل الاستجابي والتعبيري/);
  });
});

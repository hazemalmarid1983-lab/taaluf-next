import {
  buildMilestoneShareText,
  formatReinforcerClock,
  milestoneStarCount,
  reinforcerDeliveryPhrase,
  whatsAppShareUrl,
} from '../lib/reinforcerDelivery';
import { countPromptBreakdown } from '../lib/promptHierarchy';

describe('reinforcer delivery', () => {
  const hugReward = {
    emoji: '🤗',
    labelAr: 'العناق والتشجيع',
    labelEn: 'A hug and praise',
  };

  it('formats a calm countdown clock', () => {
    expect(formatReinforcerClock(125)).toBe('2:05');
    expect(formatReinforcerClock(0)).toBe('0:00');
  });

  it('builds natural Arabic delivery phrases', () => {
    expect(reinforcerDeliveryPhrase(hugReward, true)).toBe(
      'حان وقت العناق والتشجيع'
    );
    expect(reinforcerDeliveryPhrase(hugReward, false)).toBe(
      'Time for A hug and praise'
    );
  });

  it('maps mastery to star counts', () => {
    expect(milestoneStarCount(95)).toBe(5);
    expect(milestoneStarCount(60)).toBe(3);
    expect(milestoneStarCount(10)).toBe(1);
  });

  it('builds share text with independence and prompts', () => {
    const text = buildMilestoneShareText(
      {
        goalTitleAr: 'مطابقة الفواكه',
        masteryPercentage: 80,
        independentCount: 4,
        totalTrials: 5,
        sessionDate: '2026-09-02T10:00:00.000Z',
      },
      'سارة',
      countPromptBreakdown([
        { promptLevel: 'independent' },
        { promptLevel: 'independent' },
        { promptLevel: 'independent' },
        { promptLevel: 'independent' },
        { promptLevel: 'gestural' },
      ]),
      true
    );
    expect(text).toContain('سارة');
    expect(text).toContain('80%');
    expect(text).toContain('4/5');
  });

  it('encodes WhatsApp share links', () => {
    expect(whatsAppShareUrl('hello')).toContain('wa.me');
    expect(whatsAppShareUrl('hello')).toContain('hello');
  });
});

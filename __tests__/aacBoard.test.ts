import {
  AAC_CARDS,
  AAC_CATEGORIES,
  AAC_MAX_CARDS,
  aacCardsInCategory,
  buildAacSentence,
  type AacCard,
} from '../lib/aacBoard';

function card(id: string): AacCard {
  const found = AAC_CARDS.find((entry) => entry.id === id);
  if (!found) throw new Error(`missing AAC card: ${id}`);
  return found;
}

describe('AAC card bank', () => {
  it('covers the three core categories with unique cards', () => {
    expect(AAC_CATEGORIES.map((entry) => entry.id)).toEqual([
      'requests',
      'activities',
      'feelings',
    ]);

    const ids = new Set(AAC_CARDS.map((entry) => entry.id));
    expect(ids.size).toBe(AAC_CARDS.length);
    expect(aacCardsInCategory('requests')).toHaveLength(6);
    expect(aacCardsInCategory('activities')).toHaveLength(5);
    expect(aacCardsInCategory('feelings')).toHaveLength(3);
  });

  it('gives every card both languages and a spoken form', () => {
    AAC_CARDS.forEach((entry) => {
      expect(entry.labelAr.trim()).not.toBe('');
      expect(entry.labelEn.trim()).not.toBe('');
      expect(entry.wordAr.trim()).not.toBe('');
      expect(entry.wordEn.trim()).not.toBe('');
      expect(entry.emoji.trim()).not.toBe('');
    });
  });

  it('leaves room for a short sentence without overflowing the strip', () => {
    expect(AAC_MAX_CARDS).toBeGreaterThanOrEqual(4);
    expect(AAC_MAX_CARDS).toBeLessThanOrEqual(8);
  });
});

describe('buildAacSentence', () => {
  it('opens with the pronoun form then keeps the rest bare', () => {
    expect(buildAacSentence([card('want'), card('water')], 'ar')).toBe(
      'أنا أريد ماء'
    );
    expect(buildAacSentence([card('want'), card('water')], 'en')).toBe(
      'I want water'
    );
  });

  it('speaks a lone card as a complete utterance', () => {
    expect(buildAacSentence([card('help')], 'ar')).toBe('أريد مساعدة');
    expect(buildAacSentence([card('happy')], 'ar')).toBe('أنا سعيد');
    expect(buildAacSentence([card('happy')], 'en')).toBe('I am happy');
  });

  it('drops the opener for cards that follow the first one', () => {
    expect(buildAacSentence([card('want'), card('toilet')], 'ar')).toBe(
      'أنا أريد الحمام'
    );
    expect(buildAacSentence([card('want'), card('break')], 'en')).toBe(
      'I want a break'
    );
  });

  it('falls back to the bare word when a card has no opener', () => {
    expect(buildAacSentence([card('stop')], 'ar')).toBe('توقف');
    expect(buildAacSentence([card('stop')], 'en')).toBe('stop');
  });

  it('returns an empty string for an empty strip', () => {
    expect(buildAacSentence([], 'ar')).toBe('');
    expect(buildAacSentence([], 'en')).toBe('');
  });
});

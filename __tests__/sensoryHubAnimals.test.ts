import { ANIMAL_CARDS, animalPhrase } from '../lib/sensoryHubAnimals';

describe('sensory hub animals', () => {
  it('defines six large animal cards', () => {
    expect(ANIMAL_CARDS).toHaveLength(6);
    expect(ANIMAL_CARDS.every((c) => c.emoji && c.toneHz > 0)).toBe(true);
  });

  it('builds speech label as animal name only', () => {
    const cat = ANIMAL_CARDS[0];
    expect(animalPhrase(cat, true)).toBe('قطة');
    expect(animalPhrase(cat, false)).toBe('Cat');
    expect(animalPhrase(cat, true)).not.toContain('مواء');
  });
});

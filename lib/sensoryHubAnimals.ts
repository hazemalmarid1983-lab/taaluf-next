/**
 * بيانات حديقة أصوات الحيوانات — قابلة للاختبار.
 */

export type AnimalCard = {
  id: string;
  emoji: string;
  nameAr: string;
  nameEn: string;
  soundAr: string;
  soundEn: string;
  toneHz: number;
};

export const ANIMAL_CARDS: AnimalCard[] = [
  {
    id: 'cat',
    emoji: '🐱',
    nameAr: 'قطة',
    nameEn: 'Cat',
    soundAr: 'مواء',
    soundEn: 'Meow',
    toneHz: 420,
  },
  {
    id: 'dog',
    emoji: '🐶',
    nameAr: 'كلب',
    nameEn: 'Dog',
    soundAr: 'نباح',
    soundEn: 'Woof',
    toneHz: 280,
  },
  {
    id: 'bird',
    emoji: '🐦',
    nameAr: 'عصفور',
    nameEn: 'Bird',
    soundAr: 'زقزقة',
    soundEn: 'Tweet',
    toneHz: 880,
  },
  {
    id: 'cow',
    emoji: '🐮',
    nameAr: 'بقرة',
    nameEn: 'Cow',
    soundAr: 'خوار',
    soundEn: 'Moo',
    toneHz: 180,
  },
  {
    id: 'sheep',
    emoji: '🐑',
    nameAr: 'خروف',
    nameEn: 'Sheep',
    soundAr: 'ثغاء',
    soundEn: 'Baa',
    toneHz: 340,
  },
  {
    id: 'lion',
    emoji: '🦁',
    nameAr: 'أسد',
    nameEn: 'Lion',
    soundAr: 'زئير',
    soundEn: 'Roar',
    toneHz: 120,
  },
];

export function animalPhrase(card: AnimalCard, isAr: boolean) {
  return isAr ? card.nameAr : card.nameEn;
}

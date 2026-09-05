/**
 * بيانات لوحة التواصل المعزز والبديل (AAC) ومنطق تكوين الجملة.
 *
 * منفصلة عن المكوّن لتبقى قابلة للاختبار ولإعادة الاستعمال في أي شاشة
 * تحتاج تعبيراً بديلاً للطفل غير الناطق.
 */

export type AacCategoryId = 'requests' | 'activities' | 'feelings';

export type AacCard = {
  id: string;
  category: AacCategoryId;
  emoji: string;
  labelAr: string;
  labelEn: string;
  /** الصيغة المنطوقة داخل الجملة */
  wordAr: string;
  wordEn: string;
  /** صيغة أطول تُستعمل حين تفتح البطاقةُ الجملة، فلا يخرج النطق مبتوراً */
  openerAr?: string;
  openerEn?: string;
};

export type AacCategory = {
  id: AacCategoryId;
  emoji: string;
  labelAr: string;
  labelEn: string;
  tone: string;
};

export const AAC_CATEGORIES: AacCategory[] = [
  {
    id: 'requests',
    emoji: '🙋',
    labelAr: 'الطلبات والحاجات',
    labelEn: 'Requests & needs',
    tone: 'border-[#2E7D8E]/25 bg-[#2E7D8E]/[0.06]',
  },
  {
    id: 'activities',
    emoji: '🎨',
    labelAr: 'المعزّزات والأنشطة',
    labelEn: 'Rewards & activities',
    tone: 'border-amber-300/50 bg-amber-50/80',
  },
  {
    id: 'feelings',
    emoji: '💚',
    labelAr: 'المشاعر',
    labelEn: 'Feelings',
    tone: 'border-emerald-300/50 bg-emerald-50/80',
  },
];

export const AAC_CARDS: AacCard[] = [
  {
    id: 'want',
    category: 'requests',
    emoji: '🙋',
    labelAr: 'أريد',
    labelEn: 'I want',
    wordAr: 'أريد',
    wordEn: 'want',
    openerAr: 'أنا أريد',
    openerEn: 'I want',
  },
  {
    id: 'help',
    category: 'requests',
    emoji: '🆘',
    labelAr: 'مساعدة',
    labelEn: 'Help',
    wordAr: 'مساعدة',
    wordEn: 'help',
    openerAr: 'أريد مساعدة',
    openerEn: 'I need help',
  },
  {
    id: 'stop',
    category: 'requests',
    emoji: '✋',
    labelAr: 'توقف',
    labelEn: 'Stop',
    wordAr: 'توقف',
    wordEn: 'stop',
  },
  {
    id: 'toilet',
    category: 'requests',
    emoji: '🚻',
    labelAr: 'حمام',
    labelEn: 'Bathroom',
    wordAr: 'الحمام',
    wordEn: 'the bathroom',
    openerAr: 'أريد الحمام',
    openerEn: 'I need the bathroom',
  },
  {
    id: 'water',
    category: 'requests',
    emoji: '💧',
    labelAr: 'ماء',
    labelEn: 'Water',
    wordAr: 'ماء',
    wordEn: 'water',
    openerAr: 'أريد ماء',
    openerEn: 'I want water',
  },
  {
    id: 'food',
    category: 'requests',
    emoji: '🍽️',
    labelAr: 'أكل',
    labelEn: 'Food',
    wordAr: 'أكل',
    wordEn: 'food',
    openerAr: 'أريد أكل',
    openerEn: 'I want food',
  },
  {
    id: 'toy',
    category: 'activities',
    emoji: '🧸',
    labelAr: 'لعبة',
    labelEn: 'A toy',
    wordAr: 'لعبة',
    wordEn: 'a toy',
    openerAr: 'أريد لعبة',
    openerEn: 'I want a toy',
  },
  {
    id: 'drawing',
    category: 'activities',
    emoji: '🖍️',
    labelAr: 'رسم',
    labelEn: 'Drawing',
    wordAr: 'الرسم',
    wordEn: 'to draw',
    openerAr: 'أريد الرسم',
    openerEn: 'I want to draw',
  },
  {
    id: 'break',
    category: 'activities',
    emoji: '🛋️',
    labelAr: 'استراحة',
    labelEn: 'A break',
    wordAr: 'استراحة',
    wordEn: 'a break',
    openerAr: 'أريد استراحة',
    openerEn: 'I want a break',
  },
  {
    id: 'music',
    category: 'activities',
    emoji: '🎵',
    labelAr: 'موسيقى',
    labelEn: 'Music',
    wordAr: 'موسيقى',
    wordEn: 'music',
    openerAr: 'أريد موسيقى',
    openerEn: 'I want music',
  },
  {
    id: 'tablet',
    category: 'activities',
    emoji: '📱',
    labelAr: 'أيباد',
    labelEn: 'Tablet',
    wordAr: 'الأيباد',
    wordEn: 'the tablet',
    openerAr: 'أريد الأيباد',
    openerEn: 'I want the tablet',
  },
  {
    id: 'happy',
    category: 'feelings',
    emoji: '😀',
    labelAr: 'سعيد',
    labelEn: 'Happy',
    wordAr: 'سعيد',
    wordEn: 'happy',
    openerAr: 'أنا سعيد',
    openerEn: 'I am happy',
  },
  {
    id: 'tired',
    category: 'feelings',
    emoji: '😴',
    labelAr: 'متعب',
    labelEn: 'Tired',
    wordAr: 'متعب',
    wordEn: 'tired',
    openerAr: 'أنا متعب',
    openerEn: 'I am tired',
  },
  {
    id: 'upset',
    category: 'feelings',
    emoji: '😣',
    labelAr: 'منزعج',
    labelEn: 'Upset',
    wordAr: 'منزعج',
    wordEn: 'upset',
    openerAr: 'أنا منزعج',
    openerEn: 'I am upset',
  },
];

/** أطول من ذلك يخرج الشريط عن مدى انتباه الطفل ويكسر تخطيط اللوحة */
export const AAC_MAX_CARDS = 6;

export function aacCardsInCategory(category: AacCategoryId) {
  return AAC_CARDS.filter((card) => card.category === category);
}

/**
 * يبني الجملة المنطوقة: أول بطاقة بصيغتها الافتتاحية والبقية بصيغتها المختصرة،
 * فيخرج «أنا أريد ماء» لا «أريد ماء».
 */
export function buildAacSentence(cards: AacCard[], lang: 'ar' | 'en') {
  return cards
    .map((card, index) => {
      if (index === 0) {
        return lang === 'ar'
          ? card.openerAr || card.wordAr
          : card.openerEn || card.wordEn;
      }
      return lang === 'ar' ? card.wordAr : card.wordEn;
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

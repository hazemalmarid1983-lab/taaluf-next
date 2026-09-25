/**
 * فهرس الرسوم التعليمية الملونة — مصدر الحقيقة لربط المفردات والأفعال بالرسم.
 * لا يعتمد على أيقونات خطية تجريدية؛ كل مفتاح له رسم كرتوني واضح.
 */

export const EDUCATIONAL_ASSET_KIND = 'cartoon-illustration' as const;

export type EducationalAssetKind = typeof EDUCATIONAL_ASSET_KIND;

/** مفاتيح الرسوم المعتمدة في المنصة */
export const EDUCATIONAL_ASSET_IDS = [
  // أفعال / أعضاء جسم — تقليد الملاحِظ
  'hands_up',
  'clap',
  'wave',
  'touch_nose',
  'touch_head',
  'smile',
  // تواصل / أوامر
  'come',
  'sit',
  'give',
  'face_child',
  'face_adult',
  'water',
  'food',
  'toy',
  'book',
  'ball',
  // مفردات بنك الوسائل / المولّد
  'cat',
  'dog',
  'rabbit',
  'fish',
  'bird',
  'horse',
  'sheep',
  'cow',
  'chicken',
  'goat',
  'duck',
  'lion',
  'elephant',
  'giraffe',
  'monkey',
  'bear',
  'tiger',
  'apple',
  'banana',
  'orange',
  'grapes',
  'strawberry',
  'watermelon',
  'carrot',
  'tomato',
  'cucumber',
  'potato',
  'corn',
  'bread',
  'milk',
  'cheese',
  'egg',
  'rice',
  'car',
  'bus',
  'plane',
  'train',
  'bike',
  'ship',
  'spoon',
  'cup',
  'toothbrush',
  'shoe',
  'key',
  'chair',
  'shirt',
  'pants',
  'jacket',
  'cap',
  'socks',
  'red',
  'blue',
  'green',
  'yellow',
  'circle',
  'square',
  'triangle',
  'star',
] as const;

export type EducationalAssetId = (typeof EDUCATIONAL_ASSET_IDS)[number];

const EMOJI_TO_ASSET: Record<string, EducationalAssetId> = {
  '🐱': 'cat',
  '🐶': 'dog',
  '🐰': 'rabbit',
  '🐟': 'fish',
  '🐦': 'bird',
  '🐴': 'horse',
  '🐑': 'sheep',
  '🐄': 'cow',
  '🐔': 'chicken',
  '🐐': 'goat',
  '🦆': 'duck',
  '🦁': 'lion',
  '🐘': 'elephant',
  '🦒': 'giraffe',
  '🐵': 'monkey',
  '🐻': 'bear',
  '🐯': 'tiger',
  '🍎': 'apple',
  '🍌': 'banana',
  '🍊': 'orange',
  '🍇': 'grapes',
  '🍓': 'strawberry',
  '🍉': 'watermelon',
  '🥕': 'carrot',
  '🍅': 'tomato',
  '🥒': 'cucumber',
  '🥔': 'potato',
  '🌽': 'corn',
  '🍞': 'bread',
  '🥛': 'milk',
  '🧀': 'cheese',
  '🥚': 'egg',
  '🍚': 'rice',
  '🚗': 'car',
  '🚌': 'bus',
  '✈️': 'plane',
  '🚂': 'train',
  '🚲': 'bike',
  '🚢': 'ship',
  '🥄': 'spoon',
  '🥤': 'cup',
  '🪥': 'toothbrush',
  '👟': 'shoe',
  '🔑': 'key',
  '🪑': 'chair',
  '👕': 'shirt',
  '👖': 'pants',
  '🧥': 'jacket',
  '🧢': 'cap',
  '🧦': 'socks',
  '🔴': 'red',
  '🔵': 'blue',
  '🟢': 'green',
  '🟡': 'yellow',
  '⚪': 'circle',
  '🟦': 'square',
  '🔺': 'triangle',
  '⭐': 'star',
  '💧': 'water',
  '🍕': 'food',
  '🧸': 'toy',
  '📚': 'book',
  '⚽': 'ball',
};

const LABEL_TO_ASSET: Record<string, EducationalAssetId> = {
  قطة: 'cat',
  كلب: 'dog',
  أرنب: 'rabbit',
  سمكة: 'fish',
  عصفور: 'bird',
  حصان: 'horse',
  خروف: 'sheep',
  بقرة: 'cow',
  دجاجة: 'chicken',
  ماعز: 'goat',
  بطة: 'duck',
  أسد: 'lion',
  فيل: 'elephant',
  زرافة: 'giraffe',
  قرد: 'monkey',
  دب: 'bear',
  نمر: 'tiger',
  تفاحة: 'apple',
  موز: 'banana',
  برتقال: 'orange',
  عنب: 'grapes',
  فراولة: 'strawberry',
  بطيخ: 'watermelon',
  جزر: 'carrot',
  طماطم: 'tomato',
  خيار: 'cucumber',
  بطاطس: 'potato',
  ذرة: 'corn',
  خبز: 'bread',
  حليب: 'milk',
  جبن: 'cheese',
  بيضة: 'egg',
  أرز: 'rice',
  سيارة: 'car',
  حافلة: 'bus',
  طائرة: 'plane',
  قطار: 'train',
  دراجة: 'bike',
  سفينة: 'ship',
  ملعقة: 'spoon',
  كوب: 'cup',
  فرشاة: 'toothbrush',
  حذاء: 'shoe',
  مفتاح: 'key',
  كرسي: 'chair',
  قميص: 'shirt',
  بنطال: 'pants',
  جاكيت: 'jacket',
  قبعة: 'cap',
  جوارب: 'socks',
  أحمر: 'red',
  أزرق: 'blue',
  أخضر: 'green',
  أصفر: 'yellow',
  دائرة: 'circle',
  مربع: 'square',
  مثلث: 'triangle',
  نجمة: 'star',
  ماء: 'water',
  طعام: 'food',
  لعبة: 'toy',
  كتاب: 'book',
  كرة: 'ball',
  تعال: 'come',
  اجلس: 'sit',
  أعطني: 'give',
  أنت: 'face_child',
  آخر: 'face_adult',
  'ارفع يديك': 'hands_up',
  صفّق: 'clap',
  صفق: 'clap',
  لوّح: 'wave',
  لوح: 'wave',
  'المس أنفك': 'touch_nose',
  'المس رأسك': 'touch_head',
  ابتسم: 'smile',
};

const ASSET_SET = new Set<string>(EDUCATIONAL_ASSET_IDS);

export function isEducationalAssetId(value: string): value is EducationalAssetId {
  return ASSET_SET.has(value);
}

/**
 * يحوّل معرّف عنصر أو رمز تعبيري أو تسمية عربية إلى مفتاح الرسم الملون.
 */
export function resolveEducationalAssetId(
  raw: string | null | undefined
): EducationalAssetId | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (isEducationalAssetId(trimmed)) return trimmed;
  if (EMOJI_TO_ASSET[trimmed]) return EMOJI_TO_ASSET[trimmed];
  if (LABEL_TO_ASSET[trimmed]) return LABEL_TO_ASSET[trimmed];
  const lower = trimmed.toLowerCase();
  if (isEducationalAssetId(lower)) return lower;
  const withoutPrefix = trimmed.replace(/^illustration:/i, '');
  if (isEducationalAssetId(withoutPrefix)) return withoutPrefix;
  return null;
}

export function listEducationalAssetIds(): EducationalAssetId[] {
  return [...EDUCATIONAL_ASSET_IDS];
}

export function educationalAssetCoverageReport(ids: string[]) {
  const missing = ids.filter((id) => !resolveEducationalAssetId(id));
  return {
    total: ids.length,
    covered: ids.length - missing.length,
    missing,
    complete: missing.length === 0,
  };
}

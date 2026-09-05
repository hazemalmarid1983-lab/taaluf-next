/**
 * محرك التوليد الذكي للوسائل التعليمية المنزلية.
 *
 * يحوّل هدفاً مكتوباً في الخطة الفردية إلى وسيلة رقمية تفاعلية كاملة:
 *   نص الهدف ← تحديد نوع المهارة ← استخراج المثيرات ← بناء خطوات توجيه الأهل.
 *
 * الطبقة المحلية هنا تعمل بلا ذكاء اصطناعي (قواعد + بنك مفردات)، وتُستخدم أيضاً
 * لتطبيع ناتج المزوّد الذكي وسدّ نواقصه، حتى لا تستقبل الواجهة وسيلة ناقصة أبداً.
 */

import {
  AUTISM_TOOLS_BANK,
  type AutismTool,
  type AutismToolDomainId,
} from '@/lib/data/autismToolsBank';
import {
  type HomeClassroomGoal,
  type HomeToolType,
  type InteractiveToolItem,
  type SortingBin,
  type ToolCategory,
} from '@/lib/homeClassroomEngine';
import {
  countTokenMatches,
  detectToolDomains,
  goalTokens,
  normalizeArabic,
  toolMatchesLevel,
} from '@/lib/toolsBank';

/** أسماء أنواع الأنشطة على مستوى الـ API (أوضح للمزوّد الذكي من الأسماء الداخلية) */
export type ApiActivityType =
  | 'visual-matching'
  | 'receptive-id'
  | 'sorting'
  | 'expressive-naming';

const TYPE_FROM_API: Record<ApiActivityType, HomeToolType> = {
  'visual-matching': 'identical_matching',
  'receptive-id': 'receptive_discrimination',
  sorting: 'sorting_categories',
  'expressive-naming': 'functional_naming',
};

const TYPE_TO_API: Record<HomeToolType, ApiActivityType> = {
  identical_matching: 'visual-matching',
  receptive_discrimination: 'receptive-id',
  sorting_categories: 'sorting',
  functional_naming: 'expressive-naming',
};

export function toInternalToolType(raw: unknown): HomeToolType | undefined {
  const key = String(raw || '')
    .trim()
    .toLowerCase();
  if (key in TYPE_FROM_API) return TYPE_FROM_API[key as ApiActivityType];
  // نتقبّل أيضاً الأسماء الداخلية إن أرسلها المزوّد كما هي
  if (key in TYPE_TO_API) return key as HomeToolType;
  return undefined;
}

export function toApiActivityType(type: HomeToolType) {
  return TYPE_TO_API[type];
}

// ─────────────────────────── بنك المفردات المصوّرة ───────────────────────────

type VocabItem = { id: string; nameAr: string; nameEn: string; emoji: string };

type VocabGroup = {
  id: string;
  labelAr: string;
  labelEn: string;
  binEmoji: string;
  category: ToolCategory;
  keywords: string[];
  items: VocabItem[];
};

export const VOCABULARY_GROUPS: VocabGroup[] = [
  {
    id: 'pets',
    labelAr: 'الحيوانات الأليفة',
    labelEn: 'Pets',
    binEmoji: '🏠',
    category: 'animals',
    keywords: ['حيوان أليف', 'الحيوانات الأليفة', 'أليفة', 'أليف', 'pet', 'pets'],
    items: [
      { id: 'cat', nameAr: 'قطة', nameEn: 'Cat', emoji: '🐱' },
      { id: 'dog', nameAr: 'كلب', nameEn: 'Dog', emoji: '🐶' },
      { id: 'rabbit', nameAr: 'أرنب', nameEn: 'Rabbit', emoji: '🐰' },
      { id: 'fish', nameAr: 'سمكة', nameEn: 'Fish', emoji: '🐟' },
      { id: 'bird', nameAr: 'عصفور', nameEn: 'Bird', emoji: '🐦' },
    ],
  },
  {
    id: 'farm_animals',
    labelAr: 'حيوانات المزرعة',
    labelEn: 'Farm animals',
    binEmoji: '🚜',
    category: 'animals',
    keywords: ['مزرعة', 'حيوانات المزرعة', 'farm', 'farm animals'],
    items: [
      { id: 'horse', nameAr: 'حصان', nameEn: 'Horse', emoji: '🐴' },
      { id: 'sheep', nameAr: 'خروف', nameEn: 'Sheep', emoji: '🐑' },
      { id: 'cow', nameAr: 'بقرة', nameEn: 'Cow', emoji: '🐄' },
      { id: 'chicken', nameAr: 'دجاجة', nameEn: 'Chicken', emoji: '🐔' },
      { id: 'goat', nameAr: 'ماعز', nameEn: 'Goat', emoji: '🐐' },
      { id: 'duck', nameAr: 'بطة', nameEn: 'Duck', emoji: '🦆' },
    ],
  },
  {
    id: 'wild_animals',
    labelAr: 'الحيوانات البرية',
    labelEn: 'Wild animals',
    binEmoji: '🌳',
    category: 'animals',
    keywords: ['بري', 'برية', 'الحيوانات البرية', 'الغابة', 'wild', 'jungle', 'zoo'],
    items: [
      { id: 'lion', nameAr: 'أسد', nameEn: 'Lion', emoji: '🦁' },
      { id: 'elephant', nameAr: 'فيل', nameEn: 'Elephant', emoji: '🐘' },
      { id: 'giraffe', nameAr: 'زرافة', nameEn: 'Giraffe', emoji: '🦒' },
      { id: 'monkey', nameAr: 'قرد', nameEn: 'Monkey', emoji: '🐵' },
      { id: 'bear', nameAr: 'دب', nameEn: 'Bear', emoji: '🐻' },
      { id: 'tiger', nameAr: 'نمر', nameEn: 'Tiger', emoji: '🐯' },
    ],
  },
  {
    id: 'fruits',
    labelAr: 'الفواكه',
    labelEn: 'Fruits',
    binEmoji: '🧺',
    category: 'fruits',
    keywords: ['فاكهة', 'فواكه', 'الفواكه', 'fruit', 'fruits'],
    items: [
      { id: 'apple', nameAr: 'تفاحة', nameEn: 'Apple', emoji: '🍎' },
      { id: 'banana', nameAr: 'موز', nameEn: 'Banana', emoji: '🍌' },
      { id: 'orange', nameAr: 'برتقال', nameEn: 'Orange', emoji: '🍊' },
      { id: 'grapes', nameAr: 'عنب', nameEn: 'Grapes', emoji: '🍇' },
      { id: 'strawberry', nameAr: 'فراولة', nameEn: 'Strawberry', emoji: '🍓' },
      { id: 'watermelon', nameAr: 'بطيخ', nameEn: 'Watermelon', emoji: '🍉' },
    ],
  },
  {
    id: 'vegetables',
    labelAr: 'الخضروات',
    labelEn: 'Vegetables',
    binEmoji: '🥬',
    category: 'food',
    keywords: ['خضار', 'خضروات', 'الخضروات', 'vegetable', 'vegetables'],
    items: [
      { id: 'carrot', nameAr: 'جزر', nameEn: 'Carrot', emoji: '🥕' },
      { id: 'tomato', nameAr: 'طماطم', nameEn: 'Tomato', emoji: '🍅' },
      { id: 'cucumber', nameAr: 'خيار', nameEn: 'Cucumber', emoji: '🥒' },
      { id: 'potato', nameAr: 'بطاطس', nameEn: 'Potato', emoji: '🥔' },
      { id: 'corn', nameAr: 'ذرة', nameEn: 'Corn', emoji: '🌽' },
    ],
  },
  {
    id: 'food',
    labelAr: 'الطعام',
    labelEn: 'Food',
    binEmoji: '🍽️',
    category: 'food',
    keywords: ['طعام', 'الطعام', 'أكل', 'وجبة', 'food', 'meal'],
    items: [
      { id: 'bread', nameAr: 'خبز', nameEn: 'Bread', emoji: '🍞' },
      { id: 'milk', nameAr: 'حليب', nameEn: 'Milk', emoji: '🥛' },
      { id: 'cheese', nameAr: 'جبن', nameEn: 'Cheese', emoji: '🧀' },
      { id: 'egg', nameAr: 'بيضة', nameEn: 'Egg', emoji: '🥚' },
      { id: 'rice', nameAr: 'أرز', nameEn: 'Rice', emoji: '🍚' },
    ],
  },
  {
    id: 'vehicles',
    labelAr: 'وسائل النقل',
    labelEn: 'Vehicles',
    binEmoji: '🛣️',
    category: 'vehicles',
    keywords: [
      'وسائل النقل',
      'وسائل المواصلات',
      'مواصلات',
      'نقل',
      'مركبة',
      'مركبات',
      'vehicle',
      'vehicles',
      'transport',
      'transportation',
    ],
    items: [
      { id: 'car', nameAr: 'سيارة', nameEn: 'Car', emoji: '🚗' },
      { id: 'bus', nameAr: 'حافلة', nameEn: 'Bus', emoji: '🚌' },
      { id: 'plane', nameAr: 'طائرة', nameEn: 'Plane', emoji: '✈️' },
      { id: 'train', nameAr: 'قطار', nameEn: 'Train', emoji: '🚂' },
      { id: 'bike', nameAr: 'دراجة', nameEn: 'Bicycle', emoji: '🚲' },
      { id: 'ship', nameAr: 'سفينة', nameEn: 'Ship', emoji: '🚢' },
    ],
  },
  {
    id: 'daily_objects',
    labelAr: 'الأدوات اليومية',
    labelEn: 'Daily objects',
    binEmoji: '🧰',
    category: 'daily_objects',
    keywords: [
      'أدوات',
      'الأدوات اليومية',
      'أدوات المنزل',
      'الروتين اليومي',
      'object',
      'objects',
      'household',
      'daily',
    ],
    items: [
      { id: 'spoon', nameAr: 'ملعقة', nameEn: 'Spoon', emoji: '🥄' },
      { id: 'cup', nameAr: 'كوب', nameEn: 'Cup', emoji: '🥤' },
      { id: 'toothbrush', nameAr: 'فرشاة', nameEn: 'Toothbrush', emoji: '🪥' },
      { id: 'shoe', nameAr: 'حذاء', nameEn: 'Shoe', emoji: '👟' },
      { id: 'key', nameAr: 'مفتاح', nameEn: 'Key', emoji: '🔑' },
      { id: 'chair', nameAr: 'كرسي', nameEn: 'Chair', emoji: '🪑' },
    ],
  },
  {
    id: 'clothes',
    labelAr: 'الملابس',
    labelEn: 'Clothes',
    binEmoji: '👚',
    category: 'daily_objects',
    keywords: ['ملابس', 'الملابس', 'لبس', 'clothes', 'clothing'],
    items: [
      { id: 'shirt', nameAr: 'قميص', nameEn: 'Shirt', emoji: '👕' },
      { id: 'pants', nameAr: 'بنطال', nameEn: 'Trousers', emoji: '👖' },
      { id: 'jacket', nameAr: 'جاكيت', nameEn: 'Jacket', emoji: '🧥' },
      { id: 'cap', nameAr: 'قبعة', nameEn: 'Cap', emoji: '🧢' },
      { id: 'socks', nameAr: 'جوارب', nameEn: 'Socks', emoji: '🧦' },
    ],
  },
  {
    id: 'colors',
    labelAr: 'الألوان',
    labelEn: 'Colours',
    binEmoji: '🎨',
    category: 'colors_shapes',
    keywords: ['لون', 'ألوان', 'الألوان', 'color', 'colors', 'colour', 'colours'],
    items: [
      { id: 'red', nameAr: 'أحمر', nameEn: 'Red', emoji: '🔴' },
      { id: 'blue', nameAr: 'أزرق', nameEn: 'Blue', emoji: '🔵' },
      { id: 'green', nameAr: 'أخضر', nameEn: 'Green', emoji: '🟢' },
      { id: 'yellow', nameAr: 'أصفر', nameEn: 'Yellow', emoji: '🟡' },
    ],
  },
  {
    id: 'shapes',
    labelAr: 'الأشكال',
    labelEn: 'Shapes',
    binEmoji: '🔷',
    category: 'colors_shapes',
    keywords: ['شكل', 'أشكال', 'الأشكال', 'shape', 'shapes'],
    items: [
      { id: 'circle', nameAr: 'دائرة', nameEn: 'Circle', emoji: '⚪' },
      { id: 'square', nameAr: 'مربع', nameEn: 'Square', emoji: '🟦' },
      { id: 'triangle', nameAr: 'مثلث', nameEn: 'Triangle', emoji: '🔺' },
      { id: 'star', nameAr: 'نجمة', nameEn: 'Star', emoji: '⭐' },
    ],
  },
];

/** فئة عامة تُستخدم عند غياب أي دلالة في نص الهدف */
const DEFAULT_GROUP_ID = 'daily_objects';

// ───────────────────────── تحليل نص الهدف ─────────────────────────

const SKILL_RULES: Array<{ type: HomeToolType; patterns: RegExp }> = [
  {
    type: 'sorting_categories',
    patterns:
      /يفرز|فرز|يصنّف|يصنف|تصنيف|يرتب|فئات|مجموعات|sort|sorting|categor|classif|group into/i,
  },
  {
    type: 'identical_matching',
    patterns: /يطابق|طابق|مطابقة|تطابق|match|matching|pair|identical/i,
  },
  {
    type: 'functional_naming',
    patterns:
      /يسمّي|يسمي|تسمية|ينطق|يعبّر|يعبر|تعبير|يجيب|expressive|naming|name the|label|say the/i,
  },
  {
    type: 'receptive_discrimination',
    patterns:
      /يتعرّف|يتعرف|تعرّف|تعريف|يشير|إشارة|يميّز|يميز|تمييز|يلمس|استقبالي|receptive|identify|point to|recognis|recogniz|discriminat/i,
  },
];

/** يحدد نوع المهارة من صياغة الهدف، والافتراضي التمييز الاستقبالي */
export function detectToolType(goalText: string): HomeToolType {
  const found = SKILL_RULES.find((rule) => rule.patterns.test(goalText));
  return found?.type || 'receptive_discrimination';
}

/** المجموعات الدلالية المذكورة في الهدف، مرتّبة بعدد الإشارات إليها */
export function detectVocabularyGroups(goalText: string): VocabGroup[] {
  const text = goalText.toLowerCase();
  const scored = VOCABULARY_GROUPS.map((group) => {
    const keywordHits = group.keywords.filter((word) =>
      text.includes(word.toLowerCase())
    ).length;
    const itemHits = group.items.filter(
      (item) =>
        text.includes(item.nameAr) || text.includes(item.nameEn.toLowerCase())
    ).length;
    return { group, score: keywordHits * 2 + itemHits };
  }).filter((entry) => entry.score > 0);

  return scored.sort((a, b) => b.score - a.score).map((entry) => entry.group);
}

/** العناصر المسمّاة صراحةً في الهدف (مثل: «حصان، قطة، خروف») */
export function extractExplicitItems(goalText: string) {
  const text = goalText.toLowerCase();
  const found: Array<VocabItem & { category: ToolCategory }> = [];
  VOCABULARY_GROUPS.forEach((group) => {
    group.items.forEach((item) => {
      const mentioned =
        goalText.includes(item.nameAr) || text.includes(item.nameEn.toLowerCase());
      if (mentioned && !found.some((row) => row.id === item.id)) {
        found.push({ ...item, category: group.category });
      }
    });
  });
  return found;
}

// ───────────────────── قوالب توجيه ولي الأمر ─────────────────────

/**
 * قوالب مبنية على صياغة أهداف البنك اليدوية، تُستخدم للأهداف المولّدة
 * ولسدّ أي خطوة يغفلها المزوّد الذكي. {child} و{item} يُستبدلان وقت العرض.
 */
export const COACH_TEMPLATES: Record<
  HomeToolType,
  {
    setupAr: string;
    setupEn: string;
    verbalCueAr: string;
    verbalCueEn: string;
    supportAr: string;
    supportEn: string;
  }
> = {
  identical_matching: {
    setupAr: 'حطي الشاشة في مستوى نظر الطفل، وشيلي أي شي مشتت من الطاولة.',
    setupEn:
      "Position the screen at the child's eye level and ensure the table is distraction-free.",
    verbalCueAr:
      'قولي لـ{child} بنبرة واضحة ومباشرة: «حط {item} عند {item}» أو «طابق {item}».',
    verbalCueEn:
      'Say clearly and directly: "Match the {item}" or "Put {item} on {item}."',
    supportAr:
      'انتظري 4 ثوانٍ. إذا ما تحرك، وجّهي يده بلطف على الهدف وامدحيه فوراً لما يوصل.',
    supportEn:
      'Wait 4 seconds. If no movement, gently guide their hand and provide immediate praise.',
  },
  receptive_discrimination: {
    setupAr:
      'تأكدي أن الطفل منتبه لكِ وناظر إليكِ قبل ما تعطيه الأمر، وسمّي شيئاً واحداً بس.',
    setupEn:
      'Make sure the child is attending and looking at you before you give the cue, and name only one item.',
    verbalCueAr: 'قولي لـ{child} بنبرة مرحة: «وين {item}؟» أو «المس {item}».',
    verbalCueEn: 'Say cheerfully: "Where is the {item}?" or "Touch the {item}."',
    supportAr:
      'إذا لمس شيئاً غلط، أشيري أنتِ إلى {item} وقولي: «هذا هو»، وبعدها خليه يحاول لحاله.',
    supportEn:
      'If they touch the wrong item, point to the {item} yourself and say "This is it", then let them try again on their own.',
  },
  sorting_categories: {
    setupAr: 'الشاشة فيها سلتين — سمّي كل سلة للطفل أول شي قبل ما تبدأوا.',
    setupEn:
      'The screen shows two baskets — name each basket for the child before you start.',
    verbalCueAr:
      'قولي لـ{child}: «وين نحط {item}؟» وشجّعيه يحطها في السلة الصحيحة.',
    verbalCueEn:
      'Say: "Where do we put the {item}?" and encourage them to place it in the correct basket.',
    supportAr:
      'ساعديه بيدك في أول محاولة عشان يفهم الفكرة، وبعدها خلي المحاولات له لحاله.',
    supportEn:
      'Guide their hand on the first trial to show the idea, then leave the following trials to them.',
  },
  functional_naming: {
    setupAr:
      'اجلسي مقابل الطفل، وأشيري للشاشة بإصبع واحد عشان تثبّتي انتباهه على العنصر.',
    setupEn:
      'Sit facing the child and point at the screen with one finger to anchor their attention on the item.',
    verbalCueAr:
      'أشيري إلى {item} واسألي {child}: «شو هذا؟» وبعد ما يجاوب: «شو نسوي فيه؟» وانتظري 4 ثوانٍ.',
    verbalCueEn:
      'Point at the {item} and ask: "What is this?" then after the answer: "What do we do with it?" Wait 4 seconds.',
    supportAr:
      'إذا ما سمّاها، عطيه أول مقطع من الكلمة بس، وبعدها قلّلي هذي المساعدة في المحاولات الجاية.',
    supportEn:
      'If they do not name it, give only the first syllable of the word, then fade that help in the following trials.',
  },
};

const SKILL_LABELS: Record<HomeToolType, { ar: string; en: string }> = {
  identical_matching: { ar: 'التطابق البصري 1:1', en: '1:1 visual matching' },
  receptive_discrimination: {
    ar: 'الاستجابة اللغوية الاستقبالية',
    en: 'Receptive language response',
  },
  sorting_categories: {
    ar: 'التصنيف المعرفي والمجموعات',
    en: 'Categorisation & sets',
  },
  functional_naming: {
    ar: 'التسمية التعبيرية ووظيفة الأشياء',
    en: 'Expressive naming & object function',
  },
};

// ───────────────────────── أدوات مساعدة ─────────────────────────

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || fallback;
}

/**
 * يقبل الرموز التعبيرية فقط: أي نص لاتيني أو رابط يعني أن المزوّد لم يفهم
 * الحقل، وعرضه في البطاقة يظهر كنص مكسور بدل صورة.
 */
export function sanitizeGlyph(raw: unknown): string | undefined {
  const value = String(raw || '').trim();
  if (!value) return undefined;
  if (/[a-zA-Z0-9]/.test(value)) return undefined;
  return Array.from(value).length <= 4 ? value : undefined;
}

/** يبحث عن رمز مناسب للاسم في بنك المفردات قبل اللجوء لرمز الفئة */
export function glyphForName(nameAr: string, nameEn: string) {
  const ar = nameAr.trim();
  const en = nameEn.trim().toLowerCase();
  // نتقبّل التضمين في الاتجاهين ليطابق «قطة صغيرة» مفردة «قطة» في البنك
  const matches = (candidate: string, bankName: string) =>
    candidate.length >= 2 &&
    (candidate === bankName ||
      candidate.includes(bankName) ||
      bankName.includes(candidate));

  for (const group of VOCABULARY_GROUPS) {
    const hit = group.items.find(
      (item) =>
        matches(ar, item.nameAr) || matches(en, item.nameEn.toLowerCase())
    );
    if (hit) return hit.emoji;
  }
  return undefined;
}

const CATEGORY_GLYPH: Record<ToolCategory, string> = {
  fruits: '🍎',
  food: '🍽️',
  animals: '🐾',
  vehicles: '🚗',
  daily_objects: '🧩',
  colors_shapes: '🔷',
};

function uniqueItems(items: InteractiveToolItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function itemCountFor(type: HomeToolType) {
  if (type === 'sorting_categories') return { min: 4, max: 6 };
  if (type === 'functional_naming') return { min: 3, max: 5 };
  return { min: 3, max: 6 };
}

// ─────────────────── التوليد المحلي (بلا ذكاء اصطناعي) ───────────────────

function groupById(id: string) {
  return (
    VOCABULARY_GROUPS.find((group) => group.id === id) ||
    VOCABULARY_GROUPS.find((group) => group.id === DEFAULT_GROUP_ID)!
  );
}

/** مجموعة مقابلة للفرز: نفضّل تبايناً واضحاً (طعام مقابل مواصلات) */
function contrastGroupFor(group: VocabGroup) {
  const contrastMap: Record<string, string> = {
    pets: 'vehicles',
    farm_animals: 'vehicles',
    wild_animals: 'vehicles',
    fruits: 'vehicles',
    vegetables: 'vehicles',
    food: 'vehicles',
    vehicles: 'fruits',
    daily_objects: 'fruits',
    clothes: 'fruits',
    colors: 'shapes',
    shapes: 'colors',
  };
  return groupById(contrastMap[group.id] || 'vehicles');
}

function toToolItems(
  items: VocabItem[],
  category: ToolCategory
): InteractiveToolItem[] {
  return items.map((item) => ({
    id: item.id,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    category,
    imageUrl: item.emoji,
  }));
}

/**
 * يبني وسيلة كاملة من نص الهدف بقواعد محلية فقط.
 * تُستخدم كاحتياط عند غياب مزوّد ذكي، وكأساس لتطبيع ناتجه.
 */
export function buildLocalActivity(
  goalText: string,
  iepGoalId?: string
): HomeClassroomGoal {
  const text = goalText.trim();
  const toolType = detectToolType(text);
  const detected = detectVocabularyGroups(text);
  const explicit = extractExplicitItems(text);
  const primary = detected[0] || groupById(DEFAULT_GROUP_ID);
  const { min, max } = itemCountFor(toolType);

  let sampleItems: InteractiveToolItem[];
  let sortingBins: SortingBin[] | undefined;
  let distractors: InteractiveToolItem[] | undefined;

  if (toolType === 'sorting_categories') {
    const secondary =
      detected.find((group) => group.id !== primary.id) ||
      contrastGroupFor(primary);
    const perBin = 2;
    const first = toToolItems(primary.items.slice(0, perBin), primary.category);
    const second = toToolItems(
      secondary.items.slice(0, perBin),
      secondary.category
    );
    sampleItems = uniqueItems([...first, ...second]);
    sortingBins = [
      {
        id: `bin_${primary.id}`,
        labelAr: `سلة ${primary.labelAr}`,
        labelEn: `${primary.labelEn} basket`,
        emoji: primary.binEmoji,
        itemIds: first.map((item) => item.id),
      },
      {
        id: `bin_${secondary.id}`,
        labelAr: `سلة ${secondary.labelAr}`,
        labelEn: `${secondary.labelEn} basket`,
        emoji: secondary.binEmoji,
        itemIds: second.map((item) => item.id),
      },
    ];
  } else {
    // العناصر المسمّاة في الهدف أولى من فئتها العامة، فهي مقصد المعلم الصريح
    const pool: Array<VocabItem & { category?: ToolCategory }> =
      explicit.length >= min ? explicit : primary.items;
    sampleItems = uniqueItems(
      pool.slice(0, max).map((item) => ({
        id: item.id,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        category: item.category || primary.category,
        imageUrl: item.emoji,
      }))
    );

    if (toolType === 'receptive_discrimination') {
      const extra = detected[1] || contrastGroupFor(primary);
      distractors = toToolItems(extra.items.slice(0, 2), extra.category).filter(
        (item) => !sampleItems.some((row) => row.id === item.id)
      );
    }
  }

  const skill = SKILL_LABELS[toolType];
  const template = COACH_TEMPLATES[toolType];
  const scopeAr = sortingBins
    ? `${primary.labelAr} و${sortingBins[1].labelAr.replace('سلة ', '')}`
    : primary.labelAr;
  const scopeEn = sortingBins
    ? `${primary.labelEn} and ${sortingBins[1].labelEn.replace(' basket', '')}`
    : primary.labelEn;

  return {
    id: `generated_${slugify(text, 'goal')}`.slice(0, 60),
    origin: 'generated',
    iepGoalId,
    sourceGoalText: text,
    targetSkill: skill.ar,
    targetSkillEn: skill.en,
    toolType,
    titleAr: text,
    titleEn: `${skill.en} — ${scopeEn}`,
    descriptionAr: `وسيلة رقمية مولّدة لهدف الخطة الفردية على ${scopeAr}.`,
    descriptionEn: `Digital activity generated for the IEP goal on ${scopeEn}.`,
    coachInstructions: {
      setupAr: template.setupAr,
      setupEn: template.setupEn,
      parentVerbalCueAr: template.verbalCueAr,
      parentVerbalCueEn: template.verbalCueEn,
      supportGuidanceAr: template.supportAr,
      supportGuidanceEn: template.supportEn,
    },
    sampleItems,
    distractors: distractors?.length ? distractors : undefined,
    sortingBins,
  };
}

// ─────────────── تطبيع ناتج المزوّد الذكي ───────────────

export type GeneratedActivityPayload = {
  activityType?: string;
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  targetSkillAr?: string;
  targetSkillEn?: string;
  items?: Array<{ nameAr?: string; nameEn?: string; emoji?: string }>;
  distractors?: Array<{ nameAr?: string; nameEn?: string; emoji?: string }>;
  bins?: Array<{
    labelAr?: string;
    labelEn?: string;
    emoji?: string;
    itemNamesAr?: string[];
  }>;
  coach?: {
    setupAr?: string;
    setupEn?: string;
    verbalCueAr?: string;
    verbalCueEn?: string;
    supportAr?: string;
    supportEn?: string;
  };
};

function normalizeItems(
  raw: GeneratedActivityPayload['items'],
  category: ToolCategory,
  limit: number
): InteractiveToolItem[] {
  if (!Array.isArray(raw)) return [];
  const items = raw
    .map((entry, index) => {
      const nameAr = String(entry?.nameAr || '').trim();
      const nameEn = String(entry?.nameEn || '').trim();
      if (!nameAr && !nameEn) return null;
      const glyph =
        sanitizeGlyph(entry?.emoji) ||
        glyphForName(nameAr, nameEn) ||
        CATEGORY_GLYPH[category];
      return {
        id: slugify(nameEn || nameAr, `item_${index}`),
        nameAr: nameAr || nameEn,
        nameEn: nameEn || nameAr,
        category,
        imageUrl: glyph,
      } satisfies InteractiveToolItem;
    })
    .filter((item): item is InteractiveToolItem => item !== null);

  return uniqueItems(items).slice(0, limit);
}

/**
 * يحوّل ناتج المزوّد الذكي إلى وسيلة صالحة للعرض.
 * أي حقل ناقص أو غير صالح يُستبدل بمقابله من التوليد المحلي، فلا تصل
 * للواجهة وسيلة بلا عناصر أو بلا خطوات توجيه.
 */
export function normalizeGeneratedActivity(
  payload: GeneratedActivityPayload,
  goalText: string,
  iepGoalId?: string
): HomeClassroomGoal {
  const local = buildLocalActivity(goalText, iepGoalId);
  const toolType = toInternalToolType(payload.activityType) || local.toolType;
  const { min, max } = itemCountFor(toolType);
  const category = local.sampleItems[0]?.category || 'daily_objects';

  let sampleItems = normalizeItems(payload.items, category, max);
  if (sampleItems.length < min) sampleItems = local.sampleItems;

  let sortingBins: SortingBin[] | undefined;
  if (toolType === 'sorting_categories') {
    const bins = (payload.bins || [])
      .map((bin, index) => {
        const labelAr = String(bin.labelAr || '').trim();
        const labelEn = String(bin.labelEn || '').trim();
        const names = (
          Array.isArray(bin.itemNamesAr) ? bin.itemNamesAr : []
        ).map((name) => String(name || '').trim());
        const itemIds = sampleItems
          .filter((item) => names.includes(item.nameAr))
          .map((item) => item.id);
        if (!labelAr || !itemIds.length) return null;
        return {
          id: `bin_${slugify(labelEn || labelAr, `bin_${index}`)}`,
          labelAr,
          labelEn: labelEn || labelAr,
          emoji: sanitizeGlyph(bin.emoji) || '🧺',
          itemIds,
        } satisfies SortingBin;
      })
      .filter((bin): bin is SortingBin => bin !== null);

    // الفرز بلا سلتين صحيحتين لا معنى له، فنرجع لتصنيف محلي مضمون
    const covered = new Set(bins.flatMap((bin) => bin.itemIds));
    const validBins =
      bins.length === 2 && sampleItems.every((item) => covered.has(item.id));
    if (validBins) {
      sortingBins = bins;
    } else {
      sampleItems = local.sampleItems;
      sortingBins = local.sortingBins;
    }
  }

  const distractors =
    toolType === 'receptive_discrimination'
      ? normalizeItems(payload.distractors, category, 3).filter(
          (item) => !sampleItems.some((row) => row.id === item.id)
        )
      : undefined;

  const coach = payload.coach || {};
  const template = COACH_TEMPLATES[toolType];
  const text = (value: unknown, fallback: string) => {
    const clean = String(value || '').trim();
    return clean.length >= 10 ? clean : fallback;
  };

  return {
    id: local.id,
    origin: 'generated',
    iepGoalId,
    sourceGoalText: goalText.trim(),
    toolType,
    targetSkill: text(payload.targetSkillAr, local.targetSkill),
    targetSkillEn: text(payload.targetSkillEn, local.targetSkillEn),
    titleAr: text(payload.titleAr, local.titleAr),
    titleEn: text(payload.titleEn, local.titleEn),
    descriptionAr: text(payload.descriptionAr, local.descriptionAr),
    descriptionEn: text(payload.descriptionEn, local.descriptionEn),
    coachInstructions: {
      setupAr: text(coach.setupAr, template.setupAr),
      setupEn: text(coach.setupEn, template.setupEn),
      parentVerbalCueAr: text(coach.verbalCueAr, template.verbalCueAr),
      parentVerbalCueEn: text(coach.verbalCueEn, template.verbalCueEn),
      supportGuidanceAr: text(coach.supportAr, template.supportAr),
      supportGuidanceEn: text(coach.supportEn, template.supportEn),
    },
    sampleItems,
    distractors: distractors?.length ? distractors : local.distractors,
    sortingBins,
  };
}

// ─────────── توصية وسائل مساندة من بنك الوسائل (184 وسيلة) ───────────

/** المجال الأقرب لكل نوع نشاط، يُستخدم حين لا يذكر الهدف مجالاً صريحاً */
const DOMAIN_FOR_TOOL_TYPE: Record<HomeToolType, AutismToolDomainId> = {
  identical_matching: 'communication',
  receptive_discrimination: 'communication',
  sorting_categories: 'academic',
  functional_naming: 'communication',
};

/**
 * فئات أهداف في بنك الوسائل تخدم كل نوع نشاط منزلي.
 * البنك مبني على المهارات لا على المحتوى، فهدف «يطابق الحيوانات» لا يجد
 * تطابقاً لفظياً؛ هذه الروابط اليدوية تمنع الرجوع لوسائل غير ذات صلة.
 */
const CATEGORY_HINTS_FOR_TOOL_TYPE: Record<HomeToolType, string[]> = {
  identical_matching: ['المفردات', 'التفكير المنطقي', 'التنسيق البصري'],
  receptive_discrimination: ['الاستماع والفهم', 'المفردات'],
  sorting_categories: ['التفكير المنطقي', 'المفردات', 'الذاكرة والانتباه'],
  functional_naming: ['التعبير اللفظي', 'المفردات', 'المحادثة'],
};

export const TOOL_RECOMMENDATION_LIMIT = 4;

/**
 * يرشّح التطبيقات والمواقع الأقرب لهدف مكتوب، بترتيب المطابقة.
 * الترتيب: تطابق فئة الهدف ونصه، ثم قرب المجال النمائي، ثم ملاءمة المستوى.
 * لا تُخلط المجالات: إذا دلّ الهدف على مجال، لا نخرج عنه ولو تطابقت كلمة.
 */
export function recommendToolsForGoal(
  goalText: string,
  level?: string,
  limit: number = TOOL_RECOMMENDATION_LIMIT
): AutismTool[] {
  const text = String(goalText || '').trim();
  const max = Math.max(0, limit);
  if (!text || max === 0) return [];

  const tokens = goalTokens(text);
  const toolType = detectToolType(text);
  const detected = detectToolDomains(text);
  const ranked = detected.length
    ? detected
    : [DOMAIN_FOR_TOOL_TYPE[toolType]];
  const domainBonus = new Map<AutismToolDomainId, number>(
    ranked.map((id, index) => [id, ranked.length - index])
  );
  const hints = CATEGORY_HINTS_FOR_TOOL_TYPE[toolType].map(normalizeArabic);

  const scored = AUTISM_TOOLS_BANK.map((tool, index) => {
    const goalMatches = countTokenMatches(
      tokens,
      `${tool.goal} ${tool.goalCategory}`
    );
    const detailMatches = countTokenMatches(
      tokens,
      `${tool.toolName} ${tool.description} ${tool.notes}`
    );
    const category = normalizeArabic(tool.goalCategory);
    const hintMatch = hints.some((hint) => category.includes(hint));

    // وزن الروابط اليدوية أعلى من تطابق كلمة واحدة عارضة
    const relevance = goalMatches * 5 + detailMatches * 2 + (hintMatch ? 6 : 0);
    let total = relevance + (domainBonus.get(tool.domain) || 0) * 2;
    if (level) total += toolMatchesLevel(tool, level) ? 2 : -3;

    return { tool, relevance, total, index };
  });

  const inDomain = scored.filter((entry) => domainBonus.has(entry.tool.domain));
  const byScore = (a: typeof scored[number], b: typeof scored[number]) =>
    b.total - a.total || a.index - b.index;

  // المطابقات داخل المجال أولاً، ثم بقية وسائل المجال، ثم أي مطابقة خارجه
  const pool = [
    ...inDomain.filter((entry) => entry.relevance > 0).sort(byScore),
    ...inDomain.filter((entry) => entry.relevance === 0).sort(byScore),
    ...scored
      .filter((entry) => !domainBonus.has(entry.tool.domain) && entry.relevance > 0)
      .sort(byScore),
  ];

  // نفس التطبيق يتكرر في أكثر من مجال، فنعرضه مرة واحدة
  const seen = new Set<string>();
  const picked: AutismTool[] = [];
  for (const entry of pool) {
    const key = entry.tool.toolName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(entry.tool);
    if (picked.length >= max) break;
  }
  return picked;
}

/** تعليمات المزوّد الذكي — مبنية على نفس مفاهيم المحرك حتى يطابق ناتجه شكله */
export function activityGenerationPrompt() {
  return `أنت مصمم وسائل تعليمية لأطفال ذوي اضطراب طيف التوحل واحتياجات نمائية، وفق مبادئ ABA وTEACCH.
تستقبل هدفاً من خطة تربوية فردية، وتُرجع JSON فقط يصف وسيلة رقمية تفاعلية.

قواعد إلزامية:
- activityType واحد من: visual-matching | receptive-id | sorting | expressive-naming
- اختر النوع من صياغة الهدف: «يطابق» ← visual-matching، «يتعرف/يشير/يميز» ← receptive-id، «يفرز/يصنف» ← sorting، «يسمّي/يعبّر» ← expressive-naming
- items: من 3 إلى 6 عناصر ملموسة ومألوفة لطفل صغير، لكل عنصر nameAr وnameEn وemoji واحد يمثله بدقة
- emoji: رمز تعبيري واحد فقط، بلا أي حروف أو روابط
- sorting: أعطِ bins سلتين فقط، وكل عنصر في items يجب أن يظهر في itemNamesAr لإحدى السلتين
- receptive-id: أضف distractors عنصرين من فئة مختلفة
- coach: خطوات موجّهة لولي الأمر (أم الطفل) بالعربية البيضاء اليومية البسيطة وبالإنجليزية
- في نصوص coach استخدم {child} مكان اسم الطفل و{item} مكان العنصر المستهدف
- verbalCue يجب أن يضع ما يقوله ولي الأمر للطفل بين علامتي «» في العربية و"" في الإنجليزية
- لا تستخدم لغة تشخيصية أو طبية، ولا تذكر أسماء اضطرابات

الشكل المطلوب:
{
  "activityType": "receptive-id",
  "titleAr": "...", "titleEn": "...",
  "descriptionAr": "...", "descriptionEn": "...",
  "targetSkillAr": "...", "targetSkillEn": "...",
  "items": [{ "nameAr": "قطة", "nameEn": "Cat", "emoji": "🐱" }],
  "distractors": [{ "nameAr": "سيارة", "nameEn": "Car", "emoji": "🚗" }],
  "bins": [{ "labelAr": "سلة الطعام", "labelEn": "Food basket", "emoji": "🧺", "itemNamesAr": ["تفاحة"] }],
  "coach": {
    "setupAr": "...", "setupEn": "...",
    "verbalCueAr": "قولي لـ{child}: «وين {item}؟»",
    "verbalCueEn": "Say: \\"Where is the {item}?\\"",
    "supportAr": "...", "supportEn": "..."
  }
}`;
}

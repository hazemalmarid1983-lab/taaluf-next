/**
 * أدوات التعامل مع بنك الوسائل: التصفية والبحث وتحديد المجال النمائي.
 * البيانات نفسها في lib/data/autismToolsBank.ts (ملف مولّد).
 */

import {
  AUTISM_TOOLS_BANK,
  AUTISM_TOOL_DOMAINS,
  type AutismTool,
  type AutismToolDomainId,
} from '@/lib/data/autismToolsBank';
import type { LanguageSupport } from '@/lib/data/toolLanguage';

// ─────────────────────────── الفئات العمرية ───────────────────────────

export const TOOL_AGE_BANDS = [
  { id: 'early', labelAr: '2–5 سنوات', labelEn: 'Ages 2–5', min: 2, max: 5 },
  { id: 'primary', labelAr: '6–9 سنوات', labelEn: 'Ages 6–9', min: 6, max: 9 },
  { id: 'middle', labelAr: '10–13 سنة', labelEn: 'Ages 10–13', min: 10, max: 13 },
  { id: 'teen', labelAr: '14–18 سنة', labelEn: 'Ages 14–18', min: 14, max: 18 },
] as const;

export type ToolAgeBandId = (typeof TOOL_AGE_BANDS)[number]['id'];

/** يقرأ «3-10» كمدى، و«جميع الأعمار» كمدى مفتوح */
export function parseAgeRange(targetAge: string): { min: number; max: number } {
  const match = targetAge.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) {
    return { min: Number(match[1]), max: Number(match[2]) };
  }
  const single = targetAge.match(/(\d+)/);
  if (single) {
    const value = Number(single[1]);
    return { min: value, max: value };
  }
  return { min: 0, max: 99 };
}

export function toolMatchesAgeBand(tool: AutismTool, bandId: ToolAgeBandId) {
  const band = TOOL_AGE_BANDS.find((entry) => entry.id === bandId);
  if (!band) return true;
  const range = parseAgeRange(tool.targetAge);
  return range.min <= band.max && range.max >= band.min;
}

// ─────────────────────────── أنظمة التشغيل ───────────────────────────

export const TOOL_PLATFORMS = [
  {
    id: 'ios',
    labelAr: 'آيفون / آيباد',
    labelEn: 'iOS / iPadOS',
    pattern: /ios|ipad|iphone|macos/i,
  },
  {
    id: 'android',
    labelAr: 'أندرويد',
    labelEn: 'Android',
    pattern: /android|fire tablet/i,
  },
  {
    id: 'web',
    labelAr: 'متصفح الويب',
    labelEn: 'Web browser',
    pattern: /web|youtube/i,
  },
  {
    id: 'other',
    labelAr: 'أجهزة أخرى',
    labelEn: 'Other devices',
    pattern: /pc|console|nintendo|switch|\btv\b/i,
  },
] as const;

export type ToolPlatformId = (typeof TOOL_PLATFORMS)[number]['id'];

export function toolMatchesPlatform(tool: AutismTool, id: ToolPlatformId) {
  const platform = TOOL_PLATFORMS.find((entry) => entry.id === id);
  return platform ? platform.pattern.test(tool.platform) : true;
}

export function platformTags(tool: AutismTool) {
  return TOOL_PLATFORMS.filter((entry) => entry.pattern.test(tool.platform));
}

// ───────────────────────────── المستويات ─────────────────────────────

export const TOOL_LEVELS = [
  { id: 'مبتدئ', labelAr: 'مبتدئ', labelEn: 'Beginner' },
  { id: 'متوسط', labelAr: 'متوسط', labelEn: 'Intermediate' },
  { id: 'متقدم', labelAr: 'متقدم', labelEn: 'Advanced' },
] as const;

const ALL_LEVELS = 'جميع المستويات';

/** المستوى في المصدر قد يكون «مبتدئ-متوسط» أو «جميع المستويات» */
export function toolMatchesLevel(tool: AutismTool, level: string) {
  const wanted = level.trim();
  if (!wanted) return true;
  if (tool.level.includes(ALL_LEVELS)) return true;
  return tool.level.includes(wanted);
}

// ─────────────────────────── روابط الوصول ───────────────────────────

const DOMAIN_LIKE = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/[^\s]*)?$/i;

/**
 * حقل المصدر يحمل نطاق موقع أحياناً وكلمات بحث أحياناً،
 * فنعيد رابطاً مباشراً حين نتأكد أنه نطاق، وبحثاً فيما عدا ذلك.
 */
export function toolAccessLink(tool: AutismTool): {
  href: string;
  kind: 'site' | 'search';
} {
  const raw = tool.linkOrKeywords.trim();
  if (DOMAIN_LIKE.test(raw)) {
    return { href: `https://${raw}`, kind: 'site' };
  }
  const query = [tool.toolName, raw].filter(Boolean).join(' ');
  return {
    href: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    kind: 'search',
  };
}

// ───────────────────── تطبيع البحث العربي ─────────────────────

/** يوحّد الهمزات والياء والتاء المربوطة ويحذف التشكيل حتى يتطابق البحث */
export function normalizeArabic(value: string) {
  return value
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase();
}

const ARABIC_ARTICLE = /^(وال|بال|فال|كال|لل|ال)/;
const ARABIC_SUFFIX = /(هما|هم|هن|ها|كما|كم|كن|نا|ه)$/;

/** يجرّد الكلمة من أداة التعريف ولاحقة الضمير حتى تتطابق «الأسنان» و«أسنانه» */
export function wordKey(word: string) {
  const base = normalizeArabic(word).replace(ARABIC_ARTICLE, '');
  const stripped = base.replace(ARABIC_SUFFIX, '');
  return stripped.length >= 3 ? stripped : base;
}

/** كلمات عامة لا تميّز هدفاً عن آخر، فإبقاؤها يجعل كل الوسائل تتشابه */
const STOP_WORDS = new Set(
  [
    'ان',
    'على',
    'في',
    'من',
    'مع',
    'الي',
    'عن',
    'او',
    'ثم',
    'بين',
    'عند',
    'هذا',
    'هذه',
    'الطالب',
    'الطفل',
    'الاطفال',
    'تطوير',
    'تعليم',
    'تنميه',
    'مهاره',
    'مهارات',
    'هدف',
    'يستطيع',
    'بنسبه',
    'محاولات',
    'خلال',
    'اثناء',
    'the',
    'and',
    'for',
    'with',
    'his',
    'her',
    'their',
    'skills',
    'skill',
    'child',
    'student',
  ].map(wordKey)
);

export function goalTokens(text: string) {
  return Array.from(
    new Set(
      normalizeArabic(text)
        .split(/[^\p{L}\p{N}]+/u)
        .map(wordKey)
        .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
    )
  );
}

/**
 * تقارب لفظي بسيط: يتجاوز بادئة الفعل فتتطابق «يطابق» مع «مطابقة»،
 * و«يتكيف» مع «التكيف»، دون الحاجة لتحليل صرفي كامل.
 */
export function wordsMatch(token: string, candidate: string) {
  if (token === candidate) return true;
  if (token.length >= 4 && candidate.includes(token.slice(1))) return true;
  if (candidate.length >= 4 && token.includes(candidate.slice(1))) return true;
  return false;
}

/** عدد كلمات الهدف التي يقابلها نص الوسيلة */
export function countTokenMatches(tokens: string[], text: string) {
  const candidates = goalTokens(text);
  return tokens.filter((token) =>
    candidates.some((candidate) => wordsMatch(token, candidate))
  ).length;
}

// ─────────────────── تحديد المجال النمائي من نص الهدف ───────────────────

const DOMAIN_KEYWORDS: Record<AutismToolDomainId, string[]> = {
  communication: [
    'تواصل',
    'لغه',
    'لغوي',
    'لفظي',
    'نطق',
    'كلام',
    'مفردات',
    'جمله',
    'جمل',
    'محادثه',
    'استماع',
    'تسميه',
    'يسمي',
    'تعبير',
    'اسئله',
    'aac',
    // المطابقة والتمييز مهارات تمهيدية للتواصل لا للأكاديميات
    'مطابقه',
    'يطابق',
    'تمييز',
    'يميز',
  ],
  social: [
    'اجتماعي',
    'اجتماعيه',
    'اقران',
    'صداقه',
    'تعاون',
    'مشاركه',
    'علاقات',
    'ادوار',
    'تفاعل',
  ],
  academic: [
    'قراءه',
    'كتابه',
    'حساب',
    'رياضيات',
    'ارقام',
    'عدد',
    'حروف',
    'علوم',
    'ذاكره',
    'انتباه',
    'منطق',
    'تصنيف',
    'فرز',
  ],
  life_skills: [
    'نظافه',
    'لبس',
    'ملابس',
    'طعام',
    'اكل',
    'روتين',
    'جدول',
    'استقلال',
    'امان',
    'سلامه',
    'وقت',
    'مطبخ',
    'اسنان',
    'حمام',
  ],
  motor: [
    'حركه',
    'حركي',
    'حركيه',
    'دقيقه',
    'كبيره',
    'تنسيق',
    'توازن',
    'قبض',
    'اصابع',
    'قلم',
    'مسك',
  ],
  emotional_behavioral: [
    'مشاعر',
    'عاطفي',
    'عاطفيه',
    'غضب',
    'هدوء',
    'سلوك',
    'اندفاع',
    'استرخاء',
    'تامل',
    'تكيف',
    'تغيير',
    'انتقال',
    'تنظيم',
  ],
  sensory: ['حسي', 'حسيه', 'حواس', 'استشعار', 'ضوء', 'لمس', 'صوت', 'اصوات'],
  recreation: [
    'فنون',
    'رسم',
    'تلوين',
    'موسيقي',
    'موسيقا',
    'ايقاع',
    'ترفيه',
    'فيديو',
    'ابداع',
    'لعبه',
  ],
};

/** المجالات التي يشير إليها نص الهدف، مرتّبة بقوة الإشارة */
export function detectToolDomains(goalText: string): AutismToolDomainId[] {
  const text = normalizeArabic(goalText);
  return AUTISM_TOOL_DOMAINS.map((domain) => {
    const hits = DOMAIN_KEYWORDS[domain.id].filter((word) =>
      text.includes(normalizeArabic(word))
    ).length;
    return { id: domain.id, hits };
  })
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map((entry) => entry.id);
}

// ───────────────────────── التصفية والبحث ─────────────────────────

export function domainById(id: AutismToolDomainId) {
  return AUTISM_TOOL_DOMAINS.find((domain) => domain.id === id);
}

export function toolCountByDomain() {
  const counts = {} as Record<AutismToolDomainId, number>;
  AUTISM_TOOL_DOMAINS.forEach((domain) => {
    counts[domain.id] = 0;
  });
  AUTISM_TOOLS_BANK.forEach((tool) => {
    counts[tool.domain] += 1;
  });
  return counts;
}

export function supportsArabic(tool: Pick<AutismTool, 'languageSupport'>) {
  return tool.languageSupport !== 'en';
}

export function arabicSupportingCount(source = AUTISM_TOOLS_BANK) {
  return source.filter(supportsArabic).length;
}

export type ToolFilters = {
  domain?: AutismToolDomainId | 'all';
  ageBand?: ToolAgeBandId | 'all';
  platform?: ToolPlatformId | 'all';
  level?: string;
  query?: string;
  /** حصر النتائج على الوسائل التي تدعم العربية (ar أو bilingual) */
  arabicOnly?: boolean;
};

export function filterTools(filters: ToolFilters, source = AUTISM_TOOLS_BANK) {
  const query = filters.query?.trim()
    ? normalizeArabic(filters.query.trim())
    : '';
  // البحث بالكلمات لا بالنص الخام، حتى تجد «التواصل البديل» عبارة «للتواصل البديل»
  const queryTokens = query ? goalTokens(query) : [];

  const matches = source.filter((tool) => {
    if (filters.arabicOnly && !supportsArabic(tool)) {
      return false;
    }
    if (
      filters.domain &&
      filters.domain !== 'all' &&
      tool.domain !== filters.domain
    ) {
      return false;
    }
    if (
      filters.ageBand &&
      filters.ageBand !== 'all' &&
      !toolMatchesAgeBand(tool, filters.ageBand)
    ) {
      return false;
    }
    if (
      filters.platform &&
      filters.platform !== 'all' &&
      !toolMatchesPlatform(tool, filters.platform)
    ) {
      return false;
    }
    if (filters.level && !toolMatchesLevel(tool, filters.level)) {
      return false;
    }
    if (query) {
      const haystack = normalizeArabic(
        [
          tool.toolName,
          tool.goal,
          tool.goalCategory,
          tool.description,
          tool.notes,
          tool.toolType,
          tool.platform,
          tool.linkOrKeywords,
        ].join(' ')
      );
      if (queryTokens.length) {
        const candidates = goalTokens(haystack);
        const matchesAll = queryTokens.every((token) =>
          candidates.some((candidate) => wordsMatch(token, candidate))
        );
        if (!matchesAll) return false;
      } else if (!haystack.includes(query)) {
        // بحث قصير أو بكلمات عامة فقط: نرجع للمطابقة النصية المباشرة
        return false;
      }
    }
    return true;
  });

  // عند حصر العربية نُقدّم المصمَّم عربياً على ثنائي اللغة، وإلا اختفى في آخر القائمة
  if (!filters.arabicOnly) return matches;
  return [...matches].sort((a, b) => {
    const rank = (support: LanguageSupport) => (support === 'ar' ? 0 : 1);
    return rank(a.languageSupport) - rank(b.languageSupport);
  });
}

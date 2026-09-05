import { recommendToolsForGoal } from '../lib/activityGenerator';
import { ARABIC_NATIVE_TOOLS } from '../lib/data/arabicNativeTools';
import {
  AUTISM_TOOLS_BANK,
  AUTISM_TOOL_DOMAINS,
} from '../lib/data/autismToolsBank';
import {
  detectToolDomains,
  arabicSupportingCount,
  filterTools,
  goalTokens,
  normalizeArabic,
  parseAgeRange,
  platformTags,
  toolAccessLink,
  toolCountByDomain,
  toolMatchesAgeBand,
  toolMatchesLevel,
  toolMatchesPlatform,
  supportsArabic,
  wordKey,
  wordsMatch,
} from '../lib/toolsBank';

describe('tools bank data', () => {
  it('holds the 184 imported tools plus the Arabic additions', () => {
    expect(ARABIC_NATIVE_TOOLS).toHaveLength(4);
    expect(AUTISM_TOOLS_BANK).toHaveLength(184 + ARABIC_NATIVE_TOOLS.length);
    expect(AUTISM_TOOL_DOMAINS).toHaveLength(8);
  });

  it('keeps ids unique and domains valid', () => {
    const ids = new Set(AUTISM_TOOLS_BANK.map((tool) => tool.id));
    expect(ids.size).toBe(AUTISM_TOOLS_BANK.length);

    const domainIds = new Set(AUTISM_TOOL_DOMAINS.map((domain) => domain.id));
    AUTISM_TOOLS_BANK.forEach((tool) => {
      expect(domainIds.has(tool.domain)).toBe(true);
    });
  });

  it('fills every field that the UI renders', () => {
    AUTISM_TOOLS_BANK.forEach((tool) => {
      expect(tool.toolName).not.toBe('');
      expect(tool.goal).not.toBe('');
      expect(tool.goalCategory).not.toBe('');
      expect(tool.toolType).not.toBe('');
      expect(tool.platform).not.toBe('');
      expect(tool.targetAge).not.toBe('');
      expect(tool.level).not.toBe('');
      expect(tool.description).not.toBe('');
      expect(['ar', 'en', 'bilingual']).toContain(tool.languageSupport);
    });
  });

  it('counts per domain add up to the full bank', () => {
    const counts = toolCountByDomain();
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    expect(total).toBe(AUTISM_TOOLS_BANK.length);
    expect(counts.communication).toBe(34);
    expect(counts.recreation).toBe(18);
  });

  it('carries no leftover import corruption', () => {
    const joined = AUTISM_TOOLS_BANK.map((tool) => tool.description).join(' ');
    expect(joined).not.toMatch(/[a-zA-Z]ية\b/);
  });
});

describe('age, platform and level matching', () => {
  it('reads age ranges and open ranges', () => {
    expect(parseAgeRange('3-10')).toEqual({ min: 3, max: 10 });
    expect(parseAgeRange('جميع الأعمار')).toEqual({ min: 0, max: 99 });
  });

  it('matches a tool to overlapping age bands only', () => {
    const tool = AUTISM_TOOLS_BANK.find((entry) => entry.targetAge === '2-8');
    expect(tool).toBeDefined();
    if (!tool) return;
    expect(toolMatchesAgeBand(tool, 'early')).toBe(true);
    expect(toolMatchesAgeBand(tool, 'primary')).toBe(true);
    expect(toolMatchesAgeBand(tool, 'teen')).toBe(false);
  });

  it('treats «جميع الأعمار» as matching every band', () => {
    const tool = AUTISM_TOOLS_BANK.find(
      (entry) => entry.targetAge === 'جميع الأعمار'
    );
    expect(tool).toBeDefined();
    if (!tool) return;
    expect(toolMatchesAgeBand(tool, 'early')).toBe(true);
    expect(toolMatchesAgeBand(tool, 'teen')).toBe(true);
  });

  it('derives platform tags from the source string', () => {
    const tool = AUTISM_TOOLS_BANK.find(
      (entry) => entry.platform === 'Web/iOS/Android'
    );
    expect(tool).toBeDefined();
    if (!tool) return;
    expect(platformTags(tool).map((entry) => entry.id).sort()).toEqual([
      'android',
      'ios',
      'web',
    ]);
    expect(toolMatchesPlatform(tool, 'ios')).toBe(true);
    expect(toolMatchesPlatform(tool, 'other')).toBe(false);
  });

  it('accepts «جميع المستويات» for any requested level', () => {
    const anyLevel = AUTISM_TOOLS_BANK.find(
      (entry) => entry.level === 'جميع المستويات'
    );
    const beginner = AUTISM_TOOLS_BANK.find((entry) => entry.level === 'مبتدئ');
    expect(anyLevel && toolMatchesLevel(anyLevel, 'متقدم')).toBe(true);
    expect(beginner && toolMatchesLevel(beginner, 'متقدم')).toBe(false);
    expect(beginner && toolMatchesLevel(beginner, '')).toBe(true);
  });
});

describe('access links', () => {
  it('links straight to a domain and searches for keywords', () => {
    const site = AUTISM_TOOLS_BANK.find(
      (tool) => tool.linkOrKeywords === 'speechblubs.com'
    );
    const keywords = AUTISM_TOOLS_BANK.find(
      (tool) => tool.linkOrKeywords === 'Splingo app'
    );

    expect(site && toolAccessLink(site)).toEqual({
      href: 'https://speechblubs.com',
      kind: 'site',
    });
    expect(keywords && toolAccessLink(keywords).kind).toBe('search');
  });

  it('never produces an empty link', () => {
    AUTISM_TOOLS_BANK.forEach((tool) => {
      const link = toolAccessLink(tool);
      expect(link.href).toMatch(/^https:\/\/\S+$/);
    });
  });
});

describe('arabic text handling', () => {
  it('unifies hamza, ya and ta marbuta', () => {
    expect(normalizeArabic('الأنشطة')).toBe(normalizeArabic('الانشطه'));
    expect(normalizeArabic('مُبتدئ')).toBe('مبتدي');
  });

  it('strips the definite article and pronoun suffix', () => {
    expect(wordKey('الأسنان')).toBe(wordKey('أسنانه'));
    expect(wordKey('المشاعر')).toBe('مشاعر');
  });

  it('drops generic words from goal tokens', () => {
    const tokens = goalTokens('أن يطابق الطالب بين الحيوانات الأليفة');
    expect(tokens).toContain('يطابق');
    expect(tokens).not.toContain('طالب');
    expect(tokens).not.toContain('مهارات');
  });

  it('bridges verb prefixes when comparing words', () => {
    expect(wordsMatch('يطابق', 'مطابق')).toBe(true);
    expect(wordsMatch('يتكيف', 'تكيف')).toBe(true);
    expect(wordsMatch('مشاعر', 'اصوات')).toBe(false);
  });

  it('detects the developmental domain from the goal wording', () => {
    expect(detectToolDomains('أن يتعرف الطفل على المشاعر')).toContain(
      'emotional_behavioral'
    );
    expect(detectToolDomains('أن يستقل في تنظيف أسنانه')).toContain(
      'life_skills'
    );
    expect(detectToolDomains('هدف بلا كلمات دالة')).toEqual([]);
  });
});

describe('filtering the bank', () => {
  it('filters by domain and age band together', () => {
    const results = filterTools({ domain: 'motor', ageBand: 'early' });
    expect(results.length).toBeGreaterThan(0);
    results.forEach((tool) => {
      expect(tool.domain).toBe('motor');
      expect(toolMatchesAgeBand(tool, 'early')).toBe(true);
    });
  });

  it('searches across article and hamza variations', () => {
    // في المصدر «أشهر تطبيق للتواصل البديل»
    const aac = filterTools({ query: 'التواصل البديل' });
    expect(aac.length).toBeGreaterThan(0);
    expect(aac.some((tool) => tool.toolName === 'Proloquo2Go')).toBe(true);
    expect(filterTools({ query: 'الاجتماعيه' }).length).toBeGreaterThan(0);
    expect(filterTools({ query: 'toca' }).length).toBeGreaterThan(0);
  });

  it('returns nothing for an unmatched query', () => {
    expect(filterTools({ query: 'زغردة الفيلة' })).toHaveLength(0);
  });

  it('treats «all» as no filter', () => {
    const results = filterTools({
      domain: 'all',
      ageBand: 'all',
      platform: 'all',
    });
    expect(results).toHaveLength(AUTISM_TOOLS_BANK.length);
  });
});

describe('language support', () => {
  it('marks Avaz and TouchChat as Arabic-supporting', () => {
    const avaz = AUTISM_TOOLS_BANK.find((tool) => tool.toolName === 'Avaz');
    const touchChat = AUTISM_TOOLS_BANK.find(
      (tool) => tool.toolName === 'TouchChat'
    );
    expect(avaz?.languageSupport).toBe('ar');
    expect(touchChat?.languageSupport).toBe('ar');
    expect(avaz && supportsArabic(avaz)).toBe(true);
  });

  it('keeps English-only curriculum apps out of the Arabic filter', () => {
    const starfall = AUTISM_TOOLS_BANK.find(
      (tool) => tool.toolName === 'Starfall'
    );
    expect(starfall?.languageSupport).toBe('en');
    expect(starfall && supportsArabic(starfall)).toBe(false);
  });

  it('carries the Arabic-designed apps inside the bank', () => {
    ARABIC_NATIVE_TOOLS.forEach((tool) => {
      expect(tool.languageSupport).toBe('ar');
      expect(AUTISM_TOOLS_BANK).toContain(tool);
    });

    const names = AUTISM_TOOLS_BANK.map((tool) => tool.toolName);
    expect(names).toContain('تطبيق أمل (Amal AAC)');
    expect(names).toContain('تطبيق كلمة (Kalima)');
    expect(names).toContain('تطبيق جدولي البصري');
    expect(names).toContain('عد الحروف والأرقام العربية');
  });

  it('puts Arabic-designed apps ahead of bilingual ones when filtering', () => {
    const arabicFirst = filterTools({ arabicOnly: true });
    const lastArabic = arabicFirst.reduce(
      (last, tool, index) => (tool.languageSupport === 'ar' ? index : last),
      -1
    );
    const firstBilingual = arabicFirst.findIndex(
      (tool) => tool.languageSupport === 'bilingual'
    );
    expect(lastArabic).toBeLessThan(firstBilingual);
  });

  it('keeps the Arabic additions reachable through the filters', () => {
    const arabicComms = filterTools({
      domain: 'communication',
      arabicOnly: true,
    });
    expect(arabicComms.some((tool) => tool.toolName.includes('أمل'))).toBe(true);

    const routine = filterTools({ domain: 'life_skills', arabicOnly: true });
    expect(routine.some((tool) => tool.toolName === 'تطبيق جدولي البصري')).toBe(
      true
    );
  });

  it('marks multi-language AAC apps as bilingual', () => {
    const letMeTalk = AUTISM_TOOLS_BANK.find(
      (tool) => tool.toolName === 'Let Me Talk'
    );
    expect(letMeTalk?.languageSupport).toBe('bilingual');
    expect(letMeTalk && supportsArabic(letMeTalk)).toBe(true);
  });

  it('filters to Arabic-supporting tools in one tap', () => {
    const results = filterTools({ arabicOnly: true });
    expect(results.length).toBe(arabicSupportingCount());
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((tool) => tool.toolName === 'Avaz')).toBe(true);
    expect(results.some((tool) => tool.toolName === 'Starfall')).toBe(false);
    results.forEach((tool) => expect(supportsArabic(tool)).toBe(true));
  });
});

describe('recommendToolsForGoal', () => {
  it('suggests vocabulary tools for a matching goal', () => {
    const tools = recommendToolsForGoal('أن يطابق الطالب بين الحيوانات الأليفة');
    expect(tools.length).toBe(4);
    expect(tools[0].domain).toBe('communication');
    expect(tools[0].goalCategory).toContain('المفردات');
  });

  it('suggests emotion tools for an emotions goal', () => {
    const tools = recommendToolsForGoal(
      'أن يتعرف الطفل على المشاعر الأساسية ويسميها'
    );
    expect(tools[0].domain).toBe('emotional_behavioral');
    expect(tools[0].goalCategory).toContain('المشاعر');
  });

  it('suggests visual-schedule tools for a self-care goal', () => {
    const tools = recommendToolsForGoal(
      'أن يستقل الطفل في تنظيف أسنانه وفق جدول مرئي'
    );
    tools.forEach((tool) => expect(tool.domain).toBe('life_skills'));
  });

  it('stays inside the sensory domain for a sensory goal', () => {
    const tools = recommendToolsForGoal(
      'أن يتكيف الطفل مع الأصوات العالية في المحيط'
    );
    expect(tools.length).toBe(4);
    tools.forEach((tool) =>
      expect(['sensory', 'emotional_behavioral']).toContain(tool.domain)
    );
  });

  it('prefers the requested level in the top picks', () => {
    const tools = recommendToolsForGoal(
      'أن يتعرف الطفل على المشاعر الأساسية',
      'مبتدئ'
    );
    expect(tools.slice(0, 3).every((tool) => tool.level.includes('مبتدئ'))).toBe(
      true
    );
  });

  it('never repeats the same app twice', () => {
    const tools = recommendToolsForGoal('أن يتأقلم الطفل مع تغيير الروتين', '', 8);
    const names = tools.map((tool) => tool.toolName);
    expect(new Set(names).size).toBe(names.length);
  });

  it('respects the limit and handles empty input', () => {
    expect(recommendToolsForGoal('أن يسمي الطفل الأدوات', undefined, 2)).toHaveLength(2);
    expect(recommendToolsForGoal('')).toHaveLength(0);
    expect(recommendToolsForGoal('أن يسمي الطفل الأدوات', undefined, 0)).toHaveLength(0);
  });

  it('still recommends something for a vague goal', () => {
    const tools = recommendToolsForGoal('هدف عام بدون كلمات دالة');
    expect(tools.length).toBe(4);
  });
});

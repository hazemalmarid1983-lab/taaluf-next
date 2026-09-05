export type LanguageSupport = 'ar' | 'en' | 'bilingual';

type ToolLanguageInput = {
  toolName: string;
  description: string;
  notes: string;
};

/**
 * تطبيقات AAC أو منتجات مصمّمة بدعم عربي صريح في المصدر.
 * الشارة الخضراء في الواجهة تعتمد على supportsArabic() لا على هذا المستوى وحده.
 */
const ARABIC_PRIMARY = new Set(['avaz', 'touchchat']);

/**
 * تطبيقات موثّقة بدعم واجهة أو أصوات عربية ضمن لغات متعددة.
 * تُحدَّث هنا عند إعادة الاستيراد — لا تُكتب يدوياً في الملف المولّد.
 */
const BILINGUAL_NAMES = new Set([
  'let me talk',
  'otsimo',
  'otsimo | fine motor',
  'otsimo | sensory',
  'classdojo',
  'seesaw',
  'quizlet',
  'kahoot!',
  'scratch',
  'photomath',
  'google calendar',
  'google jamboard',
  'google street view',
  'minecraft',
  'minecraft education',
  'roblox',
  'youtube kids',
  'netflix jr.',
  'amazon kids+',
  'pokémon go',
  'chess.com',
  'letterschool',
  'writing wizard',
]);

function nameKey(name: string) {
  return name.trim().toLowerCase();
}

const ARABIC_MENTION =
  /يدعم العربية|دعم العربية|اللغة العربية|لغات منها العربية|\barabic\b/i;

/**
 * يصنّف وسيلة حسب دعم اللغة:
 * ar = دعم عربي صريح (مثل Avaz وTouchChat)
 * bilingual = عربي ضمن لغات متعددة
 * en = محتوى أو واجهة إنجليزية فقط
 */
export function classifyLanguageSupport(
  tool: ToolLanguageInput
): LanguageSupport {
  const name = nameKey(tool.toolName);
  const mentioned = ARABIC_MENTION.test(`${tool.notes} ${tool.description}`);

  if (ARABIC_PRIMARY.has(name) || mentioned) return 'ar';
  if (BILINGUAL_NAMES.has(name)) return 'bilingual';
  if (name.startsWith('otsimo')) return 'bilingual';
  return 'en';
}

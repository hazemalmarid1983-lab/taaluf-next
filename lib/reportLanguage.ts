/**
 * سياسة اللغة التربوية — منقولة من taaluf/src/lib/reportEngine.js
 * وتُطبَّق على AI وPDF وواجهة النتيجة.
 */

export const REPORT_SYSTEM_PERSONA_AR =
  'أنت مساعد متخصص في التقييم التربوي والسلوكي للأطفال على منصة تآلف. يجب أن تكون جميع توصياتك قابلة للتطبيق في البيئة المدرسية والمنزلية. ممنوع تماماً إصدار توصيات طبية أو نفسية مباشرة (مثل مراجعة طبيب نفسي) في التقرير النهائي، وبدلاً من ذلك قدّم استراتيجيات تربوية تدريجية وملامح سلوكية قابلة للملاحظة.';

export {
  DISCLAIMER_AR as REPORT_DISCLAIMER_AR,
  CLOSING_NEXT_STEP_AR as REPORT_EDU_CLOSING_AR,
} from '@/lib/content';

/** إزالة صياغات تشخيصية وإحالات طبية/نفسية مباشرة */
export function sanitizeDiagnosticLanguage(text = '') {
  let out = String(text);
  const replacements: Array<[RegExp, string]> = [
    [/الطفل مصاب بالتوحد/gi, 'يظهر الطفل ملامح تتوافق مع اضطراب طيف التوحد'],
    [/مصاب بـ?التوحد/gi, 'يظهر ملامح تتوافق مع اضطراب طيف التوحد'],
    [/تشخيص التوحد/gi, 'ملامح تتوافق مع اضطراب طيف التوحد'],
    [/يُشخص|يشخّص|يشخص/gi, 'يُوصَف تربوياً'],
    [/مراجعة طبيب نفسي/gi, 'تعزيز استراتيجيات تربوية في المنزل والمدرسة'],
    [/مراجعة طبيب/gi, 'متابعة تربوية منظّمة'],
    [/علاج دوائي|دواء|أدوية/gi, 'استراتيجية تربوية تدريجية'],
    [/تحويل (إلى|الى) عيادة/gi, 'خطة تدخل تربوي في الصف والمنزل'],
  ];
  for (const [re, to] of replacements) out = out.replace(re, to);
  return out;
}

export function sanitizeAiPayload<T extends Record<string, unknown>>(payload: T): T {
  const clone = structuredClone(payload) as Record<string, unknown>;
  const walk = (value: unknown): unknown => {
    if (typeof value === 'string') return sanitizeDiagnosticLanguage(value);
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      const obj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        obj[k] = walk(v);
      }
      return obj;
    }
    return value;
  };
  return walk(clone) as T;
}

/**
 * محاور المؤشرات الوظيفية الأكاديمية — معرّفات ووصف محايد بدل التسميات التشخيصية الطبية.
 * كل مخرجات الفرز والتقييم الأكاديمي تعرض FUNCTIONAL_INDICATOR_DISCLAIMER.
 */

export type FunctionalIndicatorDomain =
  | 'reading_decoding'
  | 'written_expression'
  | 'numeracy_processing'
  | 'attention_focus';

export const FUNCTIONAL_INDICATOR_DOMAINS: readonly FunctionalIndicatorDomain[] = [
  'reading_decoding',
  'written_expression',
  'numeracy_processing',
  'attention_focus',
];

/** الوصف الوظيفي للمحور كما يظهر في مخرجات النتائج */
export const FUNCTIONAL_INDICATOR_LABELS: Readonly<
  Record<FunctionalIndicatorDomain, { ar: string; en: string }>
> = {
  reading_decoding: {
    ar: 'مؤشرات صعوبة في القراءة والفك الرمزي',
    en: 'Indicators of difficulty in reading and decoding',
  },
  written_expression: {
    ar: 'مؤشرات صعوبة في الكتابة والتعبير الكتابي',
    en: 'Indicators of difficulty in writing and written expression',
  },
  numeracy_processing: {
    ar: 'مؤشرات صعوبة في المعالجة الحسابية',
    en: 'Indicators of difficulty in numerical processing',
  },
  attention_focus: {
    ar: 'ملاحظات الانتباه والتركيز',
    en: 'Attention and focus observations',
  },
};

export const FUNCTIONAL_INDICATOR_DISCLAIMER_AR =
  'نتائج مؤشرات وظيفية لأغراض التخطيط التربوي وليست تشخيصاً طبياً أو نفسياً معتمداً.';
export const FUNCTIONAL_INDICATOR_DISCLAIMER_EN =
  'Functional indicator results for educational planning only — not an accredited medical or psychological diagnosis.';

export function functionalIndicatorDisclaimer(lang: 'ar' | 'en' = 'ar'): string {
  return lang === 'en' ? FUNCTIONAL_INDICATOR_DISCLAIMER_EN : FUNCTIONAL_INDICATOR_DISCLAIMER_AR;
}

/** مفاتيح محفوظة في نتائج قديمة (localStorage / قاعدة البيانات) */
const LEGACY_DOMAIN_KEYS: Readonly<Record<string, FunctionalIndicatorDomain>> = {
  dyslexia: 'reading_decoding',
  dysgraphia: 'written_expression',
  dyscalculia: 'numeracy_processing',
  executive_adhd: 'attention_focus',
};

export function normalizeFunctionalDomainKey(key: string): string {
  return LEGACY_DOMAIN_KEYS[key] ?? key;
}

/** يعيد تسمية مفاتيح السجل وحقل domain داخل كل عنصر من المفاتيح القديمة إلى الحالية */
export function normalizeDomainKeyedRecord<T extends { domain?: string }>(
  record: Record<string, T> | undefined | null
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [key, value] of Object.entries(record ?? {})) {
    const next = normalizeFunctionalDomainKey(key);
    out[next] =
      value && typeof value === 'object' && typeof value.domain === 'string'
        ? { ...value, domain: normalizeFunctionalDomainKey(value.domain) }
        : value;
  }
  return out;
}

import screeningData from '@/data/taalof_screening.json';

export type ScreeningAnswer = { id: string; value: number };

export type ScreeningDimensionScore = {
  dimension: string;
  label_ar: string;
  raw: number;
  max: number;
  scorePercent: number;
};

export type ScreeningResult = {
  domainScores: ScreeningDimensionScore[];
  overall: number;
  band: 'balanced' | 'moderate' | 'elevated';
  recommendFullAssessment: boolean;
};

export const SCREENING_ITEMS = screeningData.items;
export const SCREENING_LIKERT = screeningData.likert;
export const SCREENING_DIMENSIONS = screeningData.dimensions;
export const SCREENING_THRESHOLDS = {
  moderate: 25,
  elevated: 50,
} as const;

const DIMENSIONS = SCREENING_DIMENSIONS.map((d) => d.id);

const LABELS: Record<string, string> = Object.fromEntries(
  SCREENING_DIMENSIONS.map((d) => [d.id, d.label_ar])
);

const CANON_COMM = 'التواصل الاستجابي والتعبيري';
const CANON_SOCIAL = 'التفاعل والاندماج الاجتماعي واللعب';
const CANON_COG = 'النمو المعرفي والحلول الإدراكية';
const CANON_ADAPT = 'السلوك والتكيف والحواس واستقلالية الذات';

/** تحويل الأسماء القديمة/المختصرة والمعرّفات الداخلية إلى Canon 4.0 */
export const DOMAIN_NAME_MAP: Record<string, string> = {
  لغوي: CANON_COMM,
  linguistic: CANON_COMM,
  'النطق والتخاطب': CANON_COMM,
  [CANON_COMM]: CANON_COMM,
  سلوكي: CANON_SOCIAL,
  behavioral: CANON_SOCIAL,
  'التربية الخاصة': CANON_SOCIAL,
  'التفاعل والاندماج واللعب': CANON_SOCIAL,
  [CANON_SOCIAL]: CANON_SOCIAL,
  معرفي: CANON_COG,
  cognitive: CANON_COG,
  'النمو المعرفي والإدراكي': CANON_COG,
  [CANON_COG]: CANON_COG,
  حركي: CANON_ADAPT,
  motor: CANON_ADAPT,
  'السلوك والتكيف والحواس': CANON_ADAPT,
  [CANON_ADAPT]: CANON_ADAPT,
};

export function canonicalScreeningDomainLabel(name?: string | null): string {
  if (!name) return CANON_COMM;
  return DOMAIN_NAME_MAP[name] || name;
}

export function normalizeScreeningResult(result: ScreeningResult): ScreeningResult {
  return {
    ...result,
    domainScores: result.domainScores.map((d) => ({
      ...d,
      label_ar: canonicalScreeningDomainLabel(d.label_ar || d.dimension),
    })),
  };
}

/** توصيات منزلية فورية حسب المحور الأعلى احتياجاً (Canon 4.0) */
export const IMMEDIATE_TIPS: Record<string, { title: string; tip: string }> = {
  'التواصل الاستجابي والتعبيري': {
    title: 'تطوير مهارة الطلب والتعبير اليومي',
    tip: 'جرّب وضع الألعاب أو الوجبات المفضلة في مجال رؤية طفلك وبعيداً عن متناول يده، وانتظر 3 ثوانٍ قبل تقديمها لتحفيز الإشارة أو الطلب بكلمة بدلاً من سحب اليد.',
  },
  'التفاعل والاندماج الاجتماعي واللعب': {
    title: 'تعزيز الانتباه المشترك والتواصل البصري',
    tip: 'اجلس بمستوى عيني طفلك مباشرة أثناء نشاط يحبه، وقلّد إحدى حركاته مع ابتسامة واضحة ثم توقف وانتظر نظرة عينيه قبل إكمال اللعبة بالتناوب.',
  },
  'النمو المعرفي والحلول الإدراكية': {
    title: 'تطوير مهارات المطابقة والتمييز',
    tip: 'استخدم أدوات المطبخ اليومية (مثل الملاعق أو الأكواب الملونة) وشجع طفلك على فرزها في مجموعتين متشابهتين كنشاط لعب يومي مرح.',
  },
  'السلوك والتكيف والحواس واستقلالية الذات': {
    title: 'دعم الروتين والمرونة والانتقال',
    tip: 'استخدم بطاقتين مصورتين للنشاط الحالي والنشاط التالي (مثلاً: صورة الحذاء ثم صورة الحديقة) لتنبيه طفلك قبل الانتقال بدقيقتين لتجنب الانزعاج.',
  },
};

export function getImmediateScreeningTip(result: ScreeningResult) {
  const top = [...result.domainScores].sort(
    (a, b) => b.scorePercent - a.scorePercent
  )[0];
  const key = canonicalScreeningDomainLabel(
    top?.label_ar || top?.dimension || LABELS.linguistic
  );
  return {
    domain: key,
    percentage: top?.scorePercent ?? 0,
    ...(IMMEDIATE_TIPS[key] || IMMEDIATE_TIPS[CANON_COMM]),
  };
}

/** مقياس موحّد 0–3 (مستقر → شديد جداً؛ أعلى = حاجة دعم أكبر) */
function concernValue(raw: number): number {
  return Math.min(3, Math.max(0, Number(raw) || 0));
}

export type ScreeningOption = {
  score: number;
  label: string;
  description: string;
};

export function calculateScreening(answers: ScreeningAnswer[]): ScreeningResult {
  const byId = new Map(answers.map((a) => [a.id, a.value]));

  const domainScores: ScreeningDimensionScore[] = DIMENSIONS.map((dim) => {
    const items = SCREENING_ITEMS.filter((i) => i.dimension === dim);
    let raw = 0;
    let max = 0;
    for (const item of items) {
      const value = byId.has(item.id) ? concernValue(byId.get(item.id)!) : 0;
      raw += value * (item.weight || 1);
      max += 3 * (item.weight || 1);
    }
    const scorePercent = max > 0 ? Math.round((raw / max) * 100) : 0;
    return {
      dimension: dim,
      label_ar: LABELS[dim] || dim,
      raw,
      max,
      scorePercent,
    };
  });

  let total = 0;
  let totalMax = 0;
  for (const item of SCREENING_ITEMS) {
    const value = byId.has(item.id) ? concernValue(byId.get(item.id)!) : 0;
    total += value;
    totalMax += 3;
  }

  const overall =
    totalMax > 0 ? Math.round((total / totalMax) * 100) : 0;
  const band: ScreeningResult['band'] =
    overall < SCREENING_THRESHOLDS.moderate
      ? 'balanced'
      : overall < SCREENING_THRESHOLDS.elevated
        ? 'moderate'
        : 'elevated';

  return {
    domainScores,
    overall,
    band,
    recommendFullAssessment: band === 'elevated',
  };
}

export function bandLabelAr(band: ScreeningResult['band']) {
  if (band === 'balanced') return 'متوازن';
  if (band === 'moderate') return 'متوسط';
  return 'مرتفع';
}

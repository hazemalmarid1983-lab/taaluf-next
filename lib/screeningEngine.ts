import screeningData from '@/data/taalof_screening.json';

export type ScreeningAnswer = { id: string; value: number };

export type ScreeningDimensionScore = {
  dimension: string;
  label_ar: string;
  raw: number;
  max: number;
  scorePercent: number;
};

export type ScreeningReferralReason =
  | { kind: 'overall'; label_ar: string }
  | { kind: 'red_flag'; itemId: string; label_ar: string }
  | { kind: 'domain'; dimension: string; label_ar: string };

export type ScreeningResult = {
  domainScores: ScreeningDimensionScore[];
  overall: number;
  band: 'balanced' | 'moderate' | 'elevated';
  recommendFullAssessment: boolean;
  /** بنود الإنذار المبكر التي بلغت عتبتها (غائبة في نتائج محفوظة قبل v2.1) */
  redFlags?: string[];
  referralReasons?: ScreeningReferralReason[];
};

export const SCREENING_ITEMS = screeningData.items;
export const SCREENING_LIKERT = screeningData.likert;
export const SCREENING_DIMENSIONS = screeningData.dimensions;
export const SCREENING_THRESHOLDS = {
  moderate: 25,
  elevated: 50,
} as const;

/**
 * بنود الإنذار المبكر: درجة شديدة في أي منها توصي بالتقييم الشامل
 * مهما كان المؤشر العام. مقترح للمراجعة العلمية.
 */
export const SCREENING_RED_FLAGS: ReadonlyArray<{
  itemId: string;
  minScore: number;
  label_ar: string;
}> = [
  { itemId: 'S8', minScore: 2, label_ar: 'ضعف الاستجابة عند المناداة بالاسم' },
  { itemId: 'S12', minScore: 2, label_ar: 'غياب الإشارة لمشاركة الاهتمام' },
  { itemId: 'S4', minScore: 2, label_ar: 'تجنب واضح للتواصل البصري' },
  { itemId: 'S1', minScore: 3, label_ar: 'غياب وسيلة مفهومة للتعبير عن الاحتياجات' },
  { itemId: 'S2', minScore: 3, label_ar: 'عدم الاستجابة للكلام الموجّه' },
];

/** محور واحد عند هذه النسبة أو أعلى يوصي بالتقييم الشامل */
export const SCREENING_DOMAIN_REFERRAL_PERCENT = 67;

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

  const redFlags = SCREENING_RED_FLAGS.filter(
    (f) => byId.has(f.itemId) && concernValue(byId.get(f.itemId)!) >= f.minScore
  );
  const referralReasons: ScreeningReferralReason[] = [
    ...redFlags.map((f) => ({ kind: 'red_flag' as const, itemId: f.itemId, label_ar: f.label_ar })),
    ...domainScores
      .filter((d) => d.scorePercent >= SCREENING_DOMAIN_REFERRAL_PERCENT)
      .map((d) => ({
        kind: 'domain' as const,
        dimension: d.dimension,
        label_ar: `ارتفاع ملحوظ في محور ${d.label_ar}`,
      })),
    ...(band === 'elevated'
      ? [{ kind: 'overall' as const, label_ar: 'المؤشر العام مرتفع' }]
      : []),
  ];

  return {
    domainScores,
    overall,
    band,
    recommendFullAssessment: referralReasons.length > 0,
    redFlags: redFlags.map((f) => f.itemId),
    referralReasons,
  };
}

export type ScreeningAnswersValidation =
  | { ok: true; answers: ScreeningAnswer[] }
  | { ok: false; error: 'MISSING_ITEMS' | 'UNKNOWN_ITEM' | 'DUPLICATE_ITEM' | 'INVALID_VALUE'; itemIds: string[] };

/** يشترط إجابة واحدة صحيحة (0–3) لكل بند من البنود الاثني عشر */
export function validateScreeningAnswers(input: unknown): ScreeningAnswersValidation {
  const list = Array.isArray(input) ? input : [];
  const known = new Set(SCREENING_ITEMS.map((i) => i.id));
  const seen = new Set<string>();
  const unknown: string[] = [];
  const duplicate: string[] = [];
  const invalid: string[] = [];
  const answers: ScreeningAnswer[] = [];
  for (const raw of list) {
    const id = String((raw as { id?: unknown })?.id ?? '');
    const value = (raw as { value?: unknown })?.value;
    if (!known.has(id)) {
      unknown.push(id);
      continue;
    }
    if (seen.has(id)) {
      duplicate.push(id);
      continue;
    }
    seen.add(id);
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 3) {
      invalid.push(id);
      continue;
    }
    answers.push({ id, value });
  }
  if (unknown.length) return { ok: false, error: 'UNKNOWN_ITEM', itemIds: unknown };
  if (duplicate.length) return { ok: false, error: 'DUPLICATE_ITEM', itemIds: duplicate };
  if (invalid.length) return { ok: false, error: 'INVALID_VALUE', itemIds: invalid };
  const missing = SCREENING_ITEMS.map((i) => i.id).filter((id) => !seen.has(id));
  if (missing.length) return { ok: false, error: 'MISSING_ITEMS', itemIds: missing };
  return { ok: true, answers };
}

export function bandLabelAr(band: ScreeningResult['band']) {
  if (band === 'balanced') return 'متوازن';
  if (band === 'moderate') return 'متوسط';
  return 'مرتفع';
}

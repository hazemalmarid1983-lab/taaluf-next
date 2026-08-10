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

const DIMENSIONS = ['linguistic', 'behavioral', 'cognitive', 'motor'] as const;

const LABELS: Record<string, string> = {
  linguistic: 'لغوي',
  behavioral: 'سلوكي',
  cognitive: 'معرفي',
  motor: 'حركي',
};

export const SCREENING_ITEMS = screeningData.items;
export const SCREENING_LIKERT = screeningData.likert;
export const SCREENING_DIMENSIONS = screeningData.dimensions;

/** Likert 0–3 كما هو (أعلى = مؤشر أعلى للحاجة حسب مقياس الفرز) */
function concernValue(raw: number): number {
  return Math.min(3, Math.max(0, Number(raw) || 0));
}

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
    overall < 25 ? 'balanced' : overall < 50 ? 'moderate' : 'elevated';

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

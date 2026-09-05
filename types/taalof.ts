/**
 * تعريفات TypeScript لمنصة تآلف
 * مصدر البيانات: data/taalof_criteria_v3.json (Canon 4.0-unified)
 */

import criteriaData from '@/data/taalof_criteria_v3.json';

export interface CriterionLevel {
  label: string;
  description: string;
}

export interface Criterion {
  id: string;
  name: string;
  /** عنوان معياري مرادف لـ name في Canon 4.0 */
  title?: string;
  domain: string;
  domain_en: string;
  /** نص السؤال الموحّد المعروض للمقيّم */
  question?: string;
  description: string;
  levels: Record<'0' | '1' | '2' | '3', CriterionLevel>;
  recommendation: string;
  /** هدف SMART التربوي التلقائي */
  autoGoal?: string;
  referralRecommendation?: string;
  weight: number;
  ageBands?: string[];
  is_reverse?: boolean;
  domain_raw?: string;
}

export interface Classification {
  label: string;
  min: number;
  max: number;
  color: string;
}

export interface AgeBandLabel {
  ar: string;
  en: string;
  months?: string;
}

export interface TaalofCriteriaData {
  version: string;
  platform: string;
  total_criteria: number;
  domains: string[];
  classifications: Classification[];
  criteria: Criterion[];
  ageBandLabels?: Record<string, AgeBandLabel>;
}

/** توافق مع محرك الدمج v3 */
export type TaalufCriterion = Criterion;

export type FusionSource = 'specialist' | 'parent' | 'game';

export type NeedLevel = 'مستقر' | 'متوسط' | 'شديد' | 'شديد جداً';

export type OverallClassification =
  | 'طبيعي'
  | 'خفيف'
  | 'متوسط'
  | 'شديد'
  | 'شديد جداً';

export interface FusedScoreResult {
  criterionId: string;
  fusedScore: number;
  sourcesUsed: FusionSource[];
  needLevel: NeedLevel;
}

export interface DomainScore {
  domain: string;
  score: number;
  percentage: number;
}

export interface AssessmentScore {
  criterionId: string;
  score: number; // 0-3
  specialistNotes?: string;
  aiNotes?: string;
  evidence?: string[];
}

export interface AssessmentResult {
  studentId: string;
  specialistId: string;
  assessmentDate: string;
  scores: AssessmentScore[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  classification: string;
  domainAverages: Record<string, number>;
  classificationMeta: Classification;
  ageBand?: string;
  aiAnalysis?: {
    analysis: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: {
      special_education: string;
      speech: string;
      psychological: string;
      occupational: string;
    };
    intervention_plan: string;
    confidence: number;
  };
}

export const TAALOF_CRITERIA: TaalofCriteriaData =
  criteriaData as TaalofCriteriaData;
export const CRITERIA_LIST: Criterion[] = TAALOF_CRITERIA.criteria;
export const DOMAINS: string[] = TAALOF_CRITERIA.domains;
export const CLASSIFICATIONS: Classification[] = TAALOF_CRITERIA.classifications;
export const AGE_BAND_LABELS: Record<string, AgeBandLabel> =
  TAALOF_CRITERIA.ageBandLabels || {
    '3-4': { ar: 'نبت', en: 'sprout' },
    '5-6': { ar: 'شتلة', en: 'seedling' },
    '7-9': { ar: 'ثمرة', en: 'fruit' },
    '10-12': { ar: 'نضج', en: 'ripeness' },
  };

export function getAgeBandLabel(ageBand: string): AgeBandLabel | undefined {
  return AGE_BAND_LABELS[ageBand];
}

export function getCriterionById(id: string): Criterion | undefined {
  return CRITERIA_LIST.find((c) => c.id === id);
}

export function getCriteriaByDomain(domain: string): Criterion[] {
  return CRITERIA_LIST.filter((c) => c.domain === domain);
}

export function getAgeBand(birthdate: string): string {
  const today = new Date();
  const birth = new Date(birthdate);
  const ageInMonths =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());
  const ageInYears = ageInMonths / 12;
  if (ageInYears < 5) return '3-4';
  if (ageInYears < 7) return '5-6';
  if (ageInYears < 10) return '7-9';
  return '10-12';
}

/** عندما يتوفر العمر بالسنوات فقط (بدون تاريخ ميلاد) */
export function getAgeBandFromYears(ageInYears: number): string {
  if (!Number.isFinite(ageInYears) || ageInYears < 5) return '3-4';
  if (ageInYears < 7) return '5-6';
  if (ageInYears < 10) return '7-9';
  return '10-12';
}

export function getActiveCriteria(ageBand: string) {
  return CRITERIA_LIST.filter((c) => c.ageBands?.includes(ageBand));
}

export function getClassification(percentage: number): Classification {
  const clamped = Math.min(100, Math.max(0, percentage));
  return (
    CLASSIFICATIONS.find((c) => clamped >= c.min && clamped <= c.max) ||
    CLASSIFICATIONS[CLASSIFICATIONS.length - 1]
  );
}

export function domainAverages(
  scores: AssessmentScore[],
  ageBand?: string
): Record<string, number> {
  const scoreMap = new Map(scores.map((s) => [s.criterionId, s.score]));
  const sums: Record<string, { total: number; count: number }> = {};
  const list = ageBand ? getActiveCriteria(ageBand) : CRITERIA_LIST;

  for (const criterion of list) {
    const raw = scoreMap.get(criterion.id);
    if (!Number.isFinite(raw)) continue;
    const score = Math.min(3, Math.max(0, Number(raw)));
    if (!sums[criterion.domain]) sums[criterion.domain] = { total: 0, count: 0 };
    sums[criterion.domain].total += score;
    sums[criterion.domain].count += 1;
  }

  const averages: Record<string, number> = {};
  for (const domain of DOMAINS) {
    const entry = sums[domain];
    averages[domain] = entry && entry.count > 0 ? entry.total / entry.count : 0;
  }
  return averages;
}

export function calculateAssessmentResult(
  scores: AssessmentScore[],
  ageBand: string
): AssessmentResult {
  const scoreMap = new Map(scores.map((s) => [s.criterionId, s.score]));
  const active = getActiveCriteria(ageBand);
  let totalScore = 0;
  let maxScore = 0;

  for (const criterion of active) {
    const raw = scoreMap.get(criterion.id);
    const score = Number.isFinite(raw) ? Math.min(3, Math.max(0, Number(raw))) : 0;
    totalScore += score * criterion.weight;
    maxScore += 3 * criterion.weight;
  }

  const percentage =
    maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const classificationMeta = getClassification(percentage);

  return {
    studentId: '',
    specialistId: '',
    assessmentDate: new Date().toISOString(),
    scores: scores.filter((s) => active.some((c) => c.id === s.criterionId)),
    totalScore,
    maxScore,
    percentage,
    classification: classificationMeta.label,
    domainAverages: domainAverages(scores, ageBand),
    classificationMeta,
    ageBand,
  };
}

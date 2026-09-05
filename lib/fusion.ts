import {
  CRITERIA_LIST,
  DOMAINS,
  getClassification,
  getCriterionById,
  type AssessmentResult,
  type DomainScore,
  type FusedScoreResult,
  type FusionSource,
  type NeedLevel,
  type OverallClassification,
  type TaalufCriterion,
} from '@/types/taalof';
import { readBubbleSeekerLocalResult } from '@/lib/bubbleSeeker';
import { readFriendFeederLocalResult } from '@/lib/friendFeeder';
import { readSensoryMatchingLocalResult } from '@/lib/sensoryMatching';

export type SourceScore = { criterionId: string; score: number };

export type FusedCriterionScore = {
  criterionId: string;
  fusedScore: number;
  sources: string[];
  domain?: string;
  needLevel?: NeedLevel;
};

/**
 * أوزان المصادر المعتمدة في تآلف (Canon 4.0-unified)
 * أخصائي: 2.0 | ألعاب: 1.5 | أهل: 1.0
 */
export const SOURCE_WEIGHTS: Record<FusionSource, number> = {
  specialist: 2.0,
  game: 1.5,
  parent: 1.0,
};

/** توافق مع الاستدعاءات القديمة */
export const WEIGHTS = SOURCE_WEIGHTS;

export const SOURCE_LABEL_AR: Record<string, string> = {
  specialist: 'أخصائي',
  parent: 'ولي أمر',
  game: 'ألعاب',
};

export interface CriterionAssessment {
  criterionId: string;
  source: FusionSource;
  score: number;
}

export interface CalculateFusionInput {
  criteria?: TaalufCriterion[];
  assessments: CriterionAssessment[];
}

export interface FusionSummary {
  fusedResults: Record<string, FusedScoreResult>;
  domainScores: DomainScore[];
  totalNeedPercentage: number;
  overallClassification: OverallClassification;
  suggestedReassessmentDays: number;
  /** false = تقييم أسري مستقل (أهل ± ألعاب بدون أخصائي) */
  hasSpecialistSource: boolean;
  mode: 'family' | 'comprehensive';
}

function clampScore(raw: number): number {
  return Math.min(3, Math.max(0, Number(raw) || 0));
}

export function needLevelFromFusedScore(score: number): NeedLevel {
  if (score >= 2.5) return 'شديد جداً';
  if (score >= 1.8) return 'شديد';
  if (score >= 0.8) return 'متوسط';
  return 'مستقر';
}

export function suggestedReassessmentDays(classification: string): number {
  if (classification === 'شديد جداً') return 14;
  if (classification === 'شديد') return 30;
  if (classification === 'متوسط') return 60;
  if (classification === 'خفيف') return 90;
  return 180;
}

function flattenSourceLists(params: {
  specialistScores?: SourceScore[];
  parentScores?: SourceScore[];
  gameScores?: SourceScore[];
}): CriterionAssessment[] {
  const out: CriterionAssessment[] = [];
  const add = (list: SourceScore[] | undefined, source: FusionSource) => {
    if (!list?.length) return;
    for (const row of list) {
      out.push({
        criterionId: row.criterionId,
        source,
        score: clampScore(row.score),
      });
    }
  };
  add(params.specialistScores, 'specialist');
  add(params.parentScores, 'parent');
  add(params.gameScores, 'game');
  return out;
}

/**
 * محرك الدمج الموزون v3.0
 * - تقييم أسري مستقل: أهل ± ألعاب دون أخصائي (النسبة من البنود المُقيَّمة فقط)
 * - تقييم مدمج شامل: أخصائي + أهل + ألعاب
 */
export function calculateFusion({
  criteria = CRITERIA_LIST,
  assessments,
}: CalculateFusionInput): FusionSummary {
  const fusedResults: Record<string, FusedScoreResult> = {};
  const grouped: Record<string, CriterionAssessment[]> = {};

  for (const item of assessments) {
    if (!grouped[item.criterionId]) grouped[item.criterionId] = [];
    grouped[item.criterionId].push({
      ...item,
      score: clampScore(item.score),
    });
  }

  let totalWeightedScoreSum = 0;
  let totalMaxWeightedSum = 0;
  let hasSpecialist = false;

  for (const criterion of criteria) {
    const rows = grouped[criterion.id] || [];

    if (rows.length === 0) {
      fusedResults[criterion.id] = {
        criterionId: criterion.id,
        fusedScore: 0,
        sourcesUsed: [],
        needLevel: 'مستقر',
      };
      continue;
    }

    let weightedSum = 0;
    let weightSum = 0;
    const sourcesUsed: FusionSource[] = [];

    for (const ass of rows) {
      if (ass.source === 'specialist') hasSpecialist = true;
      const weight = SOURCE_WEIGHTS[ass.source] ?? 1;
      weightedSum += ass.score * weight;
      weightSum += weight;
      if (!sourcesUsed.includes(ass.source)) sourcesUsed.push(ass.source);
    }

    const fusedScore =
      weightSum > 0 ? Math.round((weightedSum / weightSum) * 100) / 100 : 0;
    const criterionWeight = criterion.weight || 1;

    // البنود غير المُقيَّمة لا تُحسب في النسبة حتى لا يُخفَّف التقييم الأسري
    totalWeightedScoreSum += fusedScore * criterionWeight;
    totalMaxWeightedSum += 3 * criterionWeight;

    fusedResults[criterion.id] = {
      criterionId: criterion.id,
      fusedScore,
      sourcesUsed,
      needLevel: needLevelFromFusedScore(fusedScore),
    };
  }

  const totalNeedPercentage =
    totalMaxWeightedSum > 0
      ? Math.round((totalWeightedScoreSum / totalMaxWeightedSum) * 100)
      : 0;

  const classificationMeta = getClassification(totalNeedPercentage);
  const overallClassification =
    (classificationMeta.label as OverallClassification) || 'طبيعي';

  const domainsMap: Record<
    string,
    { totalScore: number; maxScore: number; count: number }
  > = {};

  for (const domain of DOMAINS) {
    domainsMap[domain] = { totalScore: 0, maxScore: 0, count: 0 };
  }

  for (const criterion of criteria) {
    const domain = criterion.domain || 'عام';
    if (!domainsMap[domain]) {
      domainsMap[domain] = { totalScore: 0, maxScore: 0, count: 0 };
    }
    const res = fusedResults[criterion.id];
    if (!res || res.sourcesUsed.length === 0) continue;
    domainsMap[domain].totalScore += res.fusedScore;
    domainsMap[domain].maxScore += 3;
    domainsMap[domain].count += 1;
  }

  const domainOrder = [...DOMAINS, ...Object.keys(domainsMap).filter((d) => !DOMAINS.includes(d))];
  const domainScores: DomainScore[] = domainOrder.map((domain) => {
    const data = domainsMap[domain];
    const percentage =
      data.maxScore > 0 ? Math.round((data.totalScore / data.maxScore) * 100) : 0;
    return {
      domain,
      score:
        data.count > 0
          ? Math.round((data.totalScore / data.count) * 10) / 10
          : 0,
      percentage,
    };
  });

  return {
    fusedResults,
    domainScores,
    totalNeedPercentage,
    overallClassification,
    suggestedReassessmentDays: suggestedReassessmentDays(overallClassification),
    hasSpecialistSource: hasSpecialist,
    mode: hasSpecialist ? 'comprehensive' : 'family',
  };
}

/**
 * دمج درجات الأخصائي + الأهل + الألعاب بمتوسط موزون.
 * غلاف متوافق مع الواجهات الحالية فوق calculateFusion.
 */
export function fuseAssessmentSources(params: {
  specialistScores?: SourceScore[];
  parentScores?: SourceScore[];
  gameScores?: SourceScore[];
}): FusedCriterionScore[] {
  const assessments = flattenSourceLists(params);
  if (assessments.length === 0) return [];

  const ids = new Set(assessments.map((a) => a.criterionId));
  const criteria = CRITERIA_LIST.filter((c) => ids.has(c.id));
  const extras = Array.from(ids)
    .filter((id) => !getCriterionById(id))
    .map(
      (id) =>
        ({
          id,
          name: id,
          domain: 'أخرى',
          domain_en: 'Other',
          description: '',
          levels: {
            '0': { label: 'مستقر', description: '' },
            '1': { label: 'متوسط', description: '' },
            '2': { label: 'شديد', description: '' },
            '3': { label: 'شديد جداً', description: '' },
          },
          recommendation: '',
          weight: 1,
        }) satisfies TaalufCriterion
    );

  const summary = calculateFusion({
    criteria: [...criteria, ...extras],
    assessments,
  });

  return Object.values(summary.fusedResults)
    .filter((row) => row.sourcesUsed.length > 0)
    .map((row) => ({
      criterionId: row.criterionId,
      fusedScore: row.fusedScore,
      sources: row.sourcesUsed,
      domain: getCriterionById(row.criterionId)?.domain,
      needLevel: row.needLevel,
    }));
}

export function domainSourcesFromFusion(
  fused: FusedCriterionScore[]
): Record<string, string[]> {
  const out: Record<string, Set<string>> = {};
  for (const row of fused) {
    const domain =
      row.domain || getCriterionById(row.criterionId)?.domain || 'أخرى';
    if (!out[domain]) out[domain] = new Set();
    for (const s of row.sources) out[domain].add(s);
  }
  const result: Record<string, string[]> = {};
  for (const [domain, set] of Object.entries(out)) {
    result[domain] = Array.from(set);
  }
  for (const c of CRITERIA_LIST) {
    if (!result[c.domain]) result[c.domain] = [];
  }
  return result;
}

/** تحويل نتيجة لعبة إلى درجات معايير مرتبطة */
function unitGameRate(value?: number) {
  if (value == null || Number.isNaN(Number(value))) return 0;
  const n = Number(value);
  if (n > 1) return Math.min(1, Math.max(0, n / 100));
  return Math.min(1, Math.max(0, n));
}

export function gameResultToCriteriaScores(params: {
  gameCode: string;
  imitationRate?: number;
  trackingAccuracy?: number;
  emotionAccuracy?: number;
  jointAttentionRate?: number;
  turnTakingRate?: number;
  accuracyRate?: number;
}): SourceScore[] {
  const scores: SourceScore[] = [];
  const isHero = params.gameCode === 'little_hero';
  if (params.gameCode === 'imitation' || isHero) {
    const rate = unitGameRate(params.imitationRate);
    const concern = Math.round((1 - rate) * 3);
    for (const id of ['C15', 'C16', 'C11']) {
      scores.push({ criterionId: id, score: concern });
    }
  }
  if (params.gameCode === 'visual_tracking' || isHero) {
    const acc = unitGameRate(params.trackingAccuracy);
    const concern = Math.round((1 - acc) * 3);
    for (const id of ['C11', 'C12']) {
      scores.push({ criterionId: id, score: concern });
    }
  }
  if (params.gameCode === 'bubble_seeker') {
    const acc = unitGameRate(
      params.trackingAccuracy ?? params.jointAttentionRate
    );
    const concern = Math.round((1 - acc) * 3);
    for (const id of ['C11', 'C12']) {
      scores.push({ criterionId: id, score: concern });
    }
  }
  if (params.gameCode === 'friend_feeder') {
    const acc = unitGameRate(params.turnTakingRate);
    const concern = Math.round((1 - acc) * 3);
    for (const id of ['C18', 'C19']) {
      scores.push({ criterionId: id, score: concern });
    }
  }
  if (params.gameCode === 'emotions' || isHero) {
    const acc = unitGameRate(params.emotionAccuracy);
    const concern = Math.round((1 - acc) * 3);
    for (const id of ['C17', 'C32']) {
      scores.push({ criterionId: id, score: concern });
    }
  }
  if (params.gameCode === 'emotion_mirror') {
    const acc = unitGameRate(params.emotionAccuracy);
    const concern = Math.round((1 - acc) * 3);
    for (const id of ['C12', 'C14']) {
      scores.push({ criterionId: id, score: concern });
    }
  }
  if (params.gameCode === 'letter_hunter') {
    const acc = unitGameRate(params.trackingAccuracy);
    const concern = Math.round((1 - acc) * 3);
    scores.push({ criterionId: 'C20', score: concern });
  }
  if (params.gameCode === 'sensory_matching') {
    const acc = unitGameRate(params.accuracyRate);
    const concern = Math.round((1 - acc) * 3);
    scores.push({ criterionId: 'C21', score: concern });
  }
  return scores;
}

export function loadStoredGameScores(childId?: string): SourceScore[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('taaluf.gameSessions.v1');
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    const filtered = childId
      ? list.filter((g: { childId?: string }) => g.childId === childId)
      : list;
    const out: SourceScore[] = [];
    for (const g of filtered) {
      out.push(
        ...gameResultToCriteriaScores({
          gameCode: String(g.gameCode || ''),
          imitationRate: g.metrics?.imitationRate,
          trackingAccuracy: g.metrics?.trackingAccuracy,
          emotionAccuracy: g.metrics?.emotionAccuracy,
          jointAttentionRate: g.metrics?.jointAttentionRate,
          turnTakingRate:
            g.metrics?.turnTakingRate ?? g.metrics?.turnTakingAccuracy,
          accuracyRate: g.metrics?.accuracyRate,
        })
      );
    }
    const extra = readBubbleSeekerLocalResult();
    if (extra && (!childId || extra.childId === childId)) {
      out.push(
        ...gameResultToCriteriaScores({
          gameCode: extra.gameId || 'bubble_seeker',
          trackingAccuracy: extra.metrics.trackingAccuracy,
          jointAttentionRate: extra.metrics.jointAttentionRate,
        })
      );
    }
    const feeder = readFriendFeederLocalResult();
    if (feeder && (!childId || feeder.childId === childId)) {
      out.push(
        ...gameResultToCriteriaScores({
          gameCode: feeder.gameId || 'friend_feeder',
          turnTakingRate:
            feeder.metrics.turnTakingAccuracy ?? feeder.metrics.turnTakingRate,
        })
      );
    }
    try {
      const mirrorRaw = localStorage.getItem('taaluf_game_emotion_mirror');
      const mirror = mirrorRaw ? JSON.parse(mirrorRaw) : null;
      if (
        mirror?.metrics &&
        (!childId || !mirror.childId || mirror.childId === childId)
      ) {
        out.push(
          ...gameResultToCriteriaScores({
            gameCode: mirror.gameId || 'emotion_mirror',
            emotionAccuracy: mirror.metrics.accuracyRate,
          })
        );
      }
    } catch {
      /* ignore */
    }
    try {
      const hunterRaw = localStorage.getItem('taaluf_game_letter_hunter');
      const hunter = hunterRaw ? JSON.parse(hunterRaw) : null;
      if (
        hunter?.metrics &&
        (!childId || !hunter.childId || hunter.childId === childId)
      ) {
        out.push(
          ...gameResultToCriteriaScores({
            gameCode: hunter.gameId || 'letter_hunter',
            trackingAccuracy: hunter.metrics.accuracyRate,
          })
        );
      }
    } catch {
      /* ignore */
    }
    const matching = readSensoryMatchingLocalResult();
    if (matching && (!childId || matching.childId === childId)) {
      out.push(
        ...gameResultToCriteriaScores({
          gameCode: matching.gameId || 'sensory_matching',
          accuracyRate: matching.metrics.accuracyRate,
        })
      );
    }
    const latest = new Map<string, number>();
    for (const s of out) latest.set(s.criterionId, s.score);
    return Array.from(latest.entries()).map(([criterionId, score]) => ({
      criterionId,
      score,
    }));
  } catch {
    return [];
  }
}

export function loadStoredParentScores(childId?: string): SourceScore[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('taaluf.parentAssessment.v1');
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    const row = childId
      ? list.find((r: { childId?: string }) => r.childId === childId)
      : list[0];
    if (!row?.mappedScores) return [];
    return (row.mappedScores as SourceScore[]).map((s) => ({
      criterionId: s.criterionId,
      score: s.score,
    }));
  } catch {
    return [];
  }
}

/** تقرير أسري من الأهل ± الألعاب دون درجات أخصائي — لا يكسّر أوزان الدمج */
export function familyResultFromStoredSources(childId?: string): {
  result: AssessmentResult;
  fusedScores: Array<{ criterionId: string; score: number }>;
  fused: FusedCriterionScore[];
} | null {
  const parentScores = loadStoredParentScores(childId);
  const gameScores = loadStoredGameScores(childId);
  if (!parentScores.length && !gameScores.length) return null;

  const assessments: CriterionAssessment[] = [
    ...parentScores.map((s) => ({
      criterionId: s.criterionId,
      source: 'parent' as const,
      score: s.score,
    })),
    ...gameScores.map((s) => ({
      criterionId: s.criterionId,
      source: 'game' as const,
      score: s.score,
    })),
  ];
  const summary = calculateFusion({ assessments });
  const fusedScores = Object.values(summary.fusedResults)
    .filter((r) => r.sourcesUsed.length > 0)
    .map((r) => ({ criterionId: r.criterionId, score: r.fusedScore }));
  const classificationMeta = getClassification(summary.totalNeedPercentage);

  return {
    result: {
      studentId: childId || '',
      specialistId: '',
      assessmentDate: new Date().toISOString(),
      scores: fusedScores,
      totalScore: fusedScores.reduce((sum, s) => sum + s.score, 0),
      maxScore: fusedScores.length * 3,
      percentage: summary.totalNeedPercentage,
      classification: summary.overallClassification,
      domainAverages: Object.fromEntries(
        summary.domainScores.map((d) => [d.domain, d.score])
      ),
      classificationMeta,
    },
    fusedScores,
    fused: fusedScores.map((s) => ({
      criterionId: s.criterionId,
      fusedScore: s.score,
      sources:
        summary.fusedResults[s.criterionId]?.sourcesUsed || [],
      domain: getCriterionById(s.criterionId)?.domain,
      needLevel: summary.fusedResults[s.criterionId]?.needLevel,
    })),
  };
}

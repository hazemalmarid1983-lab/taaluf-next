import { CRITERIA_LIST, getCriterionById } from '@/types/taalof';

export type SourceScore = { criterionId: string; score: number };

export type FusedCriterionScore = {
  criterionId: string;
  fusedScore: number;
  sources: string[];
  domain?: string;
};

const WEIGHTS = {
  specialist: 2,
  parent: 1,
  game: 1.5,
} as const;

/**
 * دمج درجات الأخصائي + الأهل + الألعاب بمتوسط موزون.
 */
export function fuseAssessmentSources(params: {
  specialistScores: SourceScore[];
  parentScores?: SourceScore[];
  gameScores?: SourceScore[];
}): FusedCriterionScore[] {
  const map = new Map<
    string,
    { weighted: number; weightSum: number; sources: string[] }
  >();

  const add = (
    list: SourceScore[] | undefined,
    source: 'specialist' | 'parent' | 'game'
  ) => {
    if (!list?.length) return;
    const w = WEIGHTS[source];
    for (const row of list) {
      const score = Math.min(3, Math.max(0, Number(row.score) || 0));
      const cur = map.get(row.criterionId) || {
        weighted: 0,
        weightSum: 0,
        sources: [],
      };
      cur.weighted += score * w;
      cur.weightSum += w;
      if (!cur.sources.includes(source)) cur.sources.push(source);
      map.set(row.criterionId, cur);
    }
  };

  add(params.specialistScores, 'specialist');
  add(params.parentScores, 'parent');
  add(params.gameScores, 'game');

  const ids = new Set<string>([
    ...params.specialistScores.map((s) => s.criterionId),
    ...(params.parentScores || []).map((s) => s.criterionId),
    ...(params.gameScores || []).map((s) => s.criterionId),
  ]);

  return Array.from(ids).map((criterionId) => {
    const entry = map.get(criterionId)!;
    const fusedScore =
      entry.weightSum > 0
        ? Math.round((entry.weighted / entry.weightSum) * 100) / 100
        : 0;
    return {
      criterionId,
      fusedScore,
      sources: entry.sources,
      domain: getCriterionById(criterionId)?.domain,
    };
  });
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
  // include all rubric domains for UI completeness
  for (const c of CRITERIA_LIST) {
    if (!result[c.domain]) result[c.domain] = [];
  }
  return result;
}

export const SOURCE_LABEL_AR: Record<string, string> = {
  specialist: 'أخصائي',
  parent: 'ولي أمر',
  game: 'ألعاب',
};

/** تحويل نتيجة لعبة إلى درجات معايير مرتبطة */
export function gameResultToCriteriaScores(params: {
  gameCode: string;
  imitationRate?: number;
  trackingAccuracy?: number;
}): SourceScore[] {
  const scores: SourceScore[] = [];
  if (params.gameCode === 'imitation') {
    const rate = Math.min(1, Math.max(0, params.imitationRate ?? 0));
    // معدل نجاح أعلى → حاجة أقل → درجة أقل
    const concern = Math.round((1 - rate) * 3);
    for (const id of ['C3', 'C4', 'C11']) {
      scores.push({ criterionId: id, score: concern });
    }
  }
  if (params.gameCode === 'visual_tracking') {
    const acc = Math.min(1, Math.max(0, params.trackingAccuracy ?? 0));
    const concern = Math.round((1 - acc) * 3);
    for (const id of ['C15', 'C9']) {
      scores.push({ criterionId: id, score: concern });
    }
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
        })
      );
    }
    // keep latest per criterion
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

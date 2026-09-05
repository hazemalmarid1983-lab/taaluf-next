/**
 * صائد الفقاعات — منطق الانتباه المشترك وتتبع الإشارة البصرية.
 * مؤشر تربوي (Canon 4.0) وليس تشخيصاً طبياً.
 */

export const BUBBLE_SEEKER_GAME_CODE = 'bubble_seeker' as const;
export const BUBBLE_SEEKER_TOTAL_ROUNDS = 8;
export const BUBBLE_SEEKER_CRITERIA = ['C11', 'C12'] as const;
export const BUBBLE_SEEKER_LOCAL_KEY = 'taaluf_game_bubble_seeker';
export const BUBBLE_SEEKER_PAGE = '/games/bubble-seeker';
export const BUBBLE_SEEKER_DOMAIN_LABEL = 'التواصل والاستجابة';

export type BubbleSeekerMetrics = {
  totalAttempts: number;
  jointAttentionSuccess: number;
  avgLatencyMs: number;
  /** 0–100 للعرض */
  jointAttentionRate: number;
  /** 0–1 للدمج مع المعايير */
  trackingAccuracy: number;
  linkedCriteria: string[];
  scoring: 'child_playable';
};

export type BubbleHitInput = {
  x: number;
  y: number;
  radius: number;
};

export function unitRate(value: number | undefined) {
  if (value == null || Number.isNaN(value)) return 0;
  const n = Number(value);
  if (n > 1) return Math.min(1, Math.max(0, n / 100));
  return Math.min(1, Math.max(0, n));
}

export function isBubbleHit(
  pointerX: number,
  pointerY: number,
  bubble: BubbleHitInput,
  padding = 15
) {
  const dx = pointerX - bubble.x;
  const dy = pointerY - bubble.y;
  return Math.hypot(dx, dy) <= bubble.radius + padding;
}

export function nearestHitIndex(
  pointerX: number,
  pointerY: number,
  bubbles: BubbleHitInput[],
  padding = 15
) {
  let best = -1;
  let bestDist = Infinity;
  bubbles.forEach((bubble, index) => {
    const dist = Math.hypot(pointerX - bubble.x, pointerY - bubble.y);
    if (dist <= bubble.radius + padding && dist < bestDist) {
      best = index;
      bestDist = dist;
    }
  });
  return best;
}

export function buildBubbleSeekerMetrics(params: {
  attempts: number;
  jointSuccesses: number;
  latencies: number[];
  totalRounds?: number;
}): BubbleSeekerMetrics {
  const totalRounds = params.totalRounds ?? BUBBLE_SEEKER_TOTAL_ROUNDS;
  const avgLatencyMs = params.latencies.length
    ? Math.round(
        params.latencies.reduce((sum, ms) => sum + ms, 0) /
          params.latencies.length
      )
    : 0;
  const trackingAccuracy = unitRate(
    params.jointSuccesses / Math.max(1, totalRounds)
  );
  return {
    totalAttempts: params.attempts,
    jointAttentionSuccess: params.jointSuccesses,
    avgLatencyMs,
    jointAttentionRate: Math.round(trackingAccuracy * 100),
    trackingAccuracy,
    linkedCriteria: [...BUBBLE_SEEKER_CRITERIA],
    scoring: 'child_playable',
  };
}

export type BubbleSeekerLocalResult = {
  gameId: typeof BUBBLE_SEEKER_GAME_CODE;
  domain: string;
  metrics: BubbleSeekerMetrics;
  completedAt: string;
  childId: string;
};

export function resolveActiveChildId(explicit?: string) {
  if (explicit) return explicit;
  if (typeof window === 'undefined') return 'child_local';
  try {
    const s = JSON.parse(localStorage.getItem('taaluf.activeStudent') || 'null');
    return s?.id || 'child_local';
  } catch {
    return 'child_local';
  }
}

/** يحفظ نتيجة الصفحة لربطها بالرادار وجلسات الألعاب المحلية */
export function persistBubbleSeekerLocalResult(
  metrics: BubbleSeekerMetrics,
  childId?: string
): BubbleSeekerLocalResult | null {
  if (typeof window === 'undefined') return null;
  const result: BubbleSeekerLocalResult = {
    gameId: BUBBLE_SEEKER_GAME_CODE,
    domain: BUBBLE_SEEKER_DOMAIN_LABEL,
    metrics,
    completedAt: new Date().toISOString(),
    childId: resolveActiveChildId(childId),
  };
  localStorage.setItem(BUBBLE_SEEKER_LOCAL_KEY, JSON.stringify(result));
  try {
    const key = 'taaluf.gameSessions.v1';
    const prev = JSON.parse(localStorage.getItem(key) || '[]');
    const list = Array.isArray(prev) ? prev : [];
    const session = {
      id: `local_${BUBBLE_SEEKER_GAME_CODE}`,
      childId: result.childId,
      gameCode: BUBBLE_SEEKER_GAME_CODE,
      score: metrics.jointAttentionSuccess * 10,
      levelReached: BUBBLE_SEEKER_TOTAL_ROUNDS,
      metrics,
      trials: [],
      startedAt: result.completedAt,
      endedAt: result.completedAt,
    };
    localStorage.setItem(
      key,
      JSON.stringify([session, ...list].slice(0, 40))
    );
  } catch {
    /* ignore quota / private mode */
  }
  return result;
}

export function readBubbleSeekerLocalResult(): BubbleSeekerLocalResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BUBBLE_SEEKER_LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BubbleSeekerLocalResult;
    if (!parsed?.metrics) return null;
    return parsed;
  } catch {
    return null;
  }
}

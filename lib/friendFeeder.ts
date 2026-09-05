/**
 * إطعام صديق الغابة — تبادل الأدوار وانتظار الدور.
 * Canon: C18 اللعب التعاوني، C19 انتظار الدور.
 * (C21/C22 في Canon 4.0 للمطابقة والألوان وليستا لتبادل الأدوار.)
 * مؤشر تربوي وليس تشخيصاً طبياً.
 */

export const FRIEND_FEEDER_GAME_CODE = 'friend_feeder' as const;
export const FRIEND_FEEDER_TOTAL_ROUNDS = 6;
export const FRIEND_FEEDER_CRITERIA = ['C18', 'C19'] as const;
export const FRIEND_FEEDER_LOCAL_KEY = 'taaluf_game_friend_feeder';
export const FRIEND_FEEDER_PAGE = '/games/friend-feeder';
export const FRIEND_FEEDER_DOMAIN_LABEL = 'التفاعل والاندماج الاجتماعي واللعب';

export type FriendFeederMetrics = {
  totalRounds: number;
  impulsiveClicksDuringFriendTurn: number;
  successfulTurnCompletions: number;
  /** 0–100 للعرض */
  turnTakingRate: number;
  /** 0–1 للدمج */
  turnTakingAccuracy: number;
  linkedCriteria: string[];
  scoring: 'child_playable';
};

export type TurnTakingMetrics = FriendFeederMetrics;

export function unitRate(value: number | undefined) {
  if (value == null || Number.isNaN(value)) return 0;
  const n = Number(value);
  if (n > 1) return Math.min(1, Math.max(0, n / 100));
  return Math.min(1, Math.max(0, n));
}

export function buildFriendFeederMetrics(params: {
  successfulWaits: number;
  impulsiveClicks: number;
  totalRounds?: number;
}): FriendFeederMetrics {
  const totalRounds = params.totalRounds ?? FRIEND_FEEDER_TOTAL_ROUNDS;
  const waitRate = unitRate(params.successfulWaits / Math.max(1, totalRounds));
  const impulseControl = Math.max(
    0,
    1 - params.impulsiveClicks / Math.max(1, totalRounds * 2)
  );
  const turnTakingAccuracy = unitRate((waitRate + impulseControl) / 2);
  return {
    totalRounds,
    impulsiveClicksDuringFriendTurn: params.impulsiveClicks,
    successfulTurnCompletions: params.successfulWaits,
    turnTakingRate: Math.round(turnTakingAccuracy * 100),
    turnTakingAccuracy,
    linkedCriteria: [...FRIEND_FEEDER_CRITERIA],
    scoring: 'child_playable',
  };
}

export type FriendFeederLocalResult = {
  gameId: typeof FRIEND_FEEDER_GAME_CODE;
  domain: string;
  metrics: FriendFeederMetrics;
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

export function persistFriendFeederLocalResult(
  metrics: FriendFeederMetrics,
  childId?: string
): FriendFeederLocalResult | null {
  if (typeof window === 'undefined') return null;
  const result: FriendFeederLocalResult = {
    gameId: FRIEND_FEEDER_GAME_CODE,
    domain: FRIEND_FEEDER_DOMAIN_LABEL,
    metrics,
    completedAt: new Date().toISOString(),
    childId: resolveActiveChildId(childId),
  };
  localStorage.setItem(FRIEND_FEEDER_LOCAL_KEY, JSON.stringify(result));
  try {
    const key = 'taaluf.gameSessions.v1';
    const prev = JSON.parse(localStorage.getItem(key) || '[]');
    const list = Array.isArray(prev) ? prev : [];
    const session = {
      id: `local_${FRIEND_FEEDER_GAME_CODE}`,
      childId: result.childId,
      gameCode: FRIEND_FEEDER_GAME_CODE,
      score: metrics.successfulTurnCompletions * 15,
      levelReached: FRIEND_FEEDER_TOTAL_ROUNDS,
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
    /* ignore */
  }
  return result;
}

export function readFriendFeederLocalResult(): FriendFeederLocalResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FRIEND_FEEDER_LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FriendFeederLocalResult;
    if (!parsed?.metrics) return null;
    return parsed;
  } catch {
    return null;
  }
}

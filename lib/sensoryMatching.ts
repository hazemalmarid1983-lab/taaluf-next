export const SENSORY_MATCHING_GAME_CODE = 'sensory_matching' as const;
export const SENSORY_MATCHING_LOCAL_KEY = 'taaluf_game_sensory_matching';
export const SENSORY_MATCHING_PAGE = '/sensory-matching';
export const SENSORY_MATCHING_DOMAIN_LABEL = 'مطابقة الصور والتصنيف';
export const SENSORY_MATCHING_CRITERIA = ['C21'] as const;

export const IDENTICAL_ROUND_COUNT = 8;
export const CATEGORY_ROUND_COUNT = 6;
export const SENSORY_MATCHING_TOTAL_ROUNDS =
  IDENTICAL_ROUND_COUNT + CATEGORY_ROUND_COUNT;

export type MatchCategory = 'animals' | 'fruits' | 'tools' | 'transport';
export type MatchMode = 'identical' | 'category';

export type MatchItem = {
  id: string;
  category: MatchCategory;
  nameAr: string;
  nameEn: string;
  emoji: string;
  tint: string;
};

export type MatchRound = {
  index: number;
  mode: MatchMode;
  prompt: MatchItem;
  choices: MatchItem[];
  correctId: string;
};

export type SensoryMatchingMetrics = {
  gameCode: typeof SENSORY_MATCHING_GAME_CODE;
  roundsCompleted: number;
  correctAttempts: number;
  totalAttempts: number;
  firstTryCorrect: number;
  avgResponseMs: number;
  accuracyRate: number;
  levelReached: MatchMode;
  linkedCriteria: string[];
  scoring: 'child_playable';
};

export const CATEGORY_LABEL_AR: Record<MatchCategory, string> = {
  animals: 'حيوانات',
  fruits: 'فواكه',
  tools: 'أدوات يومية',
  transport: 'وسائل نقل',
};

/** أيقونة المجموعة — لا تُستخدم كجواب */
export const CATEGORY_EMOJI: Record<MatchCategory, string> = {
  animals: '🐾',
  fruits: '🍇',
  tools: '🏠',
  transport: '🚗',
};

export const MATCH_ITEMS: MatchItem[] = [
  { id: 'cat', category: 'animals', nameAr: 'قطة', nameEn: 'cat', emoji: '🐱', tint: 'from-orange-100 to-amber-50' },
  { id: 'dog', category: 'animals', nameAr: 'كلب', nameEn: 'dog', emoji: '🐶', tint: 'from-amber-100 to-yellow-50' },
  { id: 'bird', category: 'animals', nameAr: 'عصفور', nameEn: 'bird', emoji: '🐦', tint: 'from-sky-100 to-cyan-50' },
  { id: 'fish', category: 'animals', nameAr: 'سمكة', nameEn: 'fish', emoji: '🐟', tint: 'from-cyan-100 to-teal-50' },
  { id: 'rabbit', category: 'animals', nameAr: 'أرنب', nameEn: 'rabbit', emoji: '🐰', tint: 'from-rose-100 to-pink-50' },
  { id: 'lion', category: 'animals', nameAr: 'أسد', nameEn: 'lion', emoji: '🦁', tint: 'from-yellow-100 to-orange-50' },
  { id: 'apple', category: 'fruits', nameAr: 'تفاحة', nameEn: 'apple', emoji: '🍎', tint: 'from-red-100 to-rose-50' },
  { id: 'banana', category: 'fruits', nameAr: 'موزة', nameEn: 'banana', emoji: '🍌', tint: 'from-yellow-100 to-lime-50' },
  { id: 'orange', category: 'fruits', nameAr: 'برتقالة', nameEn: 'orange', emoji: '🍊', tint: 'from-orange-100 to-amber-50' },
  { id: 'grapes', category: 'fruits', nameAr: 'عنب', nameEn: 'grapes', emoji: '🍇', tint: 'from-violet-100 to-purple-50' },
  { id: 'watermelon', category: 'fruits', nameAr: 'بطيخ', nameEn: 'watermelon', emoji: '🍉', tint: 'from-green-100 to-emerald-50' },
  { id: 'strawberry', category: 'fruits', nameAr: 'فراولة', nameEn: 'strawberry', emoji: '🍓', tint: 'from-pink-100 to-rose-50' },
  { id: 'spoon', category: 'tools', nameAr: 'ملعقة', nameEn: 'spoon', emoji: '🥄', tint: 'from-slate-100 to-stone-50' },
  { id: 'cup', category: 'tools', nameAr: 'كوب', nameEn: 'cup', emoji: '🥤', tint: 'from-teal-100 to-cyan-50' },
  { id: 'toothbrush', category: 'tools', nameAr: 'فرشاة أسنان', nameEn: 'toothbrush', emoji: '🪥', tint: 'from-sky-100 to-blue-50' },
  { id: 'chair', category: 'tools', nameAr: 'كرسي', nameEn: 'chair', emoji: '🪑', tint: 'from-stone-100 to-amber-50' },
  { id: 'key', category: 'tools', nameAr: 'مفتاح', nameEn: 'key', emoji: '🔑', tint: 'from-yellow-100 to-amber-50' },
  { id: 'ball', category: 'tools', nameAr: 'كرة', nameEn: 'ball', emoji: '⚽', tint: 'from-lime-100 to-green-50' },
  { id: 'car', category: 'transport', nameAr: 'سيارة', nameEn: 'car', emoji: '🚗', tint: 'from-blue-100 to-sky-50' },
  { id: 'bus', category: 'transport', nameAr: 'حافلة', nameEn: 'bus', emoji: '🚌', tint: 'from-amber-100 to-yellow-50' },
  { id: 'plane', category: 'transport', nameAr: 'طائرة', nameEn: 'plane', emoji: '✈️', tint: 'from-sky-100 to-indigo-50' },
  { id: 'train', category: 'transport', nameAr: 'قطار', nameEn: 'train', emoji: '🚂', tint: 'from-rose-100 to-orange-50' },
  { id: 'bike', category: 'transport', nameAr: 'دراجة', nameEn: 'bike', emoji: '🚲', tint: 'from-emerald-100 to-teal-50' },
  { id: 'boat', category: 'transport', nameAr: 'قارب', nameEn: 'boat', emoji: '⛵', tint: 'from-cyan-100 to-sky-50' },
];

export function itemsByCategory(category: MatchCategory) {
  return MATCH_ITEMS.filter((item) => item.category === category);
}

export function shuffleCopy<T>(list: T[], rand: () => number = Math.random): T[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pickOne<T>(list: T[], rand: () => number) {
  return list[Math.floor(rand() * list.length)];
}

export function matchingAccuracyRate(correctAttempts: number, totalAttempts: number) {
  if (totalAttempts <= 0) return 0;
  return Math.round((correctAttempts / totalAttempts) * 100);
}

export function isCorrectChoice(round: MatchRound, choiceId: string) {
  return round.correctId === choiceId;
}

export function buildMatchRound(params: {
  index: number;
  mode: MatchMode;
  usedPromptIds?: string[];
  rand?: () => number;
}): MatchRound {
  const rand = params.rand ?? Math.random;
  const used = new Set(params.usedPromptIds ?? []);
  const pool = MATCH_ITEMS.filter((item) => !used.has(item.id));
  const promptSource = pool.length ? pool : MATCH_ITEMS;
  const prompt = pickOne(promptSource, rand);

  if (params.mode === 'identical') {
    const distractors = shuffleCopy(
      MATCH_ITEMS.filter((item) => item.id !== prompt.id),
      rand
    ).slice(0, 3);
    const choices = shuffleCopy([prompt, ...distractors], rand);
    return {
      index: params.index,
      mode: 'identical',
      prompt,
      choices,
      correctId: prompt.id,
    };
  }

  const sameGroup = MATCH_ITEMS.filter(
    (item) => item.category === prompt.category && item.id !== prompt.id
  );
  const match = pickOne(sameGroup, rand);
  const others = shuffleCopy(
    MATCH_ITEMS.filter((item) => item.category !== prompt.category),
    rand
  ).slice(0, 3);
  const choices = shuffleCopy([match, ...others], rand);
  return {
    index: params.index,
    mode: 'category',
    prompt,
    choices,
    correctId: match.id,
  };
}

export function buildSessionRounds(rand: () => number = Math.random): MatchRound[] {
  const rounds: MatchRound[] = [];
  const used: string[] = [];
  for (let i = 0; i < IDENTICAL_ROUND_COUNT; i += 1) {
    const round = buildMatchRound({
      index: i,
      mode: 'identical',
      usedPromptIds: used,
      rand,
    });
    used.push(round.prompt.id);
    rounds.push(round);
  }
  const categoryUsed: string[] = [];
  for (let i = 0; i < CATEGORY_ROUND_COUNT; i += 1) {
    const round = buildMatchRound({
      index: IDENTICAL_ROUND_COUNT + i,
      mode: 'category',
      usedPromptIds: categoryUsed,
      rand,
    });
    categoryUsed.push(round.prompt.id);
    rounds.push(round);
  }
  return rounds;
}

export function buildSensoryMatchingMetrics(params: {
  correctAttempts: number;
  totalAttempts: number;
  firstTryCorrect: number;
  responseTimesMs: number[];
  roundsCompleted: number;
}): SensoryMatchingMetrics {
  const avgResponseMs =
    params.responseTimesMs.length === 0
      ? 0
      : Math.round(
          params.responseTimesMs.reduce((sum, n) => sum + n, 0) /
            params.responseTimesMs.length
        );
  const accuracyRate = matchingAccuracyRate(
    params.correctAttempts,
    params.totalAttempts
  );
  return {
    gameCode: SENSORY_MATCHING_GAME_CODE,
    roundsCompleted: params.roundsCompleted,
    correctAttempts: params.correctAttempts,
    totalAttempts: params.totalAttempts,
    firstTryCorrect: params.firstTryCorrect,
    avgResponseMs,
    accuracyRate,
    levelReached:
      params.roundsCompleted > IDENTICAL_ROUND_COUNT ? 'category' : 'identical',
    linkedCriteria: [...SENSORY_MATCHING_CRITERIA],
    scoring: 'child_playable',
  };
}

export function sensoryMatchingChipDetail(metrics: {
  correctAttempts?: number;
  avgResponseMs?: number;
  accuracyRate?: number;
}) {
  const correct = Math.round(Number(metrics.correctAttempts ?? 0));
  const ms = Math.round(Number(metrics.avgResponseMs ?? 0));
  const rate = Math.round(Number(metrics.accuracyRate ?? 0));
  return `${correct} صحيحة · ${ms}ms · ${rate}% دقة`;
}

export function resolveMatchingChildId(childId?: string) {
  if (childId) return childId;
  if (typeof window === 'undefined') return 'child_local';
  try {
    const s = JSON.parse(localStorage.getItem('taaluf.activeStudent') || 'null');
    return s?.id || 'child_local';
  } catch {
    return 'child_local';
  }
}

export type SensoryMatchingLocalResult = {
  childId: string;
  completedAt: string;
  domain: string;
  gameId: typeof SENSORY_MATCHING_GAME_CODE;
  metrics: SensoryMatchingMetrics;
};

export function persistSensoryMatchingResult(
  metrics: SensoryMatchingMetrics,
  childId?: string
): SensoryMatchingLocalResult | null {
  if (typeof window === 'undefined') return null;
  const id = resolveMatchingChildId(childId);
  const completedAt = new Date().toISOString();
  const result: SensoryMatchingLocalResult = {
    childId: id,
    completedAt,
    domain: SENSORY_MATCHING_DOMAIN_LABEL,
    gameId: SENSORY_MATCHING_GAME_CODE,
    metrics,
  };
  try {
    localStorage.setItem(SENSORY_MATCHING_LOCAL_KEY, JSON.stringify(result));
  } catch {
    /* ignore */
  }
  try {
    const key = 'taaluf.gameSessions.v1';
    const prev = JSON.parse(localStorage.getItem(key) || '[]');
    const list = Array.isArray(prev) ? prev : [];
    const sessionId = `local_${SENSORY_MATCHING_GAME_CODE}_${id}`;
    const session = {
      id: sessionId,
      childId: id,
      gameCode: SENSORY_MATCHING_GAME_CODE,
      score: metrics.accuracyRate,
      levelReached: metrics.levelReached === 'category' ? 2 : 1,
      metrics,
      trials: [],
      startedAt: completedAt,
      endedAt: completedAt,
    };
    localStorage.setItem(
      key,
      JSON.stringify(
        [session, ...list.filter((row: { id?: string }) => row?.id !== sessionId)].slice(
          0,
          40
        )
      )
    );
  } catch {
    /* ignore */
  }
  return result;
}

export function readSensoryMatchingLocalResult(): SensoryMatchingLocalResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SENSORY_MATCHING_LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SensoryMatchingLocalResult;
    if (!parsed?.metrics) return null;
    return parsed;
  } catch {
    return null;
  }
}
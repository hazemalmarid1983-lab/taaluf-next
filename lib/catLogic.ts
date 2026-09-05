import { CRITERIA_LIST, type Criterion } from '@/types/taalof';

export type CatAnswer = { criterionId: string; score: number };

const SEED_PER_DOMAIN = 1;
const FOLLOWUP_THRESHOLD = 2;

/** بذرة واحدة من كل مجال ثم تعميق المجالات ذات الحاجة الأعلى */
export function selectCatQueue(params?: {
  answered?: CatAnswer[];
  maxItems?: number;
}): Criterion[] {
  const answered = new Map(
    (params?.answered || []).map((a) => [a.criterionId, a.score])
  );
  const maxItems = params?.maxItems ?? CRITERIA_LIST.length;
  const byDomain = new Map<string, Criterion[]>();
  for (const c of CRITERIA_LIST) {
    const list = byDomain.get(c.domain) || [];
    list.push(c);
    byDomain.set(c.domain, list);
  }

  const queue: Criterion[] = [];
  const seen = new Set<string>();

  for (const items of byDomain.values()) {
    const seed = items[0];
    if (seed && !seen.has(seed.id)) {
      queue.push(seed);
      seen.add(seed.id);
    }
  }

  const hotDomains = new Set<string>();
  for (const [id, score] of answered) {
    if (score >= FOLLOWUP_THRESHOLD) {
      const c = CRITERIA_LIST.find((x) => x.id === id);
      if (c) hotDomains.add(c.domain);
    }
  }

  const rest = CRITERIA_LIST.filter((c) => !seen.has(c.id)).sort((a, b) => {
    const ah = hotDomains.has(a.domain) ? 0 : 1;
    const bh = hotDomains.has(b.domain) ? 0 : 1;
    return ah - bh;
  });

  for (const c of rest) {
    if (queue.length >= maxItems) break;
    queue.push(c);
    seen.add(c.id);
  }

  return queue.slice(0, maxItems);
}

export function nextCatItem(answered: CatAnswer[]): Criterion | null {
  const done = new Set(answered.map((a) => a.criterionId));
  const queue = selectCatQueue({ answered });
  return queue.find((c) => !done.has(c.id)) || null;
}

export const CAT_SEED_COUNT = SEED_PER_DOMAIN;

/**
 * معزّزات لوحة «أولاً / ثم» — منزلية + غرف حسية.
 */

import { SENSORY_ROOMS } from './sensoryHub';

export type ScheduleCard = {
  emoji: string;
  labelAr: string;
  labelEn: string;
};

export type ScheduleReward = ScheduleCard & {
  id: string;
  href?: string;
  category?: 'home' | 'sensory';
};

export const SENSORY_REWARD_PREFIX = 'sensory:';

export const HOME_SCHEDULE_REWARDS: ScheduleReward[] = [
  { id: 'play', emoji: '🧸', labelAr: 'اللعب', labelEn: 'Playtime', category: 'home' },
  { id: 'bubbles', emoji: '🫧', labelAr: 'الفقاعات', labelEn: 'Bubbles', category: 'home' },
  { id: 'break', emoji: '🛋️', labelAr: 'الاستراحة', labelEn: 'A break', category: 'home' },
  { id: 'song', emoji: '🎵', labelAr: 'الأغنية المفضلة', labelEn: 'A favourite song', category: 'home' },
  { id: 'snack', emoji: '🍎', labelAr: 'الوجبة الخفيفة', labelEn: 'A snack', category: 'home' },
  { id: 'tablet', emoji: '📱', labelAr: 'الجهاز اللوحي', labelEn: 'Tablet time', category: 'home' },
  { id: 'outdoor', emoji: '🌳', labelAr: 'النزهة القصيرة', labelEn: 'A short walk', category: 'home' },
  { id: 'hug', emoji: '🤗', labelAr: 'العناق والتشجيع', labelEn: 'A hug and praise', category: 'home' },
];

export const SENSORY_SCHEDULE_REWARDS: ScheduleReward[] = SENSORY_ROOMS.map((room) => ({
  id: `${SENSORY_REWARD_PREFIX}${room.id}`,
  emoji: room.emoji,
  labelAr: room.titleAr,
  labelEn: room.titleEn,
  href: room.href,
  category: 'sensory' as const,
}));

export const SCHEDULE_REWARDS: ScheduleReward[] = [
  ...HOME_SCHEDULE_REWARDS,
  ...SENSORY_SCHEDULE_REWARDS,
];

export function isSensoryScheduleReward(reward: ScheduleReward | null | undefined) {
  return Boolean(
    reward?.category === 'sensory' ||
      reward?.id.startsWith(SENSORY_REWARD_PREFIX) ||
      reward?.href?.startsWith('/sensory-rooms/')
  );
}

export function sensoryRoomHrefFromReward(reward: ScheduleReward) {
  if (reward.href) return reward.href;
  const roomId = reward.id.replace(SENSORY_REWARD_PREFIX, '');
  return `/sensory-rooms/${roomId}`;
}

export const REINFORCER_TIMER_STORAGE_KEY = 'taaluf.sensoryReinforcer.v1';

export type SensoryReinforcerHandoff = {
  href: string;
  totalSec: number;
  startedAt: number;
};

export function stashSensoryReinforcerHandoff(
  handoff: Pick<SensoryReinforcerHandoff, 'href' | 'totalSec'> & { startedAt?: number }
) {
  if (typeof window === 'undefined') return;
  const payload: SensoryReinforcerHandoff = {
    href: handoff.href,
    totalSec: handoff.totalSec,
    startedAt: handoff.startedAt ?? Date.now(),
  };
  try {
    sessionStorage.setItem(REINFORCER_TIMER_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}

export function readSensoryReinforcerHandoff(): SensoryReinforcerHandoff | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(REINFORCER_TIMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SensoryReinforcerHandoff;
    if (!parsed?.href || !parsed.totalSec) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSensoryReinforcerHandoff() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(REINFORCER_TIMER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function reinforcerSecondsRemaining(handoff: SensoryReinforcerHandoff) {
  const elapsed = Math.floor((Date.now() - handoff.startedAt) / 1000);
  return Math.max(0, handoff.totalSec - elapsed);
}

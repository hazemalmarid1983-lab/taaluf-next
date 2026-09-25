/**
 * تقييم سريع بعد انتهاء أهداف الجلسة، وقبل حفظ التقرير.
 * ليس تشخيصاً للحالة المزاجية.
 */

import type { RegulationZoneId } from '@/lib/regulationZones';

export const POST_SESSION_MOODS = [
  { id: 'excited', labelAr: 'متحمس', labelEn: 'Excited', emoji: '🤩', zone: 'green' },
  { id: 'calm', labelAr: 'هادئ', labelEn: 'Calm', emoji: '🙂', zone: 'green' },
  { id: 'tired', labelAr: 'متعب', labelEn: 'Tired', emoji: '😴', zone: 'blue' },
  { id: 'anxious', labelAr: 'قلق', labelEn: 'Anxious', emoji: '😟', zone: 'yellow' },
] as const;

export type PostSessionMoodId = (typeof POST_SESSION_MOODS)[number]['id'];

export function isPostSessionMood(value: unknown): value is PostSessionMoodId {
  return POST_SESSION_MOODS.some((mood) => mood.id === value);
}

export function postSessionMoodById(id?: PostSessionMoodId | null) {
  if (!id) return undefined;
  return POST_SESSION_MOODS.find((mood) => mood.id === id);
}

export function postSessionMoodZone(id: PostSessionMoodId): RegulationZoneId {
  return postSessionMoodById(id)?.zone ?? 'green';
}

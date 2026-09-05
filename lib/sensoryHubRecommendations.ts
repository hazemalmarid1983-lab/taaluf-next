/**
 * توصيات الغرف الحسية بناءً على أهداف الخطة الفردية.
 */

import { SENSORY_ROOMS, type SensoryRoomId } from './sensoryHub';
import type { TrackedGoal } from './goalsEngine';

export type RecommendedSensoryRoom = {
  id: SensoryRoomId;
  emoji: string;
  titleAr: string;
  titleEn: string;
  href: string;
  reasonAr: string;
  reasonEn: string;
};

const DOMAIN_ROOMS: Record<string, SensoryRoomId[]> = {
  'السلوك والتكيف والحواس واستقلالية الذات': ['stars', 'rain', 'bubbles'],
  'التواصل الاستجابي والتعبيري': ['animals', 'bubbles'],
  'التفاعل والاندماج الاجتماعي واللعب': ['animals', 'bubbles', 'mirror'],
  'النمو المعرفي والحلول الإدراكية': ['tracing', 'sand', 'stars'],
  'المهارات الأكاديمية المبكرة': ['tracing', 'sand', 'animals'],
  'الاستقلالية في الحياة اليومية': ['tracing', 'sand', 'waves'],
};

const KEYWORD_ROOMS: Array<{ pattern: RegExp; rooms: SensoryRoomId[]; reasonAr: string; reasonEn: string }> = [
  {
    pattern: /كتاب|رسم|خط|إمساك|قبض|حرك|دقيق|ما قبل/i,
    rooms: ['tracing', 'sand'],
    reasonAr: 'يدعم مهارات ما قبل الكتابة والتحكم الحركي الدقيق',
    reasonEn: 'Supports pre-writing and fine motor control',
  },
  {
    pattern: /نطق|كلام|تواصل|صوت|لغ|تعبير|محاك/i,
    rooms: ['animals', 'bubbles'],
    reasonAr: 'يعزّز المحاكاة السمعية والنطق',
    reasonEn: 'Reinforces auditory modelling and speech',
  },
  {
    pattern: /تنظيم|تهدئة|هدوء|تنفس|قلق|حس/i,
    rooms: ['stars', 'rain', 'waves'],
    reasonAr: 'يساعد على التنظيم الحسي والتهدئة',
    reasonEn: 'Supports sensory regulation and calming',
  },
  {
    pattern: /لعب|تفاعل|اجتماع|مرآة|وجه/i,
    rooms: ['mirror', 'animals'],
    reasonAr: 'يدعم التفاعل الاجتماعي والمحاكاة',
    reasonEn: 'Supports social interaction and modelling',
  },
];

function roomMeta(id: SensoryRoomId) {
  const room = SENSORY_ROOMS.find((r) => r.id === id)!;
  return {
    id,
    emoji: room.emoji,
    titleAr: room.titleAr,
    titleEn: room.titleEn,
    href: room.href,
  };
}

/** يقترح غرفة أو غرفتين بناءً على مجالات وأهداف الخطة */
export function recommendSensoryRoomsForGoals(
  goals: TrackedGoal[],
  limit = 2
): RecommendedSensoryRoom[] {
  const scored = new Map<SensoryRoomId, { score: number; reasonAr: string; reasonEn: string }>();

  for (const goal of goals) {
    const domainRooms = DOMAIN_ROOMS[goal.domain] || [];
    for (const roomId of domainRooms) {
      const prev = scored.get(roomId);
      scored.set(roomId, {
        score: (prev?.score ?? 0) + 2,
        reasonAr: prev?.reasonAr || `مرتبط بمجال ${goal.domain}`,
        reasonEn: prev?.reasonEn || `Linked to ${goal.domain}`,
      });
    }

    const blob = `${goal.title} ${goal.smartText} ${goal.domain}`;
    for (const rule of KEYWORD_ROOMS) {
      if (!rule.pattern.test(blob)) continue;
      for (const roomId of rule.rooms) {
        const prev = scored.get(roomId);
        scored.set(roomId, {
          score: (prev?.score ?? 0) + 3,
          reasonAr: rule.reasonAr,
          reasonEn: rule.reasonEn,
        });
      }
    }
  }

  if (!scored.size) {
    const fallback: SensoryRoomId[] = ['bubbles', 'stars'];
    return fallback.slice(0, limit).map((id) => ({
      ...roomMeta(id),
      reasonAr: 'غرفة حسية عامة للتنظيم والاستمتاع',
      reasonEn: 'General sensory room for regulation and enjoyment',
    }));
  }

  return [...scored.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([id, meta]) => ({
      ...roomMeta(id),
      reasonAr: meta.reasonAr,
      reasonEn: meta.reasonEn,
    }));
}

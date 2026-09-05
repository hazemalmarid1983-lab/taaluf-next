/**
 * مسارات التجربة الغامرة (غرف حسية / ألعاب) — إخفاء ويدجات التطوير وملء الشاشة.
 */

const SENSORY_ROOM_PREFIX = '/sensory-rooms/';
const GAME_PLAY_PREFIX = '/games/';

/** داخل غرفة حسية فعلية (ليس فهرس الجناح). */
export function isSensoryRoomSessionPath(path: string): boolean {
  const normalized = path.split('?')[0]?.split('#')[0] || path;
  if (normalized === '/sensory-room' || normalized.startsWith('/sensory-room/')) {
    return true;
  }
  if (!normalized.startsWith(SENSORY_ROOM_PREFIX)) return false;
  const slug = normalized.slice(SENSORY_ROOM_PREFIX.length).replace(/\/$/, '');
  return slug.length > 0;
}

/** صفحة لعب (ليس فهرس الألعاب). */
export function isGamePlayPath(path: string): boolean {
  const normalized = path.split('?')[0]?.split('#')[0] || path;
  if (normalized.startsWith(GAME_PLAY_PREFIX)) {
    const slug = normalized.slice(GAME_PLAY_PREFIX.length).replace(/\/$/, '');
    return slug.length > 0;
  }
  if (normalized === '/sensory-matching') return true;
  return false;
}

export function shouldHideRbacWidget(path: string): boolean {
  return isSensoryRoomSessionPath(path) || isGamePlayPath(path);
}

export const RBAC_WIDGET_COLLAPSED_KEY = 'taaluf.rbac.widgetCollapsed.v1';

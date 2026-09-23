/**
 * مسارات الأنشطة التدريبية حسب mediaId.
 */

const ATTENTION_FOCUS_ROUTES: Record<string, string> = {
  'follow-star': '/dashboard/training/attention-focus/follow-star',
  'match-me': '/dashboard/training/attention-focus/match-me',
  'where-did-it-go': '/dashboard/training/attention-focus/where-did-it-go',
  'find-the-target': '/dashboard/training/attention-focus/find-the-target',
  'wait-then-touch': '/dashboard/training/attention-focus/wait-then-touch',
};

const COMMUNICATION_LANGUAGE_ROUTES: Record<string, string> = {
  'tap-to-request':
    '/dashboard/training/communication-language/tap-to-request',
  'symbol-board-request':
    '/dashboard/training/communication-language/symbol-board-request',
  'listen-then-tap':
    '/dashboard/training/communication-language/listen-then-tap',
  'point-to-item': '/dashboard/training/communication-language/point-to-item',
  'name-call-tap': '/dashboard/training/communication-language/name-call-tap',
};

export function resolveTrainingActivityRoute(
  chapterId: string,
  mediaId: string
): string | null {
  if (chapterId === 'attention-focus') {
    return ATTENTION_FOCUS_ROUTES[mediaId] ?? null;
  }
  if (chapterId === 'communication-language') {
    return COMMUNICATION_LANGUAGE_ROUTES[mediaId] ?? null;
  }
  return null;
}

export function resolveTrainingActivityRouteOrThrow(
  chapterId: string,
  mediaId: string
): string {
  const route = resolveTrainingActivityRoute(chapterId, mediaId);
  if (!route) {
    throw new Error(`لا يوجد مسار نشاط لـ ${chapterId}/${mediaId}`);
  }
  return route;
}

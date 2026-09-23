/**
 * مسار إكمال tap-to-request — اختيار الشاشة والروابط (بدون تغيير القياس/الحفظ).
 */

import { calculateSessionMetrics } from '@/lib/training/engine/metrics';
import type { TrainingSessionMetrics } from '@/lib/training/engine/types';
import type { TrainingSessionRuntime } from '@/lib/training/engine/types';

export const TAP_TO_REQUEST_MEDIA_ID = 'tap-to-request';
export const TAP_TO_REQUEST_TRAINING_HOME = '/dashboard/training';

export function shouldUseTapToRequestCompleteScreen(
  mediaId: string,
  session: TrainingSessionRuntime | null,
  phase: string
): boolean {
  return (
    mediaId === TAP_TO_REQUEST_MEDIA_ID &&
    phase === 'complete' &&
    session !== null &&
    session.status === 'completed'
  );
}

export function metricsForCompletedSession(
  session: TrainingSessionRuntime
): TrainingSessionMetrics {
  return calculateSessionMetrics(session.trials);
}

export function resolveTapToRequestDoneHref(mediaId: string): string {
  if (mediaId === TAP_TO_REQUEST_MEDIA_ID) {
    return TAP_TO_REQUEST_TRAINING_HOME;
  }
  return TAP_TO_REQUEST_TRAINING_HOME;
}

export function resolveTapToRequestSessionDetailHref(sessionId: string): string {
  return `/dashboard/training/sessions/${encodeURIComponent(sessionId)}`;
}

export type TapToRequestChildIdResolution =
  | { ok: true; childId: string }
  | { ok: false; reason: 'missing_child' | 'child_mismatch' };

/** tap-to-request: يتطلب activeStudent — لا child_local */
export function resolveTapToRequestSessionChildId(input: {
  mediaId: string;
  beginChildId: string;
  activeChildId: string | null;
  planId?: string;
}): TapToRequestChildIdResolution {
  if (input.mediaId !== TAP_TO_REQUEST_MEDIA_ID) {
    return { ok: true, childId: input.beginChildId };
  }

  if (!input.activeChildId) {
    return { ok: false, reason: 'missing_child' };
  }

  if (
    input.planId &&
    input.beginChildId !== 'child_local' &&
    input.beginChildId !== input.activeChildId
  ) {
    return { ok: false, reason: 'child_mismatch' };
  }

  return { ok: true, childId: input.activeChildId };
}

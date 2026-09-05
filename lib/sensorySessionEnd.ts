/** سبب إيقاف الجلسة الحسية */
export type SensorySessionEndReason =
  | 'time'
  | 'interactions'
  | 'manual'
  | 'reinforcer'
  | 'complete';

export function sensoryEndReasonLabel(
  reason: SensorySessionEndReason,
  isAr: boolean
): string {
  const labels: Record<SensorySessionEndReason, { ar: string; en: string }> = {
    time: { ar: 'انتهى الوقت المحدد', en: 'Time is up' },
    interactions: { ar: 'اكتمل عدد المحاولات', en: 'Attempt limit reached' },
    manual: { ar: 'إيقاف يدوي من الولي', en: 'Stopped by parent' },
    reinforcer: { ar: 'انتهى وقت المعزّز', en: 'Reward time ended' },
    complete: { ar: 'اكتمل النشاط', en: 'Activity complete' },
  };
  return isAr ? labels[reason].ar : labels[reason].en;
}

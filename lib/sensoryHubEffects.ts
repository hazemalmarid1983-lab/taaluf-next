/**
 * مساعدات غرفة المطر — شدة المطر من مستوى الصوت المحيط (بدون تسجيل).
 */

/** rms 0–1 من AnalyserNode → شدة مطر 0.15–0.85 (هدوء = مطر أخف) */
export function rainIntensityFromRms(rms: number) {
  const loud = Math.max(0, Math.min(1, rms * 6));
  return 0.85 - loud * 0.55;
}

export function clampTilt(value: number, min = -1, max = 1) {
  return Math.max(min, Math.min(max, value));
}

/** تحويل ميل الجهاز أو السحب إلى -1…1 */
export function normalizeTilt(beta: number | null, dragOffset: number, w: number) {
  if (beta !== null && Number.isFinite(beta)) {
    return clampTilt((beta - 45) / 35);
  }
  return clampTilt(dragOffset / Math.max(w * 0.35, 1));
}

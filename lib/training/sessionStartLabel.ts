/** نص زر بدء الجلسة حسب ترتيبها التالي في الخطة. */
export function startSessionLabel(sessionNumber?: number | null): string {
  const number = Number(sessionNumber);
  if (!Number.isInteger(number) || number < 1) return 'ابدأ الجلسة';
  return `ابدأ الجلسة رقم ${number}`;
}

export const ACTION_PRACTICE_COACH_NOTE_AR =
  'هذا التمرين تطبيقي: اطلب من طفلك تنفيذ الأمر في الواقع، ثم سجّل طريقة استجابته ونوع الدعم الذي احتاج إليه عبر القائمة الجانبية.';

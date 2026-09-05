import type { PhysicianSummaryData } from '@/components/PhysicianClinicalSummary';

export const DOCTOR_DEMO_CODE = 'TAALUF-CLINIC';

export function doctorReferralCode(childId: string): string {
  const compact =
    String(childId || 'child')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-8)
      .toUpperCase() || 'CHILD';
  return `TFL-${compact}`;
}

export function isValidDoctorReferral(
  childId: string,
  code?: string | null
): boolean {
  const c = String(code || '').trim().toUpperCase();
  if (!c) return false;
  if (c === DOCTOR_DEMO_CODE) return true;
  return c === doctorReferralCode(childId).toUpperCase();
}

export function doctorSummaryPath(childId: string): string {
  const code = doctorReferralCode(childId);
  return `/doctor/summary/${encodeURIComponent(childId)}?code=${encodeURIComponent(code)}`;
}

export const DEMO_PHYSICIAN_SUMMARY: PhysicianSummaryData = {
  childName: 'ميار أحمد',
  ageMonths: 84,
  birthDate: '9 يوليو 2019',
  doctorName: 'د. عيادة النمو والتطور',
  trackingPlan: 'annual',
  assessmentsHistory: [
    {
      round: 'التقييم الأول (خط الأساس)',
      date: '10 يناير 2026',
      overallNeed: 48,
      communicationScore: 60,
      socialScore: 50,
      cognitiveScore: 40,
      sensoryBehaviorScore: 42,
    },
    {
      round: 'التقييم الثاني (مراجعة 3 أشهر)',
      date: '15 أبريل 2026',
      overallNeed: 35,
      communicationScore: 45,
      socialScore: 38,
      cognitiveScore: 30,
      sensoryBehaviorScore: 28,
    },
    {
      round: 'التقييم الثالث (مراجعة 6 أشهر)',
      date: '14 أغسطس 2026',
      overallNeed: 24,
      communicationScore: 30,
      socialScore: 25,
      cognitiveScore: 20,
      sensoryBehaviorScore: 22,
    },
  ],
  redFlagsIdentified: [
    'حساسية سمعية شديدة تجاه الأصوات المفاجئة العالية.',
    'تجنب التواصل البصري في بداية المواقف غير المألوفة.',
    'نوبات غضب عند التغيير المفاجئ في الروتين دون تنبيه مسبق.',
  ],
  masteredGoalsCount: 6,
  activeGoalsCount: 3,
};

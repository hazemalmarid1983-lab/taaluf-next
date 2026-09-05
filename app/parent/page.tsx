import { cookies } from 'next/headers';
import ParentHomeDashboard from '@/components/parent/ParentHomeDashboard';
import {
  canAccessAssessment,
  ENTITLEMENTS_COOKIE,
  parseEntitlements,
} from '@/lib/access';

/** بوابة ولي الأمر: ترحيب إن لم يُسجَّل طفل، وبطاقة الملف النشط مع مسار التقييم إن وُجد. */
export default function ParentHomePage() {
  const entitlements = parseEntitlements(
    cookies().get(ENTITLEMENTS_COOKIE)?.value
  );
  const unlocked = canAccessAssessment(entitlements);

  return (
    <ParentHomeDashboard
      unlocked={unlocked}
      studentNameFromEntitlements={entitlements.studentName}
    />
  );
}

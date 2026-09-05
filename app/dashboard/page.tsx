'use client';

import DualPathwayRecord from '@/components/records/DualPathwayRecord';
import SpecialistCaseload from '@/components/specialist/SpecialistCaseload';
import NextBestActionCard from '@/components/dashboard/NextBestActionCard';
import SpecialistAssessmentRedirect from '@/components/flow/SpecialistAssessmentRedirect';
import PermissionGate from '@/components/access/PermissionGate';
import { useLanguage } from '@/components/LanguageProvider';

export default function DashboardPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <div className="space-y-8 text-start">
      <SpecialistAssessmentRedirect />
      <NextBestActionCard isAr={isAr} />
      <PermissionGate permission="view_child_progress">
        <DualPathwayRecord />
      </PermissionGate>
      <PermissionGate
        permissions={['manage_all_cases', 'manage_assigned_cases']}
        match="any"
      >
        <SpecialistCaseload />
      </PermissionGate>
    </div>
  );
}

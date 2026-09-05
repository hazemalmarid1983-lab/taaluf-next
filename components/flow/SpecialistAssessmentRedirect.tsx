'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { loadStoredAssessments } from '@/lib/assessmentHelpers';
import {
  SPECIALIST_FIRST_ASSESSMENT_HREF,
  specialistNeedsFirstAssessment,
} from '@/lib/nextBestActionFlow';

/** Redirects specialists with no assessments to the first-assessment flow. */
export default function SpecialistAssessmentRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated') return;
    const role = session?.user?.role;
    if (role !== 'specialist' && role !== 'teacher') return;
    if (!specialistNeedsFirstAssessment(loadStoredAssessments())) return;
    router.replace(SPECIALIST_FIRST_ASSESSMENT_HREF);
  }, [session, status, router]);

  return null;
}

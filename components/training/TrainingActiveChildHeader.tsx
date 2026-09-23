'use client';

import { trainingDashboardHeading } from '@/lib/training/trainingActiveChildUx';
import { useActiveTrainingStudent } from '@/lib/training/useActiveTrainingStudent';

export default function TrainingActiveChildHeader() {
  const profile = useActiveTrainingStudent();
  const heading = trainingDashboardHeading(profile);

  if (!heading) return null;

  return (
    <header className="mb-6 text-right" dir="rtl">
      <h1 className="text-xl font-black text-[#0b1f14] sm:text-2xl">{heading}</h1>
    </header>
  );
}

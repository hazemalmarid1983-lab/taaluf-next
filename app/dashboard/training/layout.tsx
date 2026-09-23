'use client';

import { usePathname } from 'next/navigation';
import TrainingBackNav from '@/components/training/TrainingBackNav';
import { resolveTrainingBackNav } from '@/lib/training/trainingNavLinks';

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const back = resolveTrainingBackNav(pathname);

  return (
    <div dir="rtl">
      {back ? <TrainingBackNav href={back.href} label={back.label} /> : null}
      {children}
    </div>
  );
}

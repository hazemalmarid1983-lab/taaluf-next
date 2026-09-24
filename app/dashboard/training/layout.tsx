'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import TrainingBackNav from '@/components/training/TrainingBackNav';
import { PRICING_PATH } from '@/lib/subscriptionTiers';
import { resolveTrainingBackNav } from '@/lib/training/trainingNavLinks';

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const back =
    status === 'loading'
      ? null
      : session?.user?.role === 'parent'
        ? { href: PRICING_PATH, label: 'استعراض باقات الاشتراك' }
        : resolveTrainingBackNav(pathname);

  return (
    <div dir="rtl">
      {back ? <TrainingBackNav href={back.href} label={back.label} /> : null}
      {children}
    </div>
  );
}

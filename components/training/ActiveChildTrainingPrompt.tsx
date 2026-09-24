'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { PRICING_PATH } from '@/lib/subscriptionTiers';
import {
  parentHasRegisteredChildForTraining,
  resolveTrainingChildPromptRole,
  SPECIALIST_TRAINING_CHILD_LINKS,
} from '@/lib/training/trainingActiveChildUx';
import { PARENT_ROUTES } from '@/lib/parentJourney';
import { CHILD_ROOM_PATH } from '@/lib/childRoom/gate';

type Props = {
  title?: string;
  subtitle?: string;
  className?: string;
};

export default function ActiveChildTrainingPrompt({
  title = 'يرجى تحديد الطفل قبل بدء التدريب',
  subtitle = 'اختر طفلاً من حالاتك أو سجّل حالة جديدة، ثم ارجع إلى التدريب.',
  className = '',
}: Props) {
  const { data: session, status } = useSession();
  const role = resolveTrainingChildPromptRole(session?.user?.role);
  const isParent = status !== 'authenticated' || role === 'parent';

  const hasParentChild = parentHasRegisteredChildForTraining();

  return (
    <div
      className={`rounded-2xl bg-amber-50 p-8 text-center shadow-sm ${className}`}
      dir="rtl"
    >
      <p className="text-lg font-semibold text-amber-900">
        {isParent ? 'لم يُسجَّل طفل بعد' : title}
      </p>
      {isParent ? (
        <p className="mt-2 text-sm text-amber-900/80">
          ابدأ بالفرز السريع، ثم اختر الباقة وسجّل الطفل لفتح غرفته.
        </p>
      ) : subtitle ? (
        <p className="mt-2 text-sm text-amber-900/80">{subtitle}</p>
      ) : null}

      {isParent ? (
        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
          <Button type="button" className="w-full" size="lg" asChild>
            <Link href={PARENT_ROUTES.screening}>ابدأ الفرز السريع</Link>
          </Button>
          <Button type="button" variant="outline" className="w-full" size="lg" asChild>
            <Link href={hasParentChild ? CHILD_ROOM_PATH : PARENT_ROUTES.register}>
              {hasParentChild ? 'غرفة الطفل' : 'تسجيل طفل جديد'}
            </Link>
          </Button>
          <Link
            href={PRICING_PATH}
            className="text-sm font-semibold text-[#2E7D8E] hover:underline"
          >
            استعراض باقات الاشتراك
          </Link>
        </div>
      ) : (
        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
          <Button type="button" className="w-full" size="lg" asChild>
            <Link href={SPECIALIST_TRAINING_CHILD_LINKS.chooseCaseload}>
              اختيار من حالاتي
            </Link>
          </Button>
          <Button type="button" variant="outline" className="w-full" size="lg" asChild>
            <Link href={SPECIALIST_TRAINING_CHILD_LINKS.newStudent}>
              تسجيل حالة جديدة
            </Link>
          </Button>
          <Link
            href={SPECIALIST_TRAINING_CHILD_LINKS.buildPlan}
            className="text-sm font-semibold text-[#2E7D8E] hover:underline"
          >
            بناء خطة تدريب
          </Link>
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  parentHasRegisteredChildForTraining,
  resolveParentTrainingChildHref,
  resolveTrainingChildPromptRole,
  SPECIALIST_TRAINING_CHILD_LINKS,
} from '@/lib/training/trainingActiveChildUx';

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
  const { data: session } = useSession();
  const role = resolveTrainingChildPromptRole(session?.user?.role);
  const isParent = role === 'parent';

  const hasParentChild = parentHasRegisteredChildForTraining();
  const parentHref = resolveParentTrainingChildHref(hasParentChild);
  const parentCta = 'تسجيل / تحديد الطفل';

  return (
    <div
      className={`rounded-2xl bg-amber-50 p-8 text-center shadow-sm ${className}`}
      dir="rtl"
    >
      <p className="text-lg font-semibold text-amber-900">{title}</p>
      {subtitle ? (
        <p className="mt-2 text-sm text-amber-900/80">{subtitle}</p>
      ) : null}

      {isParent ? (
        <Button type="button" className="mt-6 w-full max-w-sm" size="lg" asChild>
          <Link href={parentHref}>{parentCta}</Link>
        </Button>
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

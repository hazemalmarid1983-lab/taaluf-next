'use client';

import { useRouter } from 'next/navigation';
import ActiveChildTrainingPrompt from '@/components/training/ActiveChildTrainingPrompt';
import { Button } from '@/components/ui/button';

const MESSAGES = {
  missing_child: 'يرجى تحديد الطفل قبل بدء التدريب.',
  invalid_launch:
    'تعذر فتح النشاط ضمن البرنامج التدريبي. ارجع إلى البرنامج وحاول مرة أخرى.',
} as const;

type PlanActivityGuardReason = keyof typeof MESSAGES;

export default function PlanActivityGuardMessage({
  reason,
}: {
  reason: PlanActivityGuardReason;
}) {
  const router = useRouter();

  if (reason === 'missing_child') {
    return (
      <div className="mx-auto max-w-lg">
        <ActiveChildTrainingPrompt subtitle="اختر الطفل النشط ثم ابدأ النشاط من لوحة التدريب أو من الخطة." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-amber-50 p-8 text-center shadow-sm">
      <p className="text-lg font-semibold text-amber-900">{MESSAGES[reason]}</p>
      <Button
        type="button"
        className="mt-6 w-full"
        size="lg"
        onClick={() => router.push('/dashboard/training')}
      >
        العودة إلى التدريب
      </Button>
    </div>
  );
}

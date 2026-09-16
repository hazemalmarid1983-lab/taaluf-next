'use client';

import { useRouter } from 'next/navigation';

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

  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-amber-50 p-8 text-center shadow-sm">
      <p className="text-lg font-semibold text-amber-900">{MESSAGES[reason]}</p>
      <button
        type="button"
        onClick={() => router.push('/dashboard/training')}
        className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-700"
      >
        العودة إلى التدريب
      </button>
    </div>
  );
}

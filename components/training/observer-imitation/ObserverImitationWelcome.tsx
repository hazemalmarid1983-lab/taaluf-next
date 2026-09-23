'use client';

import { Button } from '@/components/ui/button';
import { OBSERVER_IMITATION_SESSION_DISCLAIMER_AR } from '@/lib/training/observerImitationResultsPresentation';

type Props = {
  onStart: () => void;
};

export default function ObserverImitationWelcome({ onStart }: Props) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#0f2a2e] via-[#163840] to-[#0b1f14] px-6 text-center text-white"
      dir="rtl"
    >
      <h1 className="text-2xl font-bold sm:text-3xl">التقليد الحركي والاجتماعي</h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
        شاهد النموذج على الشاشة، ثم نفّذ الحركة. المراقب يسجّل النتيجة والمساعدة.
      </p>
      <p className="mt-3 max-w-md text-xs leading-6 text-amber-100/90">
        {OBSERVER_IMITATION_SESSION_DISCLAIMER_AR}
      </p>
      <Button
        type="button"
        size="lg"
        className="mt-8 h-14 min-w-[11rem] rounded-2xl bg-[#2E7D8E] text-lg hover:bg-[#256b79]"
        onClick={onStart}
      >
        ابدأ
      </Button>
    </div>
  );
}

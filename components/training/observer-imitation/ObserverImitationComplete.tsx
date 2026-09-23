'use client';

import { Button } from '@/components/ui/button';
import {
  formatObserverImitationSessionSummary,
  OBSERVER_IMITATION_SESSION_DISCLAIMER_AR,
  OBSERVER_IMITATION_SESSION_TITLE_AR,
} from '@/lib/training/observerImitationResultsPresentation';

type Props = {
  accuracy: number;
  independence: number;
  totalTrials: number;
  sessionSaved: boolean;
  onDone: () => void;
};

export default function ObserverImitationComplete({
  accuracy,
  independence,
  totalTrials,
  sessionSaved,
  onDone,
}: Props) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#0f2a2e] via-[#163840] to-[#0b1f14] px-6 text-center text-white"
      dir="rtl"
    >
      <h2 className="text-xl font-bold">{OBSERVER_IMITATION_SESSION_TITLE_AR}</h2>
      <p className="mt-4 text-sm text-white/85">
        {formatObserverImitationSessionSummary({
          accuracy,
          independence,
          totalTrials,
        })}
      </p>
      <p className="mt-4 max-w-md text-xs leading-6 text-amber-100/90">
        {OBSERVER_IMITATION_SESSION_DISCLAIMER_AR}
      </p>
      <p className="mt-3 text-sm text-white/75">
        {sessionSaved
          ? 'تم حفظ أداء الجلسة على هذا الجهاز'
          : 'تعذّر حفظ الجلسة — أعد المحاولة لاحقاً'}
      </p>
      <Button
        type="button"
        size="lg"
        variant="outline"
        className="mt-8 border-white/30 bg-white/10 text-white hover:bg-white/20"
        onClick={onDone}
      >
        تم
      </Button>
    </div>
  );
}

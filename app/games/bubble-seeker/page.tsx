'use client';

import Link from 'next/link';
import BubbleSeekerGame, {
  type GameTelemetryMetrics,
} from '@/components/games/BubbleSeekerGame';
import { persistBubbleSeekerLocalResult } from '@/lib/bubbleSeeker';
import { PARENT_ROUTES } from '@/lib/parentJourney';

export default function BubbleSeekerPage() {
  const handleGameFinished = (metrics: GameTelemetryMetrics) => {
    persistBubbleSeekerLocalResult(metrics);
  };

  return (
    <div
      className="min-h-screen bg-[#04131D] p-4 text-white sm:p-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-teal-300">
              لعبة صائد الفقاعات والتواصل
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              مغامرة بحرية تفاعلية ترصد الانتباه المشترك وسرعة التتبع البصري دون
              نصوص معقدة. مؤشر تربوي مساند، وليس تشخيصاً طبياً.
            </p>
          </div>
          <Link
            href={PARENT_ROUTES.games}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs text-white transition hover:bg-white/20"
          >
            العودة للألعاب
          </Link>
        </div>

        <BubbleSeekerGame onFinishGame={handleGameFinished} />
      </div>
    </div>
  );
}

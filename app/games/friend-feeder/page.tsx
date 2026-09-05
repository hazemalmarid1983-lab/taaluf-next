'use client';

import Link from 'next/link';
import FriendFeederGame, {
  type TurnTakingMetrics,
} from '@/components/games/FriendFeederGame';
import { persistFriendFeederLocalResult } from '@/lib/friendFeeder';
import { PARENT_ROUTES } from '@/lib/parentJourney';

export default function FriendFeederPage() {
  const handleGameFinished = (metrics: TurnTakingMetrics) => {
    persistFriendFeederLocalResult(metrics);
  };

  return (
    <div className="min-h-screen bg-[#0F2018] p-4 text-white sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-300">
              لعبة إطعام الصديق وتبادل الأدوار
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              بيئة غابة تفاعلية ترصد مهارة تبادل الأدوار والصبر دون نصوص معقدة.
              مؤشر تربوي على C18 وC19، وليس تشخيصاً طبياً.
            </p>
          </div>
          <Link
            href={PARENT_ROUTES.games}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs text-white transition hover:bg-white/20"
          >
            العودة للألعاب
          </Link>
        </div>

        <FriendFeederGame onFinishGame={handleGameFinished} />
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import WorkingMemoryTrainGame, {
  type WorkingMemoryMetrics,
} from '@/components/games/WorkingMemoryTrainGame';
import { PARENT_ROUTES, readActiveChild } from '@/lib/parentJourney';

// ملفات صفحات App Router لا تقبل تصديرات مسمّاة، فتبقى الثوابت محلية
const MEMORY_TRAIN_GAME_CODE = 'memory_train';
const MEMORY_TRAIN_LOCAL_KEY = 'taaluf_game_memory_train';

function persistMemoryTrainResult(metrics: WorkingMemoryMetrics) {
  const child = readActiveChild();
  const result = {
    gameId: MEMORY_TRAIN_GAME_CODE,
    childId: child?.id || 'child_local',
    domain: 'الذاكرة العاملة وسرعة المعالجة',
    metrics,
    completedAt: new Date().toISOString(),
  };
  localStorage.setItem(MEMORY_TRAIN_LOCAL_KEY, JSON.stringify(result));
}

export default function MemoryTrainPage() {
  const handleGameFinished = (metrics: WorkingMemoryMetrics) => {
    persistMemoryTrainResult(metrics);
  };

  return (
    <div className="min-h-screen bg-[#0B1319] p-4 text-white sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-cyan-300">
              لعبة قطار الذاكرة العاملة
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              نشاط تفاعلي يرصد سعة الاسترجاع قصير المدى وسرعة المعالجة. مؤشر
              تربوي مساند لمسار صعوبات التعلم، وليس تشخيصاً طبياً.
            </p>
          </div>
          <Link
            href={PARENT_ROUTES.games}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs text-white transition hover:bg-white/20"
          >
            العودة للألعاب
          </Link>
        </div>

        <WorkingMemoryTrainGame onFinishGame={handleGameFinished} />
      </div>
    </div>
  );
}

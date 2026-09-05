'use client';

import Link from 'next/link';
import EmotionMirrorGame, {
  type EmotionRecognitionMetrics,
} from '@/components/games/EmotionMirrorGame';
import { useLanguage } from '@/components/LanguageProvider';
import { PARENT_ROUTES, readActiveChild } from '@/lib/parentJourney';

// ملفات صفحات App Router لا تقبل تصديرات مسمّاة، فتبقى الثوابت محلية
const EMOTION_MIRROR_GAME_CODE = 'emotion_mirror';
const EMOTION_MIRROR_LOCAL_KEY = 'taaluf_game_emotion_mirror';

function persistEmotionMirrorResult(metrics: EmotionRecognitionMetrics) {
  const child = readActiveChild();
  const result = {
    gameId: EMOTION_MIRROR_GAME_CODE,
    childId: child?.id || 'child_local',
    domain: 'الإدراك الانفعالي والتفاعل الاجتماعي',
    metrics,
    completedAt: new Date().toISOString(),
  };
  localStorage.setItem(EMOTION_MIRROR_LOCAL_KEY, JSON.stringify(result));
}

export default function EmotionMirrorPage() {
  const { lang, dir } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0B1319] p-4 text-white sm:p-8" dir={dir}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-cyan-300">
              {lang === 'ar'
                ? 'لعبة مرآة المشاعر والتعابير'
                : 'Emotion Mirror Game'}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              {lang === 'ar'
                ? 'نشاط تفاعلي يرصد قراءة تعابير الوجه والمشاعر في المواقف اليومية. مؤشر تربوي على C12 وC14، وليس تشخيصاً طبياً.'
                : 'An interactive activity for facial expression reading in everyday scenes. Educational indicator for C12 and C14 — not a medical diagnosis.'}
            </p>
          </div>
          <Link
            href={PARENT_ROUTES.games}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs text-white transition hover:bg-white/20"
          >
            {lang === 'ar' ? 'العودة للألعاب' : 'Back to games'}
          </Link>
        </div>

        <EmotionMirrorGame onFinishGame={persistEmotionMirrorResult} />
      </div>
    </div>
  );
}

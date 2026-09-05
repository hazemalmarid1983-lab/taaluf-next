'use client';

import Link from 'next/link';
import LetterHunterGame, {
  type VisualDiscriminationMetrics,
} from '@/components/games/LetterHunterGame';
import { useLanguage } from '@/components/LanguageProvider';
import { PARENT_ROUTES, readActiveChild } from '@/lib/parentJourney';

// ملفات صفحات App Router لا تقبل تصديرات مسمّاة، فتبقى الثوابت محلية
const LETTER_HUNTER_GAME_CODE = 'letter_hunter';
const LETTER_HUNTER_LOCAL_KEY = 'taaluf_game_letter_hunter';

function persistLetterHunterResult(metrics: VisualDiscriminationMetrics) {
  const child = readActiveChild();
  const result = {
    gameId: LETTER_HUNTER_GAME_CODE,
    childId: child?.id || 'child_local',
    domain: 'التمييز البصري وسرعة المعالجة القرائية',
    academicDomain: 'dyslexia',
    metrics,
    completedAt: new Date().toISOString(),
  };
  localStorage.setItem(LETTER_HUNTER_LOCAL_KEY, JSON.stringify(result));
}

export default function LetterHunterPage() {
  const { lang, dir } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0B1319] p-4 text-white sm:p-8" dir={dir}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-amber-300">
              {lang === 'ar'
                ? 'لعبة صائد الحروف المتشابهة'
                : 'Letter Hunter Game'}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              {lang === 'ar'
                ? 'نشاط تفاعلي يرصد التمييز البصري بين الحروف المتشابهة وسرعة المعالجة القرائية. مؤشر تربوي لمحور القراءة، وليس تشخيصاً طبياً.'
                : 'An interactive activity for visual letter discrimination and reading processing speed. Educational reading indicator — not a medical diagnosis.'}
            </p>
          </div>
          <Link
            href={PARENT_ROUTES.games}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs text-white transition hover:bg-white/20"
          >
            {lang === 'ar' ? 'العودة للألعاب' : 'Back to games'}
          </Link>
        </div>

        <LetterHunterGame onFinishGame={persistLetterHunterResult} />
      </div>
    </div>
  );
}

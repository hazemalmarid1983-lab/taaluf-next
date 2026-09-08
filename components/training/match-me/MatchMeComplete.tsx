'use client';

import { Button } from '@/components/ui/button';

type Props = {
  stars: number;
  sessionSaved: boolean;
  onDone: () => void;
};

export default function MatchMeComplete({ stars, sessionSaved, onDone }: Props) {
  const displayStars = Math.min(3, Math.max(1, stars));

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#F7F3EB] via-[#EDE8DC] to-[#E4DDD0] px-6 text-center"
      dir="rtl"
    >
      <div className="relative z-10 flex flex-col items-center gap-6">
        <p className="text-lg font-semibold text-[#2E7D8E]">أحسنت!</p>
        <div
          className="flex items-center gap-2"
          role="img"
          aria-label={`${displayStars} من 3`}
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <span
              key={index}
              className={`inline-block h-10 w-10 rounded-full border-2 ${
                index < displayStars
                  ? 'border-[#2E7D8E] bg-[#2E7D8E]/15 shadow-[0_0_16px_rgba(46,125,142,0.35)]'
                  : 'border-[#CBD5E1] bg-white/40'
              }`}
              aria-hidden
            />
          ))}
        </div>
        <p className="text-sm text-[#4B5563]">
          {sessionSaved
            ? 'أكملت النشاط بنجاح'
            : 'أكملت النشاط — تعذّر حفظ النتيجة على هذا الجهاز'}
        </p>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="mt-4 h-14 min-w-[10rem] rounded-2xl border-[#2E7D8E]/30 bg-white/70 text-[#1F2A37] hover:bg-white"
          onClick={onDone}
        >
          تم
        </Button>
      </div>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';

type Props = {
  stars: number;
  sessionSaved: boolean;
  onDone: () => void;
};

export default function FollowStarComplete({
  stars,
  sessionSaved,
  onDone,
}: Props) {
  const displayStars = Math.min(3, Math.max(1, stars));

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#0c1a33] via-[#152845] to-[#0a1628] px-6 text-center text-white"
      dir="rtl"
    >
      <div className="relative z-10 flex flex-col items-center gap-6">
        <p className="text-lg text-[#E5B86E]">أحسنت!</p>
        <div
          className="flex items-center gap-2 text-5xl"
          role="img"
          aria-label={`${displayStars} من 3`}
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <span
              key={index}
              className={
                index < displayStars
                  ? 'text-[#ffd76a] drop-shadow-[0_0_12px_rgba(255,215,106,0.8)]'
                  : 'text-white/20'
              }
              aria-hidden
            >
              ★
            </span>
          ))}
        </div>
        <p className="text-sm text-white/75">
          {sessionSaved
            ? 'أكملت النشاط بنجاح'
            : 'أكملت النشاط — تعذّر حفظ النتيجة على هذا الجهاز'}
        </p>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="mt-4 h-14 min-w-[10rem] rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/20"
          onClick={onDone}
        >
          تم
        </Button>
      </div>
    </div>
  );
}

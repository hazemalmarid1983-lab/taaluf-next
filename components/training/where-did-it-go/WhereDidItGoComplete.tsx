'use client';

import { Button } from '@/components/ui/button';

type Props = {
  stars: number;
  sessionSaved: boolean;
  onDone: () => void;
};

export default function WhereDidItGoComplete({
  stars,
  sessionSaved,
  onDone,
}: Props) {
  const displayStars = Math.min(3, Math.max(1, stars));

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#EEF4F8] via-[#E4ECF2] to-[#D8E3EA] px-6 text-center"
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
              className={`inline-block h-3 w-12 rounded-full ${
                index < displayStars
                  ? 'bg-[#2E7D8E] shadow-[0_0_12px_rgba(46,125,142,0.45)]'
                  : 'bg-[#CBD5E1]/60'
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
          className="mt-4 h-14 min-w-[10rem] rounded-2xl border-[#2E7D8E]/30 bg-white/80 text-[#1F2A37] hover:bg-white"
          onClick={onDone}
        >
          تم
        </Button>
      </div>
    </div>
  );
}

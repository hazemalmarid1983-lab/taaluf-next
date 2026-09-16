'use client';

import { Button } from '@/components/ui/button';

type Props = {
  stars: number;
  sessionSaved: boolean;
  onDone: () => void;
};

export default function FindTheTargetComplete({
  stars,
  sessionSaved,
  onDone,
}: Props) {
  const displayStars = Math.min(3, Math.max(1, stars));

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#F3F6FA] via-[#E8EEF5] to-[#DDE5EF] px-6 text-center"
      dir="rtl"
    >
      <div className="relative z-10 flex flex-col items-center gap-6">
        <p className="text-lg font-semibold text-[#4B5EB8]">أحسنت!</p>
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
                  ? 'border-[#4B5EB8] bg-[#4B5EB8]/12 shadow-[0_0_16px_rgba(75,94,184,0.3)]'
                  : 'border-[#CBD5E1] bg-white/50'
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
          className="mt-4 h-14 min-w-[10rem] rounded-2xl border-[#4B5EB8]/25 bg-white/75 text-[#1F2A37] hover:bg-white"
          onClick={onDone}
        >
          تم
        </Button>
      </div>
    </div>
  );
}

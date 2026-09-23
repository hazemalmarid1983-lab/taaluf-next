'use client';

import { Button } from '@/components/ui/button';
import MatchVisual from '@/components/training/match-me/MatchVisual';
import type { MatchVisualItem } from '@/lib/training/matchMeEngine';

type Props = {
  title: string;
  sampleTarget: MatchVisualItem;
  onStart: () => void;
};

export default function FindTheTargetWelcome({
  title,
  sampleTarget,
  onStart,
}: Props) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#F3F6FA] via-[#E8EEF5] to-[#DDE5EF] px-6 text-center"
      dir="rtl"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-45"
      >
        <div className="absolute -left-20 top-16 h-56 w-56 rounded-full bg-[#4B5EB8]/12 blur-3xl" />
        <div className="absolute -right-16 bottom-20 h-64 w-64 rounded-full bg-[#2E7D8E]/12 blur-3xl" />
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center gap-8">
        <div className="flex h-36 w-36 items-center justify-center rounded-[2rem] border-2 border-[#4B5EB8]/20 bg-white/85 shadow-[0_24px_64px_rgba(75,94,184,0.14)]">
          <MatchVisual item={sampleTarget} sizePx={96} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[#1F2A37] sm:text-4xl">
          {title}
        </h1>

        <p className="text-sm text-[#4B5563]">ابحث عن الهدف بين العناصر</p>

        <Button
          type="button"
          size="lg"
          className="h-16 min-w-[12rem] rounded-2xl bg-[#4B5EB8] text-lg font-bold text-white hover:bg-[#3F4FA0] focus-visible:ring-[#4B5EB8]/50"
          onClick={onStart}
          aria-label="ابدأ النشاط"
        >
          ابدأ
        </Button>
      </div>
    </div>
  );
}

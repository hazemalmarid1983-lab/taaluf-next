'use client';

import { Button } from '@/components/ui/button';
import MatchVisual from '@/components/training/match-me/MatchVisual';
import type { MatchVisualItem } from '@/lib/training/matchMeEngine';

type Props = {
  title: string;
  sampleTarget: MatchVisualItem;
  onStart: () => void;
};

export default function WhereDidItGoWelcome({ title, sampleTarget, onStart }: Props) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#EEF4F8] via-[#E4ECF2] to-[#D8E3EA] px-6 text-center"
      dir="rtl"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-40"
      >
        <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-[#2E7D8E]/10 blur-3xl" />
        <div className="absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-[#4B5EB8]/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center gap-8">
        <div className="flex h-48 w-full max-w-sm items-center justify-center rounded-[2rem] border border-[#2E7D8E]/15 bg-white/85 shadow-[0_24px_64px_rgba(46,125,142,0.12)]">
          <MatchVisual item={sampleTarget} sizePx={110} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[#1F2A37] sm:text-4xl">
          {title}
        </h1>

        <p className="text-sm text-[#4B5563]">شاهد… ثم اختر أين ذهب</p>

        <Button
          type="button"
          size="lg"
          className="h-16 min-w-[12rem] rounded-2xl bg-[#2E7D8E] text-lg font-bold text-white hover:bg-[#256878] focus-visible:ring-[#2E7D8E]/50"
          onClick={onStart}
          aria-label="ابدأ النشاط"
        >
          ابدأ
        </Button>
      </div>
    </div>
  );
}

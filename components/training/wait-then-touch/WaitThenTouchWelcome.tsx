'use client';

import { Button } from '@/components/ui/button';
import MatchVisual from '@/components/training/match-me/MatchVisual';
import type { MatchVisualItem } from '@/lib/training/matchMeEngine';

type Props = {
  title: string;
  sampleTarget: MatchVisualItem;
  onStart: () => void;
};

export default function WaitThenTouchWelcome({
  title,
  sampleTarget,
  onStart,
}: Props) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#F5F2EB] via-[#EDE8DC] to-[#E2DDD0] px-6 text-center"
      dir="rtl"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-45"
      >
        <div className="absolute -left-16 top-20 h-64 w-64 rounded-full bg-[#3A9B6E]/10 blur-3xl" />
        <div className="absolute -right-12 bottom-16 h-72 w-72 rounded-full bg-[#E08A3C]/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center gap-8">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#94A3B8]/40" />
          <div className="flex h-32 w-32 items-center justify-center rounded-[1.5rem] border-2 border-[#CBD5E1] bg-white/80 opacity-70 shadow-inner">
            <MatchVisual item={sampleTarget} sizePx={88} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-36 w-36 rounded-full border-4 border-[#3A9B6E]/50 bg-[#3A9B6E]/10 motion-safe:animate-pulse" />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[#1F2A37] sm:text-4xl">
          {title}
        </h1>

        <p className="text-sm text-[#4B5563]">انتظر الإشارة… ثم المس</p>

        <Button
          type="button"
          size="lg"
          className="h-16 min-w-[12rem] rounded-2xl bg-[#3A9B6E] text-lg font-bold text-white hover:bg-[#2E8A5E] focus-visible:ring-[#3A9B6E]/50"
          onClick={onStart}
          aria-label="ابدأ النشاط"
        >
          ابدأ
        </Button>
      </div>
    </div>
  );
}

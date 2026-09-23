'use client';

import { Button } from '@/components/ui/button';
import MatchVisual from '@/components/training/match-me/MatchVisual';
import type { MatchVisualItem } from '@/lib/training/matchMeEngine';

type Props = {
  title: string;
  sampleItem: MatchVisualItem;
  onStart: () => void;
};

export default function MatchMeWelcome({ title, sampleItem, onStart }: Props) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#F7F3EB] via-[#EDE8DC] to-[#E4DDD0] px-6 text-center"
      dir="rtl"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-50"
      >
        <div className="absolute -left-16 top-20 h-64 w-64 rounded-full bg-[#2E7D8E]/10 blur-3xl" />
        <div className="absolute -right-12 bottom-16 h-72 w-72 rounded-full bg-[#C94C4C]/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center gap-8">
        <div className="flex h-44 w-44 items-center justify-center rounded-[2rem] border border-[#2E7D8E]/15 bg-white/80 shadow-[0_20px_60px_rgba(46,125,142,0.12)] backdrop-blur-sm">
          <MatchVisual item={sampleItem} sizePx={120} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[#1F2A37] sm:text-4xl">
          {title}
        </h1>

        <p className="text-sm text-[#4B5563]">اختر الشكل المطابق للصورة</p>

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

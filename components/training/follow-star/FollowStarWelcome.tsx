'use client';

import { Button } from '@/components/ui/button';
import FollowStarVisual from '@/components/training/follow-star/FollowStarVisual';

type Props = {
  title: string;
  onStart: () => void;
};

export default function FollowStarWelcome({ title, onStart }: Props) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-[#0c1a33] via-[#122544] to-[#0a1628] px-6 text-center text-white"
      dir="rtl"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-40"
      >
        <div className="absolute -left-20 top-16 h-56 w-56 rounded-full bg-[#2E7D8E]/20 blur-3xl" />
        <div className="absolute -right-16 bottom-20 h-64 w-64 rounded-full bg-[#E5B86E]/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div
          className="flex h-40 w-40 items-center justify-center rounded-full border-4 border-[#fff3bf]/70 bg-gradient-to-br from-[#fff7dc]/30 to-[#ffd76a]/20 shadow-[0_0_60px_rgba(229,184,110,0.35)] motion-safe:animate-pulse"
          aria-hidden
        >
          <FollowStarVisual size={88} />
        </div>

        <h1 className="max-w-md text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>

        <p className="max-w-sm text-sm text-white/70">
          تابع النجمة بلمسة واحدة عندما تتوقف
        </p>

        <Button
          type="button"
          size="lg"
          className="h-16 min-w-[12rem] rounded-2xl bg-[#E5B86E] text-lg font-bold text-[#1a2740] hover:bg-[#f0c878] focus-visible:ring-[#E5B86E]/60"
          onClick={onStart}
          aria-label="ابدأ النشاط"
        >
          ابدأ
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useId } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { parentScreeningEntryHref } from '@/lib/parentJourney';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  clickable?: boolean;
  href?: string;
  tone?: 'light' | 'dark';
};

const ICON_SIZES = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10 sm:h-11 sm:w-11',
  lg: 'h-14 w-14 sm:h-16 sm:w-16',
};

const TITLE_SIZES = {
  sm: 'text-lg',
  md: 'text-xl sm:text-2xl',
  lg: 'text-2xl sm:text-3xl',
};

export default function TaalufLogo({
  size = 'md',
  showSubtitle = true,
  clickable = true,
  href = parentScreeningEntryHref(),
  tone = 'light',
}: LogoProps) {
  const { lang, t } = useLanguage();
  const uid = useId().replace(/:/g, '');
  const tealId = `taalufTeal-${uid}`;
  const amberId = `taalufAmber-${uid}`;
  const dark = tone === 'dark';

  const content = (
    <div className="group flex select-none items-center gap-3">
      <div
        className={`relative flex items-center justify-center ${ICON_SIZES[size]}`}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#2E7D8E] via-teal-400 to-amber-400 opacity-40 blur-md transition-opacity duration-300 group-hover:opacity-70" />
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-white bg-white/85 p-2 shadow-[0_4px_16px_rgba(46,125,142,0.15)] backdrop-blur-xl transition-transform group-hover:scale-105">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id={tealId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2E7D8E" />
                <stop offset="100%" stopColor="#0E4A56" />
              </linearGradient>
              <linearGradient id={amberId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <path
              d="M30 75C20 60 22 35 48 24C48 45 42 68 30 75Z"
              fill={`url(#${tealId})`}
            />
            <path
              d="M70 75C80 60 78 35 52 24C52 45 58 68 70 75Z"
              fill={`url(#${amberId})`}
              opacity="0.9"
            />
            <circle cx="50" cy="30" r="7" fill="#2E7D8E" />
            <circle cx="50" cy="30" r="3.5" fill="#FFFFFF" />
            <path
              d="M35 72C45 78 55 78 65 72"
              stroke="#2E7D8E"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span
            className={`bg-clip-text font-black tracking-tight text-transparent ${TITLE_SIZES[size]} ${
              dark
                ? 'bg-gradient-to-r from-white via-cyan-100 to-amber-200'
                : 'bg-gradient-to-r from-slate-900 via-[#1E3A4C] to-[#2E7D8E]'
            }`}
          >
            {lang === 'ar' ? 'تآلف' : 'TAALUF'}
          </span>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        </div>
        {showSubtitle && (
          <span
            className={`-mt-0.5 text-[10px] font-semibold tracking-normal sm:text-[11px] ${
              dark ? 'text-white/70' : 'text-slate-500'
            }`}
          >
            {t('brandTagline')}
          </span>
        )}
      </div>
    </div>
  );

  if (!clickable) return content;
  return <Link href={href}>{content}</Link>;
}

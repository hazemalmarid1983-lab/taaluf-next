'use client';

import Link from 'next/link';
import type { UnifiedNextAction } from '@/lib/nextBestActionFlow';

const PRIORITY_STYLES = {
  critical:
    'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-amber-50 ring-2 ring-rose-200/60',
  high: 'border-[#2E7D8E]/35 bg-gradient-to-br from-teal-50 via-white to-emerald-50 ring-2 ring-[#2E7D8E]/20',
  medium:
    'border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50 ring-1 ring-violet-100',
  low: 'border-slate-200 bg-gradient-to-br from-slate-50 to-white',
} as const;

/**
 * بطاقة الإجراء التالي الأفضل — خطوة واحدة بارزة لكل دور.
 */
export default function FrictionlessNextAction({
  action,
  isAr,
  className,
  compact = false,
}: {
  action: UnifiedNextAction | null;
  isAr: boolean;
  className?: string;
  compact?: boolean;
}) {
  if (!action) {
    return (
      <div
        className={`h-36 animate-pulse rounded-3xl border border-slate-200 bg-slate-100 ${className || ''}`}
      />
    );
  }

  const title = isAr ? action.titleAr : action.titleEn;
  const body = isAr ? action.bodyAr : action.bodyEn;
  const reason = isAr ? action.reasonAr : action.reasonEn;
  const cta = isAr ? action.ctaAr : action.ctaEn;
  const stepLabel = isAr ? action.stepLabelAr : action.stepLabelEn;
  const secondaryCta = isAr
    ? action.secondaryCtaAr
    : action.secondaryCtaEn;

  return (
    <article
      className={`rounded-3xl border p-6 shadow-[0_16px_48px_rgba(0,0,0,0.07)] sm:p-7 ${PRIORITY_STYLES[action.priority]} ${className || ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {isAr ? 'الخطوة التالية · لا تخمّن' : 'Next best action · no guessing'}
          </p>
          {stepLabel ? (
            <p className="mt-1 text-[11px] font-semibold text-[#2E7D8E]">
              {stepLabel}
            </p>
          ) : null}
        </div>
        {typeof action.progressPct === 'number' ? (
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[#2D8B5A]">
            {isAr ? `${action.progressPct}٪` : `${action.progressPct}%`}
          </span>
        ) : null}
      </div>

      {typeof action.progressPct === 'number' && !compact ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-[#2D8B5A] transition-all duration-500"
            style={{ width: `${action.progressPct}%` }}
          />
        </div>
      ) : null}

      <div className={`flex items-start gap-4 ${compact ? 'mt-3' : 'mt-5'}`}>
        <span className="text-4xl leading-none">{action.emoji}</span>
        <div className="min-w-0 flex-1">
          <h2
            className={`font-black text-[#0b1f14] ${compact ? 'text-lg' : 'text-xl sm:text-2xl'}`}
          >
            {title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
          {reason ? (
            <p className="mt-1 text-xs font-semibold text-slate-400">{reason}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={action.href}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-[#0b1f14] px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-[#1a3d28] active:scale-[0.99] sm:flex-none"
        >
          {cta} {isAr ? '←' : '→'}
        </Link>
        {action.secondaryHref && secondaryCta ? (
          <Link
            href={action.secondaryHref}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            {secondaryCta}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

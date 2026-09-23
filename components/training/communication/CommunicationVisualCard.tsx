'use client';

import type { CommunicationCatalogItem } from '@/lib/training/communicationVisualCatalog';
import { CommunicationVisualIllustration } from '@/components/training/communication/CommunicationVisualIllustrations';

export type CommunicationVisualCardState =
  | 'default'
  | 'assistance'
  | 'selected-correct'
  | 'selected-incorrect'
  | 'dimmed';

type Props = {
  item: CommunicationCatalogItem;
  sizePx?: number;
  state?: CommunicationVisualCardState;
  as?: 'div' | 'button';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export default function CommunicationVisualCard({
  item,
  sizePx = 128,
  state = 'default',
  as = 'div',
  disabled = false,
  onClick,
  className = '',
}: Props) {
  const assetId =
    item.visual.type === 'inline-svg' ? item.visual.assetId : 'comm-ill-water';

  const shell = [
    'flex w-full max-w-[11rem] flex-col items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition-all motion-reduce:transition-none sm:max-w-[12rem] sm:p-5',
    state === 'default' && 'border border-slate-100',
    state === 'assistance' &&
      'border-2 border-dashed border-sky-400/70 bg-sky-50/40 ring-2 ring-sky-200/50',
    state === 'selected-correct' &&
      'border-2 border-emerald-500/80 bg-emerald-50/50 ring-2 ring-emerald-200/60',
    state === 'selected-incorrect' &&
      'border-2 border-rose-300/70 bg-rose-50/40 opacity-90',
    state === 'dimmed' && 'border border-slate-100 opacity-55',
    as === 'button' &&
      !disabled &&
      'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(46,125,142,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D8E]/50',
    disabled && 'pointer-events-none',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inner = (
    <>
      <CommunicationVisualIllustration assetId={assetId} size={sizePx} />
      <p className="text-center text-base font-bold text-slate-800 sm:text-lg">
        {item.labelAr}
      </p>
    </>
  );

  if (as === 'button') {
    return (
      <button
        type="button"
        className={shell}
        disabled={disabled}
        aria-label={item.ariaLabelAr}
        onClick={onClick}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={shell} aria-label={item.ariaLabelAr}>
      {inner}
    </div>
  );
}

'use client';

import type { CommPictogram } from '@/lib/training/communicationChoiceEngine';

type Props = {
  item: CommPictogram;
  sizePx?: number;
  highlighted?: boolean;
  /** مساعدة بصرية — لا تُستخدم كحالة اختيار/إتقان */
  assistanceHint?: boolean;
};

export default function CommPictogramVisual({
  item,
  sizePx = 96,
  highlighted = false,
  assistanceHint = false,
}: Props) {
  const radius =
    item.shape === 'circle' ? '9999px' : item.shape === 'rounded' ? '1.25rem' : '0.5rem';

  const largeLabel = sizePx >= 120;
  const borderStyle = assistanceHint
    ? `3px dashed ${item.color}99`
    : highlighted
      ? `4px solid ${item.color}`
      : `3px solid ${item.color}55`;
  const boxShadow = assistanceHint
    ? `0 0 0 4px ${item.color}18`
    : highlighted
      ? `0 0 0 6px ${item.color}33`
      : '0 12px 32px rgba(15,23,42,0.08)';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 transition-transform duration-300 ${
        assistanceHint ? 'motion-safe:animate-pulse opacity-95' : ''
      }`}
      style={{
        width: sizePx,
        height: sizePx,
        borderRadius: radius,
        backgroundColor: assistanceHint ? `${item.color}14` : `${item.color}22`,
        border: borderStyle,
        boxShadow,
      }}
      aria-hidden
    >
      <div
        style={{
          width: sizePx * 0.45,
          height: sizePx * 0.45,
          borderRadius: radius,
          backgroundColor: item.color,
          opacity: assistanceHint ? 0.85 : 1,
        }}
      />
      <span
        className={
          largeLabel
            ? 'text-sm font-bold text-slate-800 sm:text-base'
            : 'text-[10px] font-bold text-slate-700 sm:text-xs'
        }
      >
        {item.labelAr}
      </span>
    </div>
  );
}

export function commPictogramAriaLabel(item: CommPictogram): string {
  return item.labelAr;
}

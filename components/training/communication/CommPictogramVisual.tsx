'use client';

import EducationalIllustration from '@/components/visuals/EducationalIllustration';
import type { CommPictogram } from '@/lib/training/communicationChoiceEngine';
import { hasEducationalIllustration } from '@/components/visuals/EducationalIllustration';

type Props = {
  item: CommPictogram;
  sizePx?: number;
  highlighted?: boolean;
  assistanceHint?: boolean;
};

export default function CommPictogramVisual({
  item,
  sizePx = 96,
  highlighted = false,
  assistanceHint = false,
}: Props) {
  const artSize = Math.round(sizePx * 0.82);
  const largeLabel = sizePx >= 120;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 ${
        assistanceHint ? 'motion-safe:animate-pulse' : ''
      }`}
      style={{ width: sizePx, minHeight: sizePx }}
    >
      <div
        className="flex items-center justify-center rounded-3xl bg-white"
        style={{
          width: sizePx,
          height: artSize,
          boxShadow: highlighted
            ? `0 0 0 4px ${item.color}`
            : '0 10px 24px rgba(15,23,42,0.08)',
          outline: assistanceHint ? `3px dashed ${item.color}` : undefined,
        }}
      >
        <EducationalIllustration
          asset={item.id}
          size={artSize}
          label={item.labelAr}
        />
      </div>
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

export { hasEducationalIllustration as hasCommPictogramArt };

'use client';

import EducationalIllustration from '@/components/visuals/EducationalIllustration';
import type { MatchVisualItem } from '@/lib/training/matchMeEngine';

type Props = {
  item: MatchVisualItem;
  sizePx?: number;
  className?: string;
  label?: string;
};

const SIZE_SCALE: Record<MatchVisualItem['size'], number> = {
  sm: 0.75,
  md: 1,
  lg: 1.25,
};

const SHAPE_ASSET: Record<MatchVisualItem['shape'], string> = {
  circle: 'circle',
  square: 'square',
  triangle: 'triangle',
  diamond: 'star',
};

/** أشكال كقطع ألعاب ملونة — ليست أيقونات هندسية مسطّحة. */
export default function MatchVisual({ item, sizePx = 96, className = '', label }: Props) {
  const scale = SIZE_SCALE[item.size];
  const dimension = Math.round(sizePx * scale);

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="img"
      aria-label={label ?? matchVisualAriaLabel(item)}
      style={{ filter: item.style === 'outline' ? 'saturate(0.7)' : undefined }}
    >
      <EducationalIllustration
        asset={SHAPE_ASSET[item.shape]}
        size={dimension}
        label={label ?? matchVisualAriaLabel(item)}
      />
    </div>
  );
}

export function matchVisualAriaLabel(item: MatchVisualItem): string {
  const shapeAr: Record<MatchVisualItem['shape'], string> = {
    circle: 'دائرة',
    square: 'مربع',
    triangle: 'مثلث',
    diamond: 'معين',
  };
  return `${shapeAr[item.shape]}${item.style === 'outline' ? ' محدّد' : ''}`;
}

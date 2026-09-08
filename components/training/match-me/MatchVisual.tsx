'use client';

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

function ShapeSvg({
  item,
  dimension,
}: {
  item: MatchVisualItem;
  dimension: number;
}) {
  const fill = item.style === 'outline' ? 'transparent' : item.color;
  const stroke = item.color;
  const strokeWidth = item.style === 'outline' ? 4 : 0;
  const half = dimension / 2;
  const pad = dimension * 0.12;

  if (item.shape === 'circle') {
    return (
      <circle
        cx={half}
        cy={half}
        r={half - pad}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (item.shape === 'square') {
    const side = dimension - pad * 2;
    return (
      <rect
        x={pad}
        y={pad}
        width={side}
        height={side}
        rx={8}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (item.shape === 'triangle') {
    const points = `${half},${pad} ${dimension - pad},${dimension - pad} ${pad},${
      dimension - pad
    }`;
    return (
      <polygon
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    );
  }

  const points = `${half},${pad} ${dimension - pad},${half} ${half},${
    dimension - pad
  } ${pad},${half}`;
  return (
    <polygon
      points={points}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  );
}

export default function MatchVisual({ item, sizePx = 96, className = '', label }: Props) {
  const scale = SIZE_SCALE[item.size];
  const dimension = Math.round(sizePx * scale);

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="img"
      aria-label={label ?? `شكل ${item.shape}`}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        aria-hidden={label ? undefined : true}
        className="drop-shadow-sm"
      >
        <ShapeSvg item={item} dimension={dimension} />
      </svg>
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

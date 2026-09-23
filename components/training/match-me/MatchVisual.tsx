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
  const half = dimension / 2;
  const pad = dimension * 0.14;
  const fillId = `match-fill-${item.id}`;
  const glossId = `match-gloss-${item.id}`;
  const filled = item.style !== 'outline';

  return (
    <>
      <defs>
        <radialGradient id={fillId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={filled ? 0.85 : 0.2} />
          <stop offset="28%" stopColor={item.color} stopOpacity={filled ? 1 : 0.15} />
          <stop offset="100%" stopColor={item.color} stopOpacity={filled ? 0.72 : 0} />
        </radialGradient>
        <linearGradient id={glossId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={`match-shadow-${item.id}`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy={dimension * 0.06} stdDeviation={dimension * 0.04} floodOpacity="0.28" />
        </filter>
      </defs>
      <g filter={`url(#match-shadow-${item.id})`}>
        {item.shape === 'circle' ? (
          <circle
            cx={half}
            cy={half}
            r={half - pad}
            fill={filled ? `url(#${fillId})` : 'transparent'}
            stroke={item.color}
            strokeWidth={filled ? 0 : 5}
          />
        ) : null}
        {item.shape === 'square' ? (
          <rect
            x={pad}
            y={pad}
            width={dimension - pad * 2}
            height={dimension - pad * 2}
            rx={dimension * 0.12}
            fill={filled ? `url(#${fillId})` : 'transparent'}
            stroke={item.color}
            strokeWidth={filled ? 0 : 5}
          />
        ) : null}
        {item.shape === 'triangle' ? (
          <polygon
            points={`${half},${pad} ${dimension - pad},${dimension - pad} ${pad},${dimension - pad}`}
            fill={filled ? `url(#${fillId})` : 'transparent'}
            stroke={item.color}
            strokeWidth={filled ? 0 : 5}
            strokeLinejoin="round"
          />
        ) : null}
        {item.shape === 'diamond' ? (
          <polygon
            points={`${half},${pad} ${dimension - pad},${half} ${half},${dimension - pad} ${pad},${half}`}
            fill={filled ? `url(#${fillId})` : 'transparent'}
            stroke={item.color}
            strokeWidth={filled ? 0 : 5}
            strokeLinejoin="round"
          />
        ) : null}
        {filled ? (
          <ellipse
            cx={half * 0.82}
            cy={half * 0.62}
            rx={half * 0.28}
            ry={half * 0.14}
            fill={`url(#${glossId})`}
          />
        ) : null}
      </g>
    </>
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
        className="drop-shadow-md"
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
